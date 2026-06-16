-- Migration: 20260616160000_fix_agent_wallet_deductions_in_payouts.sql
-- Description: Fixes the bug where agent wallets were not deducted from user_wallets during payouts.

-- 1. Fix complete_booking_split_payout
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

    -- Update total_price to the actual gross p_estimated_value
    UPDATE bookings 
    SET status = 'completed', weight_kg = p_weight_kg, total_price = p_estimated_value, updated_at = NOW()
    WHERE id = p_booking_uuid;

    -- FIX: DEDUCT FROM AGENT'S WALLET
    INSERT INTO public.user_wallets (user_id, cash_balance)
    VALUES (v_target_wallet_uuid, -p_estimated_value)
    ON CONFLICT (user_id) DO UPDATE 
    SET cash_balance = user_wallets.cash_balance - p_estimated_value;

    INSERT INTO public.wallet_transactions (profile_id, amount, transaction_type, reference_id, metadata)
    VALUES (v_target_wallet_uuid, -p_estimated_value, 'payment', p_booking_uuid, jsonb_build_object('role', 'agent', 'type', 'material_purchase'));

    -- ADD FUNDS TO RESIDENT'S WALLET
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


-- 2. Fix complete_booking_trade_payout
CREATE OR REPLACE FUNCTION public.complete_booking_trade_payout(
    p_booking_id UUID,
    p_actual_weight DECIMAL,
    p_payout_amount DECIMAL
) RETURNS JSONB AS $$
DECLARE
    v_caller_id UUID;
    v_agent_id UUID;
    v_client_id UUID;
    v_waste_type TEXT;
    v_agent_balance NUMERIC;
    v_booking_status TEXT;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    -- 1. Fetch parties and LOCK booking
    SELECT agent_id, user_id, waste_type, status
    INTO v_agent_id, v_client_id, v_waste_type, v_booking_status
    FROM public.bookings
    WHERE id = p_booking_id
    FOR UPDATE;

    IF v_agent_id IS NULL THEN RAISE EXCEPTION 'Booking not found'; END IF;

    -- 2. Ownership: Only the assigned agent can complete this
    IF v_agent_id IS DISTINCT FROM v_caller_id THEN
        RAISE EXCEPTION 'Unauthorized: Only the assigned agent can settle this trade';
    END IF;

    -- 3. Idempotency
    IF v_booking_status = 'completed' THEN
        RAISE EXCEPTION 'Booking already completed';
    END IF;

    -- 4. Lock and check Agent balance (from user_wallets!)
    SELECT cash_balance INTO v_agent_balance
    FROM public.user_wallets
    WHERE user_id = v_agent_id
    FOR UPDATE;

    IF v_agent_balance IS NULL OR v_agent_balance < p_payout_amount THEN
        RAISE EXCEPTION 'Insufficient funds in agent wallet';
    END IF;

    -- 5. Atomic Mutation
    UPDATE public.bookings
    SET status = 'completed',
        actual_weight_kg = p_actual_weight,
        total_price = p_payout_amount,
        updated_at = now()
    WHERE id = p_booking_id;

    -- FIX: Update user_wallets instead of profiles
    UPDATE public.user_wallets SET cash_balance = cash_balance - p_payout_amount WHERE user_id = v_agent_id;
    
    INSERT INTO public.user_wallets (user_id, cash_balance, lifetime_cash_earned)
    VALUES (v_client_id, p_payout_amount, p_payout_amount)
    ON CONFLICT (user_id) DO UPDATE SET 
        cash_balance = user_wallets.cash_balance + p_payout_amount,
        lifetime_cash_earned = user_wallets.lifetime_cash_earned + p_payout_amount;

    -- 6. Immutable Ledger Entries
    INSERT INTO public.wallet_transactions (profile_id, amount, transaction_type, reference_id, metadata)
    VALUES
        (v_agent_id, -p_payout_amount, 'payout', p_booking_id, jsonb_build_object('role', 'buyer')),
        (v_client_id, p_payout_amount, 'payout', p_booking_id, jsonb_build_object('role', 'seller'));

    -- 7. Create inventory asset for the Agent
    INSERT INTO public.assets
        (booking_id, verifier_id, material_type, weight_kg, estimated_value, status, source)
    VALUES
        (p_booking_id, v_agent_id, v_waste_type, p_actual_weight, p_payout_amount, 'verified', 'marketplace');

    -- 8. Notifications
    INSERT INTO public.notifications (target_user, target_role, type, title, body)
    VALUES (
        v_client_id, 'user', 'success', 'Payment Received! 💰',
        'You just received KSh ' || p_payout_amount || ' for your ' || p_actual_weight || 'kg of ' || v_waste_type || '.'
    );

    RETURN jsonb_build_object('status', 'success');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Drop legacy wallet_balance column from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS wallet_balance;

-- 4. Fix approve_fund_request to use correct wallet_transactions schema
CREATE OR REPLACE FUNCTION public.approve_fund_request(p_request_id UUID)
RETURNS json AS $$
DECLARE
    v_request RECORD;
    v_owner_balance NUMERIC;
BEGIN
    SELECT * INTO v_request
    FROM public.fund_requests
    WHERE id = p_request_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Request not found');
    END IF;

    IF v_request.status != 'pending' THEN
        RETURN json_build_object('success', false, 'message', 'Request already processed');
    END IF;

    -- Verify Owner Balance from user_wallets
    SELECT cash_balance INTO v_owner_balance
    FROM public.user_wallets
    WHERE user_id = v_request.company_id;

    IF COALESCE(v_owner_balance, 0) < v_request.amount THEN
        RETURN json_build_object('success', false, 'message', 'Insufficient company balance');
    END IF;

    -- Atomic Transfer
    -- Debit Owner
    UPDATE public.user_wallets
    SET cash_balance = cash_balance - v_request.amount
    WHERE user_id = v_request.company_id;

    -- Credit Driver
    INSERT INTO public.user_wallets (user_id, cash_balance)
    VALUES (v_request.driver_id, v_request.amount)
    ON CONFLICT (user_id) DO UPDATE
    SET cash_balance = user_wallets.cash_balance + v_request.amount;

    UPDATE public.fund_requests
    SET status = 'approved', updated_at = now()
    WHERE id = p_request_id;

    -- Use correct columns: transaction_type, reference_id, metadata
    INSERT INTO public.wallet_transactions (profile_id, amount, transaction_type, reference_id, metadata)
    VALUES
    (v_request.company_id, -v_request.amount, 'withdrawal', p_request_id, jsonb_build_object('target', 'driver', 'description', 'Fund disbursement to driver: ' || v_request.driver_id)),
    (v_request.driver_id, v_request.amount, 'topup', p_request_id, jsonb_build_object('source', 'owner', 'description', 'Fund receipt from company owner'));

    RETURN json_build_object('success', true, 'message', 'Funds disbursed successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Allow company owners to read their fleet agents' wallets
CREATE POLICY "Company owners can view fleet agent wallets"
ON public.user_wallets FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = user_wallets.user_id
      AND profiles.company_id = auth.uid()
  )
);

-- Drop the old restrictive policy so the new one takes effect
DROP POLICY IF EXISTS "Users can view their own wallets" ON public.user_wallets;
