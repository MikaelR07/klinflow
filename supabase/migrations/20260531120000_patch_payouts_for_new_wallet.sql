-- Migration: 20260531120000_patch_payouts_for_new_wallet.sql
-- Description: Updates complete_booking_split_payout and process_agent_pure_trade_payout to correctly award GFP to the new user_wallets table instead of the deprecated profiles.reward_points column.

CREATE OR REPLACE FUNCTION public.complete_booking_split_payout(
    p_booking_uuid UUID,
    p_agent_uuid UUID,
    p_client_uuid UUID,
    p_weight_kg DECIMAL,
    p_estimated_value DECIMAL,
    p_client_gfp INT,
    p_is_manual BOOLEAN 
) RETURNS TEXT AS $$
DECLARE
    v_actual_agent_id UUID;
    v_target_wallet_uuid UUID;
    v_account_type TEXT;
    v_company_id UUID;
    v_booking_status TEXT;
    v_assigned_agent_id UUID;
    
    v_cashback_percentage DECIMAL;
    v_platform_cut DECIMAL;
    v_client_cashback DECIMAL;
    v_agent_total DECIMAL;
    
    v_wallet_balance_before INTEGER;
BEGIN
    v_actual_agent_id := auth.uid();
    IF v_actual_agent_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Enforce that the caller cannot spoof p_agent_uuid
    IF p_agent_uuid IS DISTINCT FROM v_actual_agent_id THEN
        RAISE EXCEPTION 'Unauthorized: p_agent_uuid mismatch';
    END IF;

    -- Lock booking row and get ownership
    SELECT agent_id, status INTO v_assigned_agent_id, v_booking_status
    FROM public.bookings
    WHERE id = p_booking_uuid
    FOR UPDATE;

    IF v_booking_status = 'completed' THEN
        RAISE EXCEPTION 'Idempotency: Booking already completed';
    END IF;

    IF v_assigned_agent_id IS DISTINCT FROM v_actual_agent_id THEN
        RAISE EXCEPTION 'Unauthorized: Caller is not the assigned agent for this booking';
    END IF;

    -- 1. Identify the Agent / Fleet
    SELECT agent_account_type, company_id INTO v_account_type, v_company_id 
    FROM profiles WHERE id = p_agent_uuid;

    IF v_account_type = 'fleet_driver' AND v_company_id IS NOT NULL THEN
        v_target_wallet_uuid := v_company_id;
    ELSE
        v_target_wallet_uuid := p_agent_uuid;
    END IF;

    -- 2. Look up the Custom Configuration
    SELECT cashback_percentage INTO v_cashback_percentage
    FROM agent_configurations
    WHERE agent_id = v_target_wallet_uuid;
    
    IF v_cashback_percentage IS NULL THEN
        v_cashback_percentage := 10.00;
    END IF;

    -- 3. Calculate the Dynamic Splits
    v_platform_cut := p_estimated_value * 0.10;
    v_client_cashback := p_estimated_value * 0.90; 
    v_agent_total := 0; 

    -- 4. 100% IMMEDIATE PAYOUT
    UPDATE bookings 
    SET status = 'completed', weight_kg = p_weight_kg 
    WHERE id = p_booking_uuid;

    -- 5. Pay Resident (The Seller)
    IF p_client_uuid IS NOT NULL THEN
        -- Update the cash component on the profile
        UPDATE profiles
        SET wallet_balance = wallet_balance + v_client_cashback
        WHERE id = p_client_uuid;
        
        -- NEW: Update the GFP component on the user_wallets table
        IF p_client_gfp > 0 THEN
            -- Ensure wallet exists, create if not
            INSERT INTO public.user_wallets (user_id, available_points, lifetime_earned)
            VALUES (p_client_uuid, p_client_gfp, p_client_gfp)
            ON CONFLICT (user_id) DO UPDATE 
            SET available_points = user_wallets.available_points + EXCLUDED.available_points,
                lifetime_earned = user_wallets.lifetime_earned + EXCLUDED.lifetime_earned;

            -- Get balance before for ledger
            SELECT available_points - p_client_gfp INTO v_wallet_balance_before 
            FROM public.user_wallets WHERE user_id = p_client_uuid;

            -- Insert ledger record
            INSERT INTO public.wallet_ledger (
                user_id, transaction_type, amount, balance_before, balance_after, description
            ) VALUES (
                p_client_uuid, 'earn', p_client_gfp, COALESCE(v_wallet_balance_before, 0), COALESCE(v_wallet_balance_before, 0) + p_client_gfp, 'Earned points from pickup'
            );
        END IF;

        INSERT INTO public.wallet_transactions (profile_id, amount, transaction_type, reference_id, metadata)
        VALUES (p_client_uuid, v_client_cashback, 'payout', p_booking_uuid, jsonb_build_object('role', 'resident', 'type', 'material_buyback'));

        -- 6. NOTIFY RESIDENT
        INSERT INTO public.notifications (target_user, target_role, type, title, body)
        VALUES (
            p_client_uuid, 'user', 'success', 'Payment Received! 💰',
            'You just received KSh ' || ROUND(v_client_cashback, 2) || ' and ' || p_client_gfp || ' GFP for your recyclables. Your contribution matters!'
        );
    END IF;

    RETURN 'success';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION public.process_agent_pure_trade_payout(
    p_booking_uuid UUID,
    p_agent_uuid UUID,
    p_client_uuid UUID,
    p_weight_kg DECIMAL,
    p_agreed_price DECIMAL,
    p_client_gfp INT
) RETURNS TEXT AS $$
DECLARE
    v_actual_agent_id UUID;
    v_booking_status TEXT;
    v_assigned_agent_id UUID;
    v_wallet_balance_before INTEGER;
BEGIN
    v_actual_agent_id := auth.uid();
    IF v_actual_agent_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF p_agent_uuid IS DISTINCT FROM v_actual_agent_id THEN
        RAISE EXCEPTION 'Unauthorized: p_agent_uuid mismatch';
    END IF;

    -- Lock booking row
    SELECT agent_id, status INTO v_assigned_agent_id, v_booking_status
    FROM public.bookings
    WHERE id = p_booking_uuid
    FOR UPDATE;

    IF v_booking_status = 'completed' THEN
        RAISE EXCEPTION 'Idempotency: Booking already completed';
    END IF;

    IF v_assigned_agent_id IS DISTINCT FROM v_actual_agent_id THEN
        RAISE EXCEPTION 'Unauthorized: Caller is not the assigned agent for this booking';
    END IF;

    -- Update booking status
    UPDATE bookings 
    SET status = 'completed', weight_kg = p_weight_kg 
    WHERE id = p_booking_uuid;

    -- Payout to the client (seller)
    IF p_client_uuid IS NOT NULL THEN
        -- Cash update
        UPDATE profiles
        SET wallet_balance = wallet_balance + p_agreed_price
        WHERE id = p_client_uuid;
        
        -- NEW: GFP update to user_wallets
        IF p_client_gfp > 0 THEN
            INSERT INTO public.user_wallets (user_id, available_points, lifetime_earned)
            VALUES (p_client_uuid, p_client_gfp, p_client_gfp)
            ON CONFLICT (user_id) DO UPDATE 
            SET available_points = user_wallets.available_points + EXCLUDED.available_points,
                lifetime_earned = user_wallets.lifetime_earned + EXCLUDED.lifetime_earned;

            SELECT available_points - p_client_gfp INTO v_wallet_balance_before 
            FROM public.user_wallets WHERE user_id = p_client_uuid;

            INSERT INTO public.wallet_ledger (
                user_id, transaction_type, amount, balance_before, balance_after, description
            ) VALUES (
                p_client_uuid, 'earn', p_client_gfp, COALESCE(v_wallet_balance_before, 0), COALESCE(v_wallet_balance_before, 0) + p_client_gfp, 'Earned points from pure trade'
            );
        END IF;

        INSERT INTO public.wallet_transactions (profile_id, amount, transaction_type, reference_id, metadata)
        VALUES (p_client_uuid, p_agreed_price, 'payout', p_booking_uuid, jsonb_build_object('role', 'seller', 'type', 'pure_trade'));

        INSERT INTO public.notifications (target_user, target_role, type, title, body)
        VALUES (
            p_client_uuid, 'user', 'success', 'Trade Payment Received! 💰',
            'You just received KSh ' || ROUND(p_agreed_price, 2) || ' and ' || p_client_gfp || ' GFP for your marketplace trade.'
        );
    END IF;

    RETURN 'success';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
