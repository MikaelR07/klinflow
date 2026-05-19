-- Migration: 20260514_titanium_financial_certification.sql
-- Description: FINAL PRODUCTION CERTIFICATION HARDENING.
-- This migration closes critical security holes in RLS and consolidation of financial authority.

-- ════════════════════════════════════════════════════════════════
-- 1. CRITICAL RLS HARDENING: PROFILES
-- ════════════════════════════════════════════════════════════════

-- Problem: Previous policy allowed users to update THEIR OWN wallet_balance.
-- Fix: Use a trigger to prevent manual balance updates, or restrict the policy.
-- Since we want users to update their name/phone but NOT their balance, we use a trigger.

CREATE OR REPLACE FUNCTION public.protect_financial_columns()
RETURNS TRIGGER AS $$
BEGIN
    -- If the caller is not a service role (superuser), prevent changes to financial columns
    IF current_setting('role') <> 'service_role' THEN
        IF NEW.wallet_balance IS DISTINCT FROM OLD.wallet_balance THEN
            NEW.wallet_balance := OLD.wallet_balance;
        END IF;
        IF NEW.reward_points IS DISTINCT FROM OLD.reward_points THEN
            NEW.reward_points := OLD.reward_points;
        END IF;
        IF NEW.held_balance IS DISTINCT FROM OLD.held_balance THEN
            NEW.held_balance := OLD.held_balance;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_protect_financial_columns ON public.profiles;
CREATE TRIGGER tr_protect_financial_columns
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_financial_columns();

-- ════════════════════════════════════════════════════════════════
-- 2. RECONCILIATION & AUDITABILITY TOOLS
-- ════════════════════════════════════════════════════════════════

-- This view identifies users whose wallet balance has drifted from their ledger
CREATE OR REPLACE VIEW public.vw_balance_drift_audit AS
WITH ledger_sums AS (
    -- Sum from rewards_ledger
    SELECT 
        profile_id, 
        SUM(amount_cashback) as total_from_rewards
    FROM public.rewards_ledger
    GROUP BY profile_id
),
wallet_tx_sums AS (
    -- Sum from wallet_transactions
    SELECT 
        profile_id, 
        SUM(amount) as total_from_wallet_tx
    FROM public.wallet_transactions
    GROUP BY profile_id
),
combined_ledger AS (
    SELECT 
        p.id as profile_id,
        p.name,
        p.wallet_balance as current_balance,
        COALESCE(rl.total_from_rewards, 0) + COALESCE(wt.total_from_wallet_tx, 0) as calculated_balance
    FROM public.profiles p
    LEFT JOIN ledger_sums rl ON p.id = rl.profile_id
    LEFT JOIN wallet_tx_sums wt ON p.id = wt.profile_id
)
SELECT 
    *,
    (current_balance - calculated_balance) as drift_amount
FROM combined_ledger
WHERE ABS(current_balance - calculated_balance) > 0.01;

-- ════════════════════════════════════════════════════════════════
-- 3. IDEMPOTENCY & OWNERSHIP RE-ENFORCEMENT (COMPLETE SET)
-- ════════════════════════════════════════════════════════════════

-- Final hardening for complete_booking_trade_payout
DROP FUNCTION IF EXISTS public.complete_booking_trade_payout(uuid, numeric, numeric);
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

    -- 4. Lock and check Agent balance (Lost update prevention)
    SELECT wallet_balance INTO v_agent_balance
    FROM public.profiles
    WHERE id = v_agent_id
    FOR UPDATE;

    IF v_agent_balance < p_payout_amount THEN
        RAISE EXCEPTION 'Insufficient funds in agent wallet';
    END IF;

    -- 5. Atomic Mutation
    UPDATE public.bookings 
    SET status = 'completed', 
        actual_weight_kg = p_actual_weight,
        total_price = p_payout_amount,
        updated_at = now()
    WHERE id = p_booking_id;

    UPDATE public.profiles SET wallet_balance = wallet_balance - p_payout_amount WHERE id = v_agent_id;
    UPDATE public.profiles SET wallet_balance = wallet_balance + p_payout_amount WHERE id = v_client_id;

    -- 6. Immutable Ledger Entries
    INSERT INTO public.wallet_transactions (profile_id, amount, transaction_type, reference_id, metadata)
    VALUES 
        (v_agent_id, -p_payout_amount, 'payout', p_booking_id, jsonb_build_object('role', 'buyer')),
        (v_client_id, p_payout_amount, 'payout', p_booking_id, jsonb_build_object('role', 'seller'));

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ════════════════════════════════════════════════════════════════
-- 4. GLOBAL AUDIT POLICY
-- ════════════════════════════════════════════════════════════════
-- Ensure no financial triggers double-dip.
-- We DISABLE the legacy credit_user_rewards trigger on bookings if it still exists.
DROP TRIGGER IF EXISTS on_booking_completed ON public.bookings;
-- All rewards are now BROKERED by RPCs or dedicated accounting logic.
