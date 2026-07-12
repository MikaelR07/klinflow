-- 1. Fix the wallet_transactions check constraint to allow 'payment'
ALTER TABLE public.wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_transaction_type_check;
ALTER TABLE public.wallet_transactions ADD CONSTRAINT wallet_transactions_transaction_type_check 
CHECK (transaction_type = ANY (ARRAY['topup'::text, 'withdrawal'::text, 'payout'::text, 'escrow_release'::text, 'refund'::text, 'cashback'::text, 'payment'::text, 'transfer'::text]));

-- 2. Modify the trigger function to only pay out for 'funds_released' (Stripe payments)
-- Drop-offs and marketplace trades will be handled by explicit RPCs to ensure agent is charged correctly.
CREATE OR REPLACE FUNCTION public.handle_escrow_payout()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_seller_id UUID;
  v_payout_amount NUMERIC(12,2);
  v_commission_amount NUMERIC(12,2);
  v_gfp_earned INTEGER;
  v_wallet_balance_before INTEGER;
BEGIN
  -- ONLY process automatic trigger payout for 'funds_released' (e.g. from Stripe)
  IF (NEW.status = 'funds_released' AND OLD.status != 'funds_released') THEN
    v_seller_id := NEW.seller_id;
    IF v_seller_id IS NULL AND NEW.listing_id IS NOT NULL THEN
      SELECT seller_id INTO v_seller_id FROM public.marketplace_listings WHERE id = NEW.listing_id;
    END IF;

    IF v_seller_id IS NOT NULL THEN
      v_payout_amount := NEW.total_price * 0.90;
      v_commission_amount := NEW.total_price * 0.10;
      v_gfp_earned := 5; -- Flat 5 GFP for all trades

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
$$;

-- 3. Create explicit RPC for drop-off payouts
CREATE OR REPLACE FUNCTION public.process_marketplace_dropoff_payout(
    p_order_id uuid, 
    p_weight_kg numeric, 
    p_payout_amount numeric
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_actual_agent_id UUID;
    v_buyer_id UUID;
    v_seller_id UUID;
    v_booking_id UUID;
    v_listing_id UUID;
    v_order_status TEXT;
    
    v_agent_account_type TEXT;
    v_company_id UUID;
    v_target_buyer_wallet UUID;
    
    v_agent_balance DECIMAL;
    v_gfp INTEGER;
    
    v_wallet_points_before INTEGER;
BEGIN
    v_actual_agent_id := auth.uid();
    IF v_actual_agent_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    SELECT buyer_id, seller_id, booking_id, listing_id, status 
    INTO v_buyer_id, v_seller_id, v_booking_id, v_listing_id, v_order_status
    FROM public.marketplace_orders WHERE id = p_order_id FOR UPDATE;

    IF v_order_status = 'completed' THEN RAISE EXCEPTION 'Order already completed'; END IF;
    IF v_buyer_id IS DISTINCT FROM v_actual_agent_id THEN RAISE EXCEPTION 'Unauthorized: Caller is not the assigned agent for this order'; END IF;

    -- Determine wallet to charge
    SELECT agent_account_type, company_id INTO v_agent_account_type, v_company_id FROM profiles WHERE id = v_actual_agent_id;
    IF v_agent_account_type = 'fleet_driver' AND v_company_id IS NOT NULL THEN
        v_target_buyer_wallet := v_company_id;
    ELSE
        v_target_buyer_wallet := v_actual_agent_id;
    END IF;

    -- Check balance
    SELECT cash_balance INTO v_agent_balance FROM public.user_wallets WHERE user_id = v_target_buyer_wallet FOR UPDATE;
    IF v_agent_balance IS NULL OR v_agent_balance < p_payout_amount THEN 
        RAISE EXCEPTION 'Insufficient funds in wallet'; 
    END IF;

    v_gfp := 5;

    -- 1. DEDUCT from Agent
    UPDATE public.user_wallets 
    SET cash_balance = cash_balance - p_payout_amount 
    WHERE user_id = v_target_buyer_wallet;

    INSERT INTO public.wallet_transactions (profile_id, amount, transaction_type, reference_id, metadata)
    VALUES (v_target_buyer_wallet, -p_payout_amount, 'payment', p_order_id, jsonb_build_object('role', 'buyer', 'type', 'marketplace_dropoff'));

    -- 2. PAY Seller
    IF v_seller_id IS NULL AND v_listing_id IS NOT NULL THEN
        SELECT seller_id INTO v_seller_id FROM public.marketplace_listings WHERE id = v_listing_id;
    END IF;

    IF v_seller_id IS NOT NULL THEN
        INSERT INTO public.user_wallets (user_id, cash_balance, lifetime_cash_earned, available_points, lifetime_earned)
        VALUES (v_seller_id, p_payout_amount, p_payout_amount, v_gfp, v_gfp)
        ON CONFLICT (user_id) DO UPDATE 
        SET cash_balance = user_wallets.cash_balance + EXCLUDED.cash_balance,
            lifetime_cash_earned = user_wallets.lifetime_cash_earned + EXCLUDED.lifetime_cash_earned,
            available_points = user_wallets.available_points + EXCLUDED.available_points,
            lifetime_earned = user_wallets.lifetime_earned + EXCLUDED.lifetime_earned;

        -- We must recalculate balance before for ledger since it changed in the upsert
        SELECT available_points - v_gfp INTO v_wallet_points_before 
        FROM public.user_wallets WHERE user_id = v_seller_id;

        INSERT INTO public.wallet_ledger (user_id, transaction_type, amount, balance_before, balance_after, description)
        VALUES (v_seller_id, 'earn', v_gfp, COALESCE(v_wallet_points_before, 0), COALESCE(v_wallet_points_before, 0) + v_gfp, 'Earned points from drop-off trade');

        INSERT INTO public.wallet_transactions (profile_id, amount, transaction_type, reference_id, metadata)
        VALUES (v_seller_id, p_payout_amount, 'payout', p_order_id, jsonb_build_object('role', 'seller', 'type', 'marketplace_dropoff'));
        
        INSERT INTO public.notifications (target_user, target_role, type, title, body)
        VALUES (
            v_seller_id, 'all', 'success', 'Payment Received! 💰', 
            'Your drop-off has been processed. You earned KSh ' || ROUND(p_payout_amount, 2) || ' and ' || v_gfp || ' GFP.'
        );
    END IF;

    -- 3. Update Order
    UPDATE public.marketplace_orders 
    SET status = 'completed', quantity = p_weight_kg, total_price = p_payout_amount, updated_at = NOW()
    WHERE id = p_order_id;

    -- 4. Update Booking if exists
    IF v_booking_id IS NOT NULL THEN
        UPDATE public.bookings 
        SET status = 'completed', actual_weight_kg = p_weight_kg, total_price = p_payout_amount, payment_status = 'released', updated_at = NOW()
        WHERE id = v_booking_id;
    END IF;

    -- 5. Update Listing
    IF v_listing_id IS NOT NULL THEN
        UPDATE public.marketplace_listings 
        SET status = 'sold' 
        WHERE id = v_listing_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'message', 'Payment processed successfully');
END;
$$;
