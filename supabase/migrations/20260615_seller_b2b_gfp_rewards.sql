-- Migration: 20260615_seller_b2b_gfp_rewards.sql
-- Description: Updates process_rfq_payout and handle_escrow_payout to correctly award 2 GFP per 1 KG to sellers for B2B trades.

-- 1. Update RFQ Payout
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
    v_gfp_earned INTEGER;
    v_wallet_balance_before INTEGER;
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
    v_gfp_earned := FLOOR(p_weight_kg * 2);

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

    -- Update RFQ to completed
    IF v_rfq_id IS NOT NULL THEN
        UPDATE public.rfqs
        SET status = 'completed',
            updated_at = NOW()
        WHERE id = v_rfq_id;
    END IF;

    -- Pay seller
    IF v_seller_id IS NOT NULL AND v_total_payout > 0 THEN
        -- Add to user_wallets
        INSERT INTO public.user_wallets (user_id, cash_balance, lifetime_cash_earned, available_points, lifetime_earned)
        VALUES (v_seller_id, v_total_payout, v_total_payout, v_gfp_earned, v_gfp_earned)
        ON CONFLICT (user_id) DO UPDATE 
        SET cash_balance = user_wallets.cash_balance + EXCLUDED.cash_balance,
            lifetime_cash_earned = user_wallets.lifetime_cash_earned + EXCLUDED.lifetime_cash_earned,
            available_points = user_wallets.available_points + EXCLUDED.available_points,
            lifetime_earned = user_wallets.lifetime_earned + EXCLUDED.lifetime_earned;

        IF v_gfp_earned > 0 THEN
            SELECT available_points - v_gfp_earned INTO v_wallet_balance_before 
            FROM public.user_wallets WHERE user_id = v_seller_id;

            INSERT INTO public.wallet_ledger (user_id, transaction_type, amount, balance_before, balance_after, description)
            VALUES (v_seller_id, 'earn', v_gfp_earned, COALESCE(v_wallet_balance_before, 0), COALESCE(v_wallet_balance_before, 0) + v_gfp_earned, 'Earned points from RFQ completion');
        END IF;

        -- Add transaction
        INSERT INTO public.wallet_transactions (profile_id, amount, transaction_type, reference_id, metadata)
        VALUES (v_seller_id, v_total_payout, 'payout', p_fulfillment_id, jsonb_build_object('role', 'seller', 'type', 'rfq_buyback'));

        -- Notify Seller
        INSERT INTO public.notifications (target_user, target_role, type, title, body)
        VALUES (
            v_seller_id, 'user', 'success', 'RFQ Payment Received! 💰',
            'You just received KSh ' || ROUND(v_total_payout, 2) || ' and ' || v_gfp_earned || ' GFP for your RFQ delivery.'
        );
    END IF;

    RETURN jsonb_build_object('success', true, 'payout', v_total_payout, 'gfp_earned', v_gfp_earned);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Update Marketplace Escrow Payout
CREATE OR REPLACE FUNCTION public.handle_escrow_payout()
RETURNS TRIGGER AS $$
DECLARE
  v_seller_id UUID;
  v_payout_amount NUMERIC(12,2);
  v_commission_amount NUMERIC(12,2);
  v_gfp_earned INTEGER;
  v_wallet_balance_before INTEGER;
BEGIN
  -- Trigger logic: When status changes to 'completed' or 'funds_released'
  IF (NEW.status IN ('completed', 'funds_released') AND OLD.status NOT IN ('completed', 'funds_released')) THEN
    
    v_seller_id := NEW.seller_id;
    IF v_seller_id IS NULL AND NEW.listing_id IS NOT NULL THEN
      SELECT seller_id INTO v_seller_id FROM public.marketplace_listings WHERE id = NEW.listing_id;
    END IF;

    IF v_seller_id IS NOT NULL THEN
      v_payout_amount := NEW.total_price * 0.90;
      v_commission_amount := NEW.total_price * 0.10;
      v_gfp_earned := FLOOR(COALESCE(NEW.quantity, 0) * 2);

      -- Update the modern wallet (user_wallets)
      INSERT INTO public.user_wallets (user_id, cash_balance, lifetime_cash_earned, available_points, lifetime_earned)
      VALUES (v_seller_id, v_payout_amount, v_payout_amount, v_gfp_earned, v_gfp_earned)
      ON CONFLICT (user_id) DO UPDATE 
      SET cash_balance = user_wallets.cash_balance + EXCLUDED.cash_balance,
          lifetime_cash_earned = user_wallets.lifetime_cash_earned + EXCLUDED.lifetime_cash_earned,
          available_points = user_wallets.available_points + EXCLUDED.available_points,
          lifetime_earned = user_wallets.lifetime_earned + EXCLUDED.lifetime_earned;

      IF v_gfp_earned > 0 THEN
        SELECT available_points - v_gfp_earned INTO v_wallet_balance_before 
        FROM public.user_wallets WHERE user_id = v_seller_id;

        INSERT INTO public.wallet_ledger (user_id, transaction_type, amount, balance_before, balance_after, description)
        VALUES (v_seller_id, 'earn', v_gfp_earned, COALESCE(v_wallet_balance_before, 0), COALESCE(v_wallet_balance_before, 0) + v_gfp_earned, 'Earned points from marketplace trade');
      END IF;

      INSERT INTO public.wallet_transactions (profile_id, amount, transaction_type, reference_id, metadata)
      VALUES (v_seller_id, v_payout_amount, 'payout', NEW.id, jsonb_build_object('role', 'seller', 'type', 'marketplace_trade'));

      INSERT INTO public.notifications (target_user, target_role, type, title, body)
      VALUES (
        v_seller_id, 'all', 'success', 'Payment Received! 💰', 
        'Funds from order ' || NEW.id || ' have been released. You earned KSh ' || ROUND(v_payout_amount, 2) || ' and ' || v_gfp_earned || ' GFP.'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
