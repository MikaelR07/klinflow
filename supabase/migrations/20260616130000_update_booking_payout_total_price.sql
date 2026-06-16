-- Migration: 20260616130000_update_booking_payout_total_price.sql
-- Description: Fixes the total_price not updating during agent verification, and provides a backend DB calculation for accurate net resident earnings.

-- 1. Patch complete_booking_split_payout to correctly update the total_price in bookings
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
    
    v_wallet_points_before INTEGER;
BEGIN
    v_actual_agent_id := auth.uid();
    IF v_actual_agent_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF p_agent_uuid IS DISTINCT FROM v_actual_agent_id THEN
        RAISE EXCEPTION 'Unauthorized: p_agent_uuid mismatch';
    END IF;

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

    SELECT agent_account_type, company_id INTO v_account_type, v_company_id 
    FROM profiles WHERE id = p_agent_uuid;

    IF v_account_type = 'fleet_driver' AND v_company_id IS NOT NULL THEN
        v_target_wallet_uuid := v_company_id;
    ELSE
        v_target_wallet_uuid := p_agent_uuid;
    END IF;

    v_platform_cut := p_estimated_value * 0.10;
    v_client_cashback := p_estimated_value * 0.90; 
    v_agent_total := 0; 

    -- FIX: Update total_price to the actual gross p_estimated_value
    UPDATE bookings 
    SET status = 'completed', weight_kg = p_weight_kg, total_price = p_estimated_value, updated_at = NOW()
    WHERE id = p_booking_uuid;

    IF p_client_uuid IS NOT NULL THEN
        -- UPDATE user_wallets for BOTH cash and GFP
        INSERT INTO public.user_wallets (user_id, cash_balance, lifetime_cash_earned, available_points, lifetime_earned)
        VALUES (p_client_uuid, v_client_cashback, v_client_cashback, p_client_gfp, p_client_gfp)
        ON CONFLICT (user_id) DO UPDATE 
        SET cash_balance = user_wallets.cash_balance + EXCLUDED.cash_balance,
            lifetime_cash_earned = user_wallets.lifetime_cash_earned + EXCLUDED.lifetime_cash_earned,
            available_points = user_wallets.available_points + EXCLUDED.available_points,
            lifetime_earned = user_wallets.lifetime_earned + EXCLUDED.lifetime_earned;

        IF p_client_gfp > 0 THEN
            SELECT available_points - p_client_gfp INTO v_wallet_points_before 
            FROM public.user_wallets WHERE user_id = p_client_uuid;

            INSERT INTO public.wallet_ledger (
                user_id, transaction_type, amount, balance_before, balance_after, description
            ) VALUES (
                p_client_uuid, 'earn', p_client_gfp, COALESCE(v_wallet_points_before, 0), COALESCE(v_wallet_points_before, 0) + p_client_gfp, 'Earned points from pickup'
            );
        END IF;

        -- We still insert into wallet_transactions for cash history
        INSERT INTO public.wallet_transactions (profile_id, amount, transaction_type, reference_id, metadata)
        VALUES (p_client_uuid, v_client_cashback, 'payout', p_booking_uuid, jsonb_build_object('role', 'resident', 'type', 'material_buyback'));

        INSERT INTO public.notifications (target_user, target_role, type, title, body)
        VALUES (
            p_client_uuid, 'user', 'success', 'Payment Received! 💰',
            'You just received KSh ' || ROUND(v_client_cashback, 2) || ' and ' || p_client_gfp || ' GFP for your recyclables.'
        );
    END IF;

    RETURN 'success';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. New RPC to get true net resident wallet stats
CREATE OR REPLACE FUNCTION public.get_resident_wallet_stats(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'cash_balance', COALESCE(w.cash_balance, 0),
        'available_points', COALESCE(w.available_points, 0),
        'lifetime_cash_earned', COALESCE(w.lifetime_cash_earned, 0),
        'savings_this_month', COALESCE((
            SELECT SUM(amount)
            FROM public.wallet_transactions
            WHERE profile_id = p_user_id
              AND transaction_type = 'payout'
              AND date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)
        ), 0),
        'kg_recovered_this_month', COALESCE((
            SELECT SUM(weight_kg)
            FROM public.bookings
            WHERE user_id = p_user_id
              AND status = 'completed'
              AND date_trunc('month', updated_at) = date_trunc('month', CURRENT_DATE)
        ), 0)
    )
    INTO v_stats
    FROM public.user_wallets w
    WHERE w.user_id = p_user_id;

    RETURN COALESCE(v_stats, jsonb_build_object(
        'cash_balance', 0,
        'available_points', 0,
        'lifetime_cash_earned', 0,
        'savings_this_month', 0,
        'kg_recovered_this_month', 0
    ));
END;
$$;
