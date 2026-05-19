-- Migration: 20260514_financial_integrity_hardening.sql
-- Description: Financial integrity hardening phase. Implements atomic RPCs, ledger immutability, idempotency guarantees, and race-condition prevention.

-- 1. Create a definitive, immutable ledger for all wallet transactions
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id),
    amount NUMERIC NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('topup', 'withdrawal', 'payout', 'escrow_release', 'refund', 'cashback')),
    reference_id UUID, -- For idempotency and linking
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enforce Ledger Immutability (Append-Only)
-- Revoke UPDATE and DELETE permissions from all roles for the ledgers
REVOKE UPDATE, DELETE ON public.wallet_transactions FROM authenticated, anon, public;
REVOKE UPDATE, DELETE ON public.rewards_ledger FROM authenticated, anon, public;

-- Enable RLS on wallet_transactions
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
ON public.wallet_transactions
FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

CREATE POLICY "System can insert transactions"
ON public.wallet_transactions
FOR INSERT
TO authenticated
WITH CHECK (false); -- Prevent direct inserts from frontend clients

-- 3. Idempotency Tracking
-- Create a unique constraint to prevent duplicate processing of the same reference
CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_tx_idempotency 
ON public.wallet_transactions (profile_id, reference_id, transaction_type)
WHERE reference_id IS NOT NULL;

-- 4. Atomic RPC: Wallet Topup
DROP FUNCTION IF EXISTS public.process_wallet_topup(numeric, uuid);
CREATE OR REPLACE FUNCTION public.process_wallet_topup(
    p_amount NUMERIC,
    p_reference_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_new_balance NUMERIC;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Topup amount must be strictly positive';
    END IF;

    -- Idempotency check via constraint will naturally fail if duplicate reference_id is inserted.
    
    -- Lock profile row to prevent race conditions
    PERFORM 1 FROM public.profiles WHERE id = v_user_id FOR UPDATE;

    -- Mutate balance
    UPDATE public.profiles
    SET wallet_balance = COALESCE(wallet_balance, 0) + p_amount
    WHERE id = v_user_id
    RETURNING wallet_balance INTO v_new_balance;

    -- Append immutable ledger record
    INSERT INTO public.wallet_transactions (
        profile_id,
        amount,
        transaction_type,
        reference_id,
        metadata
    ) VALUES (
        v_user_id,
        p_amount,
        'topup',
        p_reference_id,
        jsonb_build_object('source', 'user_initiated')
    );

    RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;

-- 5. Atomic RPC: Wallet Withdrawal
DROP FUNCTION IF EXISTS public.process_wallet_withdrawal(numeric, uuid);
CREATE OR REPLACE FUNCTION public.process_wallet_withdrawal(
    p_amount NUMERIC,
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

    -- Lock profile row
    SELECT wallet_balance INTO v_current_balance
    FROM public.profiles 
    WHERE id = v_user_id 
    FOR UPDATE;

    -- Validate invariant (anti-negative balance)
    IF COALESCE(v_current_balance, 0) < p_amount THEN
        RAISE EXCEPTION 'Insufficient funds for withdrawal';
    END IF;

    -- Mutate balance
    UPDATE public.profiles
    SET wallet_balance = wallet_balance - p_amount
    WHERE id = v_user_id
    RETURNING wallet_balance INTO v_new_balance;

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
        jsonb_build_object('source', 'user_initiated')
    );

    RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;

-- 6. Atomic RPC: Booking Payout
DROP FUNCTION IF EXISTS public.process_booking_payout(uuid, numeric);
CREATE OR REPLACE FUNCTION public.process_booking_payout(
    p_booking_id UUID,
    p_weight_kg NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_agent_id UUID;
    v_client_id UUID;
    v_assigned_agent_id UUID;
    v_booking_status TEXT;
    v_payout_amount NUMERIC;
    v_price_per_kg NUMERIC := 15.0; -- Default calculation
BEGIN
    v_agent_id := auth.uid();
    IF v_agent_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF p_weight_kg <= 0 THEN
        RAISE EXCEPTION 'Weight must be strictly positive';
    END IF;

    -- Lock booking row and get ownership
    SELECT user_id, agent_id, status INTO v_client_id, v_assigned_agent_id, v_booking_status
    FROM public.bookings
    WHERE id = p_booking_id
    FOR UPDATE;

    IF v_client_id IS NULL THEN
        RAISE EXCEPTION 'Booking not found';
    END IF;

    IF v_assigned_agent_id IS DISTINCT FROM v_agent_id THEN
        RAISE EXCEPTION 'Unauthorized: Caller is not the assigned agent for this booking';
    END IF;

    -- Replay protection / Idempotency
    IF v_booking_status = 'completed' THEN
        RAISE EXCEPTION 'Booking has already been completed and paid out';
    END IF;

    v_payout_amount := p_weight_kg * v_price_per_kg;

    -- Mutate booking state
    UPDATE public.bookings
    SET 
        status = 'completed',
        actual_weight_kg = p_weight_kg,
        total_price = v_payout_amount,
        updated_at = now()
    WHERE id = p_booking_id;

    -- Lock client profile for payout
    PERFORM 1 FROM public.profiles WHERE id = v_client_id FOR UPDATE;

    -- Execute client payout
    UPDATE public.profiles
    SET wallet_balance = COALESCE(wallet_balance, 0) + v_payout_amount
    WHERE id = v_client_id;

    -- Append immutable ledger record
    INSERT INTO public.wallet_transactions (
        profile_id,
        amount,
        transaction_type,
        reference_id,
        metadata
    ) VALUES (
        v_client_id,
        v_payout_amount,
        'payout',
        p_booking_id,
        jsonb_build_object('agent_id', v_agent_id, 'weight_kg', p_weight_kg)
    );

    RETURN jsonb_build_object('success', true, 'payout_amount', v_payout_amount);
END;
$$;

-- 7. Add Database Hardening Constraints
-- Anti-negative balance constraint
ALTER TABLE public.profiles 
ADD CONSTRAINT check_positive_wallet_balance 
CHECK (wallet_balance >= 0);

ALTER TABLE public.profiles 
ADD CONSTRAINT check_positive_held_balance 
CHECK (held_balance >= 0);

-- 8. Hardening: Override complete_booking_split_payout to enforce auth.uid()
DROP FUNCTION IF EXISTS public.complete_booking_split_payout(uuid, uuid, uuid, numeric, numeric, integer, boolean);
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
    v_immediate_payout DECIMAL;
    v_held_payout DECIMAL;
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
    v_client_cashback := p_estimated_value * (v_cashback_percentage / 100.0);
    v_agent_total := p_estimated_value - v_platform_cut - v_client_cashback;

    -- 4. Calculate Held vs Immediate
    IF p_is_manual THEN
        v_immediate_payout := 0;
        v_held_payout := v_agent_total;
    ELSE
        v_immediate_payout := v_agent_total * 0.5;
        v_held_payout := v_agent_total * 0.5;
    END IF;

    -- 5. Execute Database Updates
    UPDATE bookings 
    SET status = 'completed', weight_kg = p_weight_kg 
    WHERE id = p_booking_uuid;

    -- Lock agent/company wallet row
    PERFORM 1 FROM profiles WHERE id = v_target_wallet_uuid FOR UPDATE;

    UPDATE profiles 
    SET wallet_balance = wallet_balance + v_immediate_payout,
        held_balance = held_balance + v_held_payout
    WHERE id = v_target_wallet_uuid;

    -- Append ledger record
    INSERT INTO public.wallet_transactions (profile_id, amount, transaction_type, reference_id)
    VALUES (v_target_wallet_uuid, v_immediate_payout, 'payout', p_booking_uuid);

    -- Pay Resident Cashback & Points
    IF p_client_uuid IS NOT NULL THEN
        PERFORM 1 FROM profiles WHERE id = p_client_uuid FOR UPDATE;

        UPDATE profiles
        SET wallet_balance = wallet_balance + v_client_cashback,
            reward_points = reward_points + p_client_gfp
        WHERE id = p_client_uuid;
        
        INSERT INTO public.wallet_transactions (profile_id, amount, transaction_type, reference_id)
        VALUES (p_client_uuid, v_client_cashback, 'cashback', p_booking_uuid);
    END IF;

    RETURN 'success';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Hardening: Override weaver_claim_asset
DROP FUNCTION IF EXISTS public.weaver_claim_asset(uuid, uuid);
CREATE OR REPLACE FUNCTION public.weaver_claim_asset(
    p_asset_id UUID,
    p_weaver_id UUID
) RETURNS TEXT AS $$
DECLARE
    v_actual_caller_id UUID;
    v_asset_status TEXT;
BEGIN
    v_actual_caller_id := auth.uid();
    IF v_actual_caller_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF p_weaver_id IS DISTINCT FROM v_actual_caller_id THEN
        RAISE EXCEPTION 'Unauthorized: weaver mismatch';
    END IF;

    -- Lock asset row
    SELECT status INTO v_asset_status
    FROM public.assets
    WHERE id = p_asset_id
    FOR UPDATE;

    IF v_asset_status = 'claimed' THEN
        RAISE EXCEPTION 'Idempotency: Asset already claimed';
    END IF;

    UPDATE public.assets
    SET status = 'claimed', weaver_id = p_weaver_id, updated_at = now()
    WHERE id = p_asset_id;

    RETURN 'success';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
