-- =========================================================================
-- FLAT 5 GFP PER TRADE — All trade types (resident, marketplace, RFQ)
-- Previously: FLOOR(weight_kg * 2) for residents/RFQ, 0 for marketplace
-- Now: Flat 5 GFP per completed trade regardless of weight or trade type
-- =========================================================================

-- 1. PREVIEW RPC — always return 5 GFP
CREATE OR REPLACE FUNCTION public.preview_payout(p_weight_kg numeric, p_rate_per_kg numeric, p_is_market_trade boolean DEFAULT false)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_gross numeric;
    v_fee numeric;
    v_net numeric;
    v_gfp integer;
BEGIN
    v_gross := p_weight_kg * p_rate_per_kg;
    v_fee := v_gross * 0.05;
    v_net := v_gross - v_fee;
    
    -- Flat 5 GFP per trade, regardless of weight or trade type
    v_gfp := 5;

    RETURN jsonb_build_object(
        'gross', ROUND(v_gross, 2),
        'fee', ROUND(v_fee, 2),
        'net', ROUND(v_net, 2),
        'gfp', v_gfp
    );
END;
$$;


-- 2. RESIDENT PICKUP — flat 5 GFP
CREATE OR REPLACE FUNCTION public.complete_booking_split_payout(
    p_booking_uuid uuid, 
    p_agent_uuid uuid, 
    p_client_uuid uuid, 
    p_weight_kg numeric, 
    p_rate_per_kg numeric, 
    p_is_manual boolean
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_actual_agent_id UUID;
    v_target_wallet_uuid UUID;
    v_account_type TEXT;
    v_company_id UUID;
    v_booking_status TEXT;
    v_assigned_agent_id UUID;
    
    v_gross_value DECIMAL;
    v_platform_cut DECIMAL;
    v_client_cashback DECIMAL;
    v_client_gfp INTEGER;
    
    v_wallet_points_before INTEGER;
BEGIN
    v_actual_agent_id := auth.uid();
    IF v_actual_agent_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
    IF p_agent_uuid IS DISTINCT FROM v_actual_agent_id THEN RAISE EXCEPTION 'Unauthorized: p_agent_uuid mismatch'; END IF;

    SELECT agent_id, status INTO v_assigned_agent_id, v_booking_status
    FROM public.bookings WHERE id = p_booking_uuid FOR UPDATE;

    IF v_booking_status = 'completed' THEN RAISE EXCEPTION 'Booking already completed'; END IF;
    IF v_assigned_agent_id IS DISTINCT FROM v_actual_agent_id THEN RAISE EXCEPTION 'Unauthorized: Caller is not assigned agent'; END IF;

    SELECT agent_account_type, company_id INTO v_account_type, v_company_id FROM profiles WHERE id = p_agent_uuid;
    IF v_account_type = 'fleet_driver' AND v_company_id IS NOT NULL THEN
        v_target_wallet_uuid := v_company_id;
    ELSE
        v_target_wallet_uuid := p_agent_uuid;
    END IF;

    -- Calculate everything securely in the backend
    v_gross_value := p_weight_kg * p_rate_per_kg;
    v_platform_cut := v_gross_value * 0.05;
    v_client_cashback := v_gross_value - v_platform_cut; 
    -- CHANGED: Flat 5 GFP per trade instead of FLOOR(p_weight_kg * 2)
    v_client_gfp := 5;

    UPDATE bookings 
    SET status = 'completed', weight_kg = p_weight_kg, total_price = v_gross_value, updated_at = NOW()
    WHERE id = p_booking_uuid;

    -- DEDUCT GROSS FROM AGENT
    INSERT INTO public.user_wallets (user_id, cash_balance)
    VALUES (v_target_wallet_uuid, -v_gross_value)
    ON CONFLICT (user_id) DO UPDATE 
    SET cash_balance = user_wallets.cash_balance - v_gross_value;

    INSERT INTO public.wallet_transactions (profile_id, amount, transaction_type, reference_id, metadata)
    VALUES (v_target_wallet_uuid, -v_gross_value, 'payment', p_booking_uuid, jsonb_build_object('role', 'agent', 'type', 'material_purchase'));

    -- PAY RESIDENT (NET + GFP)
    IF p_client_uuid IS NOT NULL THEN
        INSERT INTO public.user_wallets (user_id, cash_balance, lifetime_cash_earned, available_points, lifetime_earned)
        VALUES (p_client_uuid, v_client_cashback, v_client_cashback, v_client_gfp, v_client_gfp)
        ON CONFLICT (user_id) DO UPDATE 
        SET cash_balance = user_wallets.cash_balance + EXCLUDED.cash_balance,
            lifetime_cash_earned = user_wallets.lifetime_cash_earned + EXCLUDED.lifetime_cash_earned,
            available_points = user_wallets.available_points + EXCLUDED.available_points,
            lifetime_earned = user_wallets.lifetime_earned + EXCLUDED.lifetime_earned;

        IF v_client_gfp > 0 THEN
            SELECT available_points - v_client_gfp INTO v_wallet_points_before FROM public.user_wallets WHERE user_id = p_client_uuid;
            INSERT INTO public.wallet_ledger (user_id, transaction_type, amount, balance_before, balance_after, description)
            VALUES (p_client_uuid, 'earn', v_client_gfp, COALESCE(v_wallet_points_before, 0), COALESCE(v_wallet_points_before, 0) + v_client_gfp, 'Earned 5 GFP from pickup trade');
        END IF;

        INSERT INTO public.wallet_transactions (profile_id, amount, transaction_type, reference_id, metadata)
        VALUES (p_client_uuid, v_client_cashback, 'payout', p_booking_uuid, jsonb_build_object('role', 'resident', 'type', 'material_buyback'));

        INSERT INTO public.notifications (target_user, target_role, type, title, body)
        VALUES (p_client_uuid, 'user', 'success', 'Payment Received! 💰', 'You just received KSh ' || ROUND(v_client_cashback, 2) || ' and ' || v_client_gfp || ' GFP for your recyclables.');
    END IF;

    -- RECORD PLATFORM FEE
    IF v_platform_cut > 0 THEN
        INSERT INTO public.platform_treasury (source_type, amount, reference_id)
        VALUES ('resident_pickup', v_platform_cut, p_booking_uuid);
    END IF;

    RETURN 'success';
END;
$$;


-- 3. MARKETPLACE TRADE — now awards 5 GFP to seller
CREATE OR REPLACE FUNCTION public.complete_booking_trade_payout(p_booking_id uuid, p_actual_weight numeric, p_payout_amount numeric) 
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_caller_id UUID;
    v_agent_id UUID;
    v_client_id UUID;
    v_waste_type TEXT;
    v_agent_balance NUMERIC;
    v_booking_status TEXT;
    
    v_platform_cut NUMERIC;
    v_net_payout NUMERIC;
    v_seller_gfp INTEGER;
    v_wallet_points_before INTEGER;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    SELECT agent_id, user_id, waste_type, status
    INTO v_agent_id, v_client_id, v_waste_type, v_booking_status
    FROM public.bookings WHERE id = p_booking_id FOR UPDATE;

    IF v_agent_id IS NULL THEN RAISE EXCEPTION 'Booking not found'; END IF;
    IF v_agent_id IS DISTINCT FROM v_caller_id THEN RAISE EXCEPTION 'Unauthorized: Only the assigned agent can settle this trade'; END IF;
    IF v_booking_status = 'completed' THEN RAISE EXCEPTION 'Booking already completed'; END IF;

    SELECT cash_balance INTO v_agent_balance FROM public.user_wallets WHERE user_id = v_agent_id FOR UPDATE;
    IF v_agent_balance IS NULL OR v_agent_balance < p_payout_amount THEN RAISE EXCEPTION 'Insufficient funds in agent wallet'; END IF;

    -- Calculations
    v_platform_cut := p_payout_amount * 0.05;
    v_net_payout := p_payout_amount - v_platform_cut;
    -- NEW: Flat 5 GFP per marketplace trade
    v_seller_gfp := 5;

    UPDATE public.bookings
    SET status = 'completed', actual_weight_kg = p_actual_weight, total_price = p_payout_amount, updated_at = now()
    WHERE id = p_booking_id;

    -- DEDUCT GROSS FROM AGENT
    UPDATE public.user_wallets SET cash_balance = cash_balance - p_payout_amount WHERE user_id = v_agent_id;
    
    -- PAY SELLER (NET + GFP)
    INSERT INTO public.user_wallets (user_id, cash_balance, lifetime_cash_earned, available_points, lifetime_earned)
    VALUES (v_client_id, v_net_payout, v_net_payout, v_seller_gfp, v_seller_gfp)
    ON CONFLICT (user_id) DO UPDATE SET 
        cash_balance = user_wallets.cash_balance + v_net_payout,
        lifetime_cash_earned = user_wallets.lifetime_cash_earned + v_net_payout,
        available_points = user_wallets.available_points + v_seller_gfp,
        lifetime_earned = user_wallets.lifetime_earned + v_seller_gfp;

    -- GFP LEDGER ENTRY
    IF v_seller_gfp > 0 THEN
        SELECT available_points - v_seller_gfp INTO v_wallet_points_before FROM public.user_wallets WHERE user_id = v_client_id;
        INSERT INTO public.wallet_ledger (user_id, transaction_type, amount, balance_before, balance_after, description)
        VALUES (v_client_id, 'earn', v_seller_gfp, COALESCE(v_wallet_points_before, 0), COALESCE(v_wallet_points_before, 0) + v_seller_gfp, 'Earned 5 GFP from marketplace trade');
    END IF;

    -- IMMUTABLE LEDGER
    INSERT INTO public.wallet_transactions (profile_id, amount, transaction_type, reference_id, metadata)
    VALUES
        (v_agent_id, -p_payout_amount, 'payment', p_booking_id, jsonb_build_object('role', 'buyer')),
        (v_client_id, v_net_payout, 'payout', p_booking_id, jsonb_build_object('role', 'seller'));

    -- ASSET CREATION
    INSERT INTO public.assets (booking_id, verifier_id, material_type, weight_kg, estimated_value, status, source)
    VALUES (p_booking_id, v_agent_id, v_waste_type, p_actual_weight, p_payout_amount, 'verified', 'marketplace');

    -- RECORD PLATFORM FEE
    IF v_platform_cut > 0 THEN
        INSERT INTO public.platform_treasury (source_type, amount, reference_id)
        VALUES ('marketplace_trade', v_platform_cut, p_booking_id);
    END IF;

    INSERT INTO public.notifications (target_user, target_role, type, title, body)
    VALUES (v_client_id, 'user', 'success', 'Payment Received! 💰', 'You just received KSh ' || ROUND(v_net_payout, 2) || ' and 5 GFP for your ' || p_actual_weight || 'kg of ' || v_waste_type || '.');

    RETURN jsonb_build_object('status', 'success', 'gfp_earned', v_seller_gfp);
END;
$$;


-- 4. RFQ FULFILLMENT — flat 5 GFP
CREATE OR REPLACE FUNCTION public.process_rfq_payout(p_fulfillment_id uuid, p_weight_kg numeric, p_grade text, p_contamination integer) 
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_actual_agent_id UUID;
    v_order_status TEXT;
    v_seller_id UUID;
    v_proposal_id UUID;
    v_rfq_id UUID;
    v_price_per_kg DECIMAL;
    v_assigned_agent_id UUID;
    v_gfp_earned INTEGER;
    v_wallet_balance_before INTEGER;
    
    v_total_payout DECIMAL;
    v_platform_cut DECIMAL;
    v_net_payout DECIMAL;
    v_buyer_balance NUMERIC;
BEGIN
    v_actual_agent_id := auth.uid();
    IF v_actual_agent_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    SELECT status, seller_id, proposal_id, assigned_agent_id, rfq_id
    INTO v_order_status, v_seller_id, v_proposal_id, v_assigned_agent_id, v_rfq_id
    FROM public.fulfillment_orders WHERE id = p_fulfillment_id FOR UPDATE;

    IF v_order_status = 'completed' THEN RAISE EXCEPTION 'Fulfillment already completed'; END IF;
    IF v_assigned_agent_id IS DISTINCT FROM v_actual_agent_id THEN RAISE EXCEPTION 'Unauthorized: Caller is not the assigned agent'; END IF;

    SELECT offered_price INTO v_price_per_kg FROM public.rfq_offers WHERE id = v_proposal_id;

    -- Calculate amounts securely
    v_total_payout := p_weight_kg * COALESCE(v_price_per_kg, 0);
    v_platform_cut := v_total_payout * 0.05;
    v_net_payout := v_total_payout - v_platform_cut;
    -- CHANGED: Flat 5 GFP per trade instead of FLOOR(p_weight_kg * 2)
    v_gfp_earned := 5;
    
    -- Check buyer balance and deduct
    SELECT cash_balance INTO v_buyer_balance FROM public.user_wallets WHERE user_id = v_assigned_agent_id FOR UPDATE;
    IF v_buyer_balance IS NULL OR v_buyer_balance < v_total_payout THEN RAISE EXCEPTION 'Insufficient funds in buyer wallet'; END IF;

    UPDATE public.fulfillment_orders 
    SET status = 'completed', verification_status = 'verified', payment_status = 'released',
        verified_weight = p_weight_kg, quality_grade = p_grade, contamination_level = p_contamination, updated_at = NOW()
    WHERE id = p_fulfillment_id;

    IF v_rfq_id IS NOT NULL THEN
        UPDATE public.rfqs SET status = 'completed', updated_at = NOW() WHERE id = v_rfq_id;
    END IF;
    
    -- DEDUCT GROSS FROM BUYER
    UPDATE public.user_wallets SET cash_balance = cash_balance - v_total_payout WHERE user_id = v_assigned_agent_id;
    
    INSERT INTO public.wallet_transactions (profile_id, amount, transaction_type, reference_id, metadata)
    VALUES (v_assigned_agent_id, -v_total_payout, 'payment', p_fulfillment_id, jsonb_build_object('role', 'buyer', 'type', 'rfq_buyback'));

    -- PAY SELLER (NET + GFP)
    IF v_seller_id IS NOT NULL AND v_total_payout > 0 THEN
        INSERT INTO public.user_wallets (user_id, cash_balance, lifetime_cash_earned, available_points, lifetime_earned)
        VALUES (v_seller_id, v_net_payout, v_net_payout, v_gfp_earned, v_gfp_earned)
        ON CONFLICT (user_id) DO UPDATE 
        SET cash_balance = user_wallets.cash_balance + EXCLUDED.cash_balance,
            lifetime_cash_earned = user_wallets.lifetime_cash_earned + EXCLUDED.lifetime_cash_earned,
            available_points = user_wallets.available_points + EXCLUDED.available_points,
            lifetime_earned = user_wallets.lifetime_earned + EXCLUDED.lifetime_earned;

        IF v_gfp_earned > 0 THEN
            SELECT available_points - v_gfp_earned INTO v_wallet_balance_before FROM public.user_wallets WHERE user_id = v_seller_id;
            INSERT INTO public.wallet_ledger (user_id, transaction_type, amount, balance_before, balance_after, description)
            VALUES (v_seller_id, 'earn', v_gfp_earned, COALESCE(v_wallet_balance_before, 0), COALESCE(v_wallet_balance_before, 0) + v_gfp_earned, 'Earned 5 GFP from RFQ completion');
        END IF;

        INSERT INTO public.wallet_transactions (profile_id, amount, transaction_type, reference_id, metadata)
        VALUES (v_seller_id, v_net_payout, 'payout', p_fulfillment_id, jsonb_build_object('role', 'seller', 'type', 'rfq_buyback'));

        INSERT INTO public.notifications (target_user, target_role, type, title, body)
        VALUES (v_seller_id, 'user', 'success', 'RFQ Payment Received! 💰', 'You just received KSh ' || ROUND(v_net_payout, 2) || ' and ' || v_gfp_earned || ' GFP for your RFQ delivery.');
    END IF;

    -- RECORD PLATFORM FEE
    IF v_platform_cut > 0 THEN
        INSERT INTO public.platform_treasury (source_type, amount, reference_id)
        VALUES ('rfq_fulfillment', v_platform_cut, p_fulfillment_id);
    END IF;

    RETURN jsonb_build_object('success', true, 'payout', v_net_payout, 'gfp_earned', v_gfp_earned);
END;
$$;
