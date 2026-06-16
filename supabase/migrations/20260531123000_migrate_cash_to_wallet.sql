-- Migration: 20260531123000_migrate_cash_to_wallet.sql
-- Description: Migrates the wallet_balance cash values from profiles to user_wallets and patches related RPCs.

-- 1. Alter user_wallets to add cash tracking
ALTER TABLE public.user_wallets 
ADD COLUMN IF NOT EXISTS cash_balance DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS lifetime_cash_earned DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS lifetime_cash_withdrawn DECIMAL(12,2) DEFAULT 0.00;

-- 2. Migrate existing cash balances from profiles to user_wallets
DO $$
DECLARE
    profile_record RECORD;
    migrated_count INTEGER := 0;
BEGIN
    FOR profile_record IN 
        SELECT id, COALESCE(wallet_balance, 0) as cash FROM public.profiles 
    LOOP
        -- Ensure wallet exists
        INSERT INTO public.user_wallets (user_id, available_points, cash_balance, lifetime_cash_earned)
        VALUES (profile_record.id, 0, profile_record.cash, profile_record.cash)
        ON CONFLICT (user_id) DO UPDATE 
        SET cash_balance = profile_record.cash,
            lifetime_cash_earned = profile_record.cash;
            
        -- Add to ledger
        IF profile_record.cash > 0 THEN
            INSERT INTO public.wallet_ledger (
                user_id, transaction_type, amount, balance_before, balance_after, description
            ) VALUES (
                profile_record.id, 'migration', profile_record.cash, 0, profile_record.cash, 'Initial migration of legacy cash balance'
            );
        END IF;
        
        migrated_count := migrated_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Cash Migration Complete: % users migrated.', migrated_count;
END $$;

-- 3. Patch complete_booking_split_payout
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

    UPDATE bookings 
    SET status = 'completed', weight_kg = p_weight_kg 
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


-- 4. Patch process_agent_pure_trade_payout
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

    UPDATE bookings 
    SET status = 'completed', weight_kg = p_weight_kg 
    WHERE id = p_booking_uuid;

    IF p_client_uuid IS NOT NULL THEN
        INSERT INTO public.user_wallets (user_id, cash_balance, lifetime_cash_earned, available_points, lifetime_earned)
        VALUES (p_client_uuid, p_agreed_price, p_agreed_price, p_client_gfp, p_client_gfp)
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
                p_client_uuid, 'earn', p_client_gfp, COALESCE(v_wallet_points_before, 0), COALESCE(v_wallet_points_before, 0) + p_client_gfp, 'Earned points from pure trade'
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


-- 5. Patch process_wallet_withdrawal
CREATE OR REPLACE FUNCTION public.process_wallet_withdrawal(
    p_amount NUMERIC,
    p_method TEXT DEFAULT 'M-PESA',
    p_account TEXT DEFAULT '',
    p_reference_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_current_balance NUMERIC;
    v_new_balance NUMERIC;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Withdrawal amount must be strictly positive';
    END IF;

    -- Lock wallet row
    SELECT cash_balance INTO v_current_balance
    FROM public.user_wallets
    WHERE user_id = v_user_id
    FOR UPDATE;

    IF COALESCE(v_current_balance, 0) < p_amount THEN
        RAISE EXCEPTION 'Insufficient funds for withdrawal';
    END IF;

    -- Mutate balance
    UPDATE public.user_wallets
    SET cash_balance = cash_balance - p_amount,
        lifetime_cash_withdrawn = lifetime_cash_withdrawn + p_amount
    WHERE user_id = v_user_id
    RETURNING cash_balance INTO v_new_balance;

    -- Append immutable ledger record
    INSERT INTO public.wallet_transactions (
        profile_id,
        amount,
        transaction_type,
        reference_id,
        metadata
    ) VALUES (
        v_user_id,
        -p_amount,
        'withdrawal',
        p_reference_id,
        jsonb_build_object(
            'source', 'user_initiated',
            'method', p_method,
            'account', p_account
        )
    );

    RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;


-- 6. Patch deposit_to_wallet
CREATE OR REPLACE FUNCTION public.deposit_to_wallet(p_amount DECIMAL)
RETURNS void AS $$
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Deposit amount must be positive';
    END IF;

    -- Update the canonical wallet
    INSERT INTO public.user_wallets (user_id, cash_balance, lifetime_cash_earned)
    VALUES (auth.uid(), p_amount, p_amount)
    ON CONFLICT (user_id) DO UPDATE 
    SET cash_balance = user_wallets.cash_balance + p_amount,
        lifetime_cash_earned = user_wallets.lifetime_cash_earned + p_amount;

    -- Sync to profiles so the UI sees the updated balance immediately
    UPDATE public.profiles
    SET wallet_balance = wallet_balance + p_amount
    WHERE id = auth.uid();

    -- Record in ledger for audit trail
    INSERT INTO public.wallet_transactions (profile_id, amount, transaction_type, metadata)
    VALUES (
        auth.uid(),
        p_amount,
        'topup',
        jsonb_build_object('source', 'self_deposit', 'method', 'in_app')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 7. Patch approve_fund_request
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

    INSERT INTO public.wallet_transactions (profile_id, amount, type, status, description, metadata)
    VALUES
    (v_request.company_id, -v_request.amount, 'withdrawal', 'completed', 'Fund disbursement to driver: ' || v_request.driver_id, json_build_object('request_id', p_request_id, 'target', 'driver')),
    (v_request.driver_id, v_request.amount, 'topup', 'completed', 'Fund receipt from company owner', json_build_object('request_id', p_request_id, 'source', 'owner'));

    RETURN json_build_object('success', true, 'message', 'Funds disbursed successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
