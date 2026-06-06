-- Migration: Add 'completed' to rfqs status CHECK constraint
-- Reason: After verification + payout, RFQs should move to 'completed' status,
-- which is distinct from 'fulfilled' (offer accepted, awaiting delivery/verification).

-- 1. Drop old constraint and add new one with 'completed'
ALTER TABLE public.rfqs DROP CONSTRAINT IF EXISTS rfqs_status_check;
ALTER TABLE public.rfqs ADD CONSTRAINT rfqs_status_check 
  CHECK (status IN ('open', 'fulfilled', 'completed', 'closed', 'cancelled'));

-- 2. Update the process_rfq_payout RPC to set status = 'completed' (not 'fulfilled')
CREATE OR REPLACE FUNCTION public.process_rfq_payout(
    p_fulfillment_id UUID,
    p_weight_kg DECIMAL,
    p_grade TEXT,
    p_contamination INT
) RETURNS JSONB AS $$
DECLARE
    v_actual_agent_id UUID;
    v_order_status TEXT;
    v_seller_id UUID;
    v_proposal_id UUID;
    v_rfq_id UUID;
    v_price_per_kg DECIMAL;
    v_total_payout DECIMAL;
    v_assigned_agent_id UUID;
BEGIN
    v_actual_agent_id := auth.uid();
    IF v_actual_agent_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Lock the fulfillment order
    SELECT status, seller_id, proposal_id, assigned_agent_id, rfq_id
    INTO v_order_status, v_seller_id, v_proposal_id, v_assigned_agent_id, v_rfq_id
    FROM public.fulfillment_orders
    WHERE id = p_fulfillment_id
    FOR UPDATE;

    IF v_order_status = 'completed' THEN
        RAISE EXCEPTION 'Fulfillment already completed';
    END IF;

    IF v_assigned_agent_id IS DISTINCT FROM v_actual_agent_id THEN
        RAISE EXCEPTION 'Unauthorized: Caller is not the assigned agent';
    END IF;

    -- Get agreed price
    SELECT offered_price INTO v_price_per_kg
    FROM public.rfq_offers
    WHERE id = v_proposal_id;

    v_total_payout := p_weight_kg * COALESCE(v_price_per_kg, 0);

    -- Update Order
    UPDATE public.fulfillment_orders 
    SET status = 'completed',
        verification_status = 'verified',
        payment_status = 'released',
        verified_weight = p_weight_kg,
        quality_grade = p_grade,
        contamination_level = p_contamination,
        updated_at = NOW()
    WHERE id = p_fulfillment_id;

    -- Update RFQ to completed (now allowed by the updated CHECK constraint)
    IF v_rfq_id IS NOT NULL THEN
        UPDATE public.rfqs
        SET status = 'completed',
            updated_at = NOW()
        WHERE id = v_rfq_id;
    END IF;

    -- Pay seller
    IF v_seller_id IS NOT NULL AND v_total_payout > 0 THEN
        -- Add to user_wallets
        INSERT INTO public.user_wallets (user_id, cash_balance, lifetime_cash_earned)
        VALUES (v_seller_id, v_total_payout, v_total_payout)
        ON CONFLICT (user_id) DO UPDATE 
        SET cash_balance = user_wallets.cash_balance + EXCLUDED.cash_balance,
            lifetime_cash_earned = user_wallets.lifetime_cash_earned + EXCLUDED.lifetime_cash_earned;

        -- Add transaction
        INSERT INTO public.wallet_transactions (profile_id, amount, transaction_type, reference_id, metadata)
        VALUES (v_seller_id, v_total_payout, 'payout', p_fulfillment_id, jsonb_build_object('role', 'seller', 'type', 'rfq_buyback'));

        -- Notify Seller
        INSERT INTO public.notifications (target_user, target_role, type, title, body)
        VALUES (
            v_seller_id, 'user', 'success', 'RFQ Payment Received! 💰',
            'You just received KSh ' || ROUND(v_total_payout, 2) || ' for your RFQ delivery.'
        );
    END IF;

    RETURN jsonb_build_object('success', true, 'payout', v_total_payout);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
