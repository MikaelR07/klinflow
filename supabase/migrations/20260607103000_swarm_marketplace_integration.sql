-- Migration: Support Bulk Drives (Swarms) in Marketplace

-- 1. Update marketplace_listings
ALTER TABLE public.marketplace_listings
ADD COLUMN swarm_id UUID REFERENCES public.swarms(id) ON DELETE SET NULL,
ADD COLUMN is_bulk_drive BOOLEAN DEFAULT false,
ADD COLUMN group_metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Update marketplace_orders
ALTER TABLE public.marketplace_orders
ADD COLUMN swarm_id UUID REFERENCES public.swarms(id) ON DELETE SET NULL;

-- 3. Create RPC for automated swarm payout split
CREATE OR REPLACE FUNCTION public.process_swarm_payout(
    p_order_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_order RECORD;
    v_total_payout DECIMAL;
    v_total_pledged DECIMAL;
    v_participant RECORD;
    v_user_share DECIMAL;
    v_wallet_record RECORD;
BEGIN
    -- Get the order
    SELECT * INTO v_order
    FROM public.marketplace_orders
    WHERE id = p_order_id FOR UPDATE;

    IF v_order IS NULL THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    IF v_order.status = 'completed' THEN
        RAISE EXCEPTION 'Order already completed';
    END IF;

    IF v_order.swarm_id IS NULL THEN
        RAISE EXCEPTION 'Not a bulk drive order';
    END IF;

    v_total_payout := v_order.total_price;

    -- Get total pledged weight for this swarm
    SELECT COALESCE(SUM(pledged_weight), 0) INTO v_total_pledged
    FROM public.swarm_participants
    WHERE swarm_id = v_order.swarm_id AND status != 'withdrawn';

    IF v_total_pledged = 0 THEN
        RAISE EXCEPTION 'No pledged weight found for swarm';
    END IF;

    -- Update order status
    UPDATE public.marketplace_orders
    SET status = 'completed', updated_at = NOW()
    WHERE id = p_order_id;

    -- Loop through participants and split the payout
    FOR v_participant IN 
        SELECT user_id, pledged_weight 
        FROM public.swarm_participants 
        WHERE swarm_id = v_order.swarm_id AND status != 'withdrawn'
    LOOP
        -- Calculate proportional share
        v_user_share := (v_participant.pledged_weight / v_total_pledged) * v_total_payout;
        
        IF v_user_share > 0 THEN
            -- Update or insert wallet balance
            INSERT INTO public.user_wallets (user_id, cash_balance, lifetime_cash_earned)
            VALUES (v_participant.user_id, v_user_share, v_user_share)
            ON CONFLICT (user_id) DO UPDATE 
            SET cash_balance = user_wallets.cash_balance + EXCLUDED.cash_balance,
                lifetime_cash_earned = user_wallets.lifetime_cash_earned + EXCLUDED.lifetime_cash_earned;

            -- Create transaction record
            INSERT INTO public.wallet_transactions (profile_id, amount, transaction_type, reference_id, metadata)
            VALUES (v_participant.user_id, v_user_share, 'payout', p_order_id, jsonb_build_object('role', 'seller', 'type', 'swarm_split', 'swarm_id', v_order.swarm_id));

            -- Send notification
            INSERT INTO public.notifications (target_user, target_role, type, title, body)
            VALUES (
                v_participant.user_id, 'user', 'success', 'Bulk Drive Payout! 💰',
                'Your community bulk drive just completed. KSh ' || ROUND(v_user_share, 2) || ' has been added to your wallet for your ' || v_participant.pledged_weight || 'kg contribution.'
            );
        END IF;
    END LOOP;

    -- Update Swarm status to completed
    UPDATE public.swarms
    SET status = 'completed', updated_at = NOW()
    WHERE id = v_order.swarm_id;

    RETURN jsonb_build_object('success', true, 'total_payout', v_total_payout);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
