-- Migration: 20260531130000_points_redemption_system.sql
-- Description: Creates point_redemptions table, expands wallet_ledger types,
--              and adds atomic RPCs for processing and refunding redemptions.

-- ═══════════════════════════════════════════════════════════════════════
-- 1. POINT REDEMPTIONS TABLE
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.point_redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    type TEXT NOT NULL CHECK (type IN ('money', 'airtime', 'voucher')),
    amount INTEGER NOT NULL CHECK (amount > 0),
    fee INTEGER NOT NULL DEFAULT 0 CHECK (fee >= 0),
    net_amount INTEGER NOT NULL CHECK (net_amount > 0),
    kes_equivalent DECIMAL(12,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'rejected')),
    payout_method TEXT NOT NULL,
    payout_details JSONB DEFAULT '{}'::jsonb,
    provider_reference TEXT,
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_point_redemptions_user_id ON public.point_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_redemptions_status ON public.point_redemptions(status);
CREATE INDEX IF NOT EXISTS idx_point_redemptions_created_at ON public.point_redemptions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_point_redemptions_reference ON public.point_redemptions(reference_number);

-- Enable RLS
ALTER TABLE public.point_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own redemptions"
ON public.point_redemptions FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Deny direct user mutations (only RPCs can write)
REVOKE INSERT, UPDATE, DELETE ON public.point_redemptions FROM authenticated, anon, public;

-- ═══════════════════════════════════════════════════════════════════════
-- 2. EXPAND WALLET LEDGER TRANSACTION TYPES
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE public.wallet_ledger
DROP CONSTRAINT IF EXISTS wallet_ledger_transaction_type_check;

ALTER TABLE public.wallet_ledger
ADD CONSTRAINT wallet_ledger_transaction_type_check
CHECK (transaction_type IN (
    'earn', 'redeem', 'transfer_sent', 'transfer_received',
    'adjustment', 'bonus', 'migration',
    'redeem_money', 'redeem_airtime', 'redeem_voucher', 'refund'
));

-- ═══════════════════════════════════════════════════════════════════════
-- 3. ADD LIFETIME REDEEMED TRACKING
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE public.user_wallets
ADD COLUMN IF NOT EXISTS lifetime_redeemed INTEGER DEFAULT 0;

-- ═══════════════════════════════════════════════════════════════════════
-- 4. ATOMIC RPC: PROCESS POINT REDEMPTION
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.process_point_redemption(
    p_type TEXT,
    p_amount INTEGER,
    p_payout_method TEXT,
    p_payout_details JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_current_balance INTEGER;
    v_fee INTEGER := 0;
    v_net_amount INTEGER;
    v_kes_equivalent DECIMAL(12,2);
    v_ref_number TEXT;
    v_redemption_id UUID;
    v_ledger_type TEXT;
    v_daily_total INTEGER;

    -- Configurable limits
    c_min_redemption INTEGER := 50;
    c_max_per_tx INTEGER := 10000;
    c_max_daily INTEGER := 50000;
    c_gfp_to_kes DECIMAL := 0.5; -- 2 GFP = 1 KES
BEGIN
    -- ── AUTH ──
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- ── VALIDATE TYPE ──
    IF p_type NOT IN ('money', 'airtime', 'voucher') THEN
        RAISE EXCEPTION 'Invalid redemption type: %', p_type;
    END IF;

    -- ── VALIDATE AMOUNT ──
    IF p_amount < c_min_redemption THEN
        RAISE EXCEPTION 'Minimum redemption is % points', c_min_redemption;
    END IF;

    IF p_amount > c_max_per_tx THEN
        RAISE EXCEPTION 'Maximum per transaction is % points', c_max_per_tx;
    END IF;

    -- ── DAILY LIMIT CHECK ──
    SELECT COALESCE(SUM(amount), 0) INTO v_daily_total
    FROM public.point_redemptions
    WHERE user_id = v_user_id
      AND status IN ('pending', 'processing', 'completed')
      AND created_at >= (now() AT TIME ZONE 'UTC')::date;

    IF (v_daily_total + p_amount) > c_max_daily THEN
        RAISE EXCEPTION 'Daily redemption limit of % points exceeded. You have already redeemed % today.', c_max_daily, v_daily_total;
    END IF;

    -- ── CALCULATE ──
    v_net_amount := p_amount - v_fee;
    v_kes_equivalent := v_net_amount * c_gfp_to_kes;

    -- ── DETERMINE LEDGER TYPE ──
    CASE p_type
        WHEN 'money' THEN v_ledger_type := 'redeem_money';
        WHEN 'airtime' THEN v_ledger_type := 'redeem_airtime';
        WHEN 'voucher' THEN v_ledger_type := 'redeem_voucher';
        ELSE v_ledger_type := 'redeem';
    END CASE;

    -- ── LOCK WALLET ──
    SELECT available_points INTO v_current_balance
    FROM public.user_wallets
    WHERE user_id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Wallet not found';
    END IF;

    IF v_current_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient points. Available: %, Requested: %', v_current_balance, p_amount;
    END IF;

    -- ── GENERATE REFERENCE ──
    v_ref_number := 'KRX-' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));

    -- ── CREATE REDEMPTION RECORD ──
    INSERT INTO public.point_redemptions (
        reference_number, user_id, type, amount, fee, net_amount,
        kes_equivalent, status, payout_method, payout_details
    ) VALUES (
        v_ref_number, v_user_id, p_type, p_amount, v_fee, v_net_amount,
        v_kes_equivalent, 'processing', p_payout_method, p_payout_details
    ) RETURNING id INTO v_redemption_id;

    -- ── DEDUCT WALLET ──
    UPDATE public.user_wallets
    SET available_points = available_points - p_amount,
        lifetime_redeemed = COALESCE(lifetime_redeemed, 0) + p_amount
    WHERE user_id = v_user_id;

    -- ── WRITE LEDGER ──
    INSERT INTO public.wallet_ledger (
        user_id, transaction_type, amount, balance_before, balance_after,
        reference_id, description
    ) VALUES (
        v_user_id, v_ledger_type, -p_amount, v_current_balance,
        v_current_balance - p_amount, v_redemption_id,
        'Redeemed ' || p_amount || ' points via ' || p_payout_method || '. KES ' || v_kes_equivalent
    );

    -- ── MARK COMPLETED (simulated instant for now) ──
    UPDATE public.point_redemptions
    SET status = 'completed', completed_at = now()
    WHERE id = v_redemption_id;

    -- ── NOTIFY USER ──
    INSERT INTO public.notifications (target_user, target_role, type, title, body)
    VALUES (
        v_user_id, 'user', 'success',
        'Redemption Successful! 🎉',
        'You redeemed ' || p_amount || ' GFP for KES ' || v_kes_equivalent || '. Ref: ' || v_ref_number
    );

    RETURN jsonb_build_object(
        'success', true,
        'reference_number', v_ref_number,
        'redemption_id', v_redemption_id,
        'status', 'completed',
        'amount', p_amount,
        'kes_equivalent', v_kes_equivalent,
        'balance_after', v_current_balance - p_amount
    );
END;
$$;


-- ═══════════════════════════════════════════════════════════════════════
-- 5. ATOMIC RPC: REFUND FAILED REDEMPTION (Admin/Service-Role)
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.refund_failed_redemption(
    p_redemption_id UUID,
    p_reason TEXT DEFAULT 'Provider payout failed'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_redemption RECORD;
    v_current_balance INTEGER;
BEGIN
    -- ── GET REDEMPTION AND LOCK ──
    SELECT * INTO v_redemption
    FROM public.point_redemptions
    WHERE id = p_redemption_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Redemption not found';
    END IF;

    IF v_redemption.status NOT IN ('processing', 'pending') THEN
        RAISE EXCEPTION 'Redemption cannot be refunded. Current status: %', v_redemption.status;
    END IF;

    -- ── LOCK WALLET ──
    SELECT available_points INTO v_current_balance
    FROM public.user_wallets
    WHERE user_id = v_redemption.user_id
    FOR UPDATE;

    -- ── RE-CREDIT WALLET ──
    UPDATE public.user_wallets
    SET available_points = available_points + v_redemption.amount,
        lifetime_redeemed = GREATEST(COALESCE(lifetime_redeemed, 0) - v_redemption.amount, 0)
    WHERE user_id = v_redemption.user_id;

    -- ── WRITE REFUND LEDGER ──
    INSERT INTO public.wallet_ledger (
        user_id, transaction_type, amount, balance_before, balance_after,
        reference_id, description
    ) VALUES (
        v_redemption.user_id, 'refund', v_redemption.amount,
        v_current_balance, v_current_balance + v_redemption.amount,
        v_redemption.id,
        'Refund for failed redemption ' || v_redemption.reference_number || ': ' || p_reason
    );

    -- ── UPDATE REDEMPTION STATUS ──
    UPDATE public.point_redemptions
    SET status = 'failed',
        failure_reason = p_reason,
        completed_at = now()
    WHERE id = p_redemption_id;

    -- ── NOTIFY USER ──
    INSERT INTO public.notifications (target_user, target_role, type, title, body)
    VALUES (
        v_redemption.user_id, 'user', 'warning',
        'Redemption Failed — Points Refunded',
        'Your redemption of ' || v_redemption.amount || ' GFP (Ref: ' || v_redemption.reference_number || ') failed. Points have been refunded to your wallet.'
    );

    RETURN jsonb_build_object(
        'success', true,
        'refunded_amount', v_redemption.amount,
        'new_balance', v_current_balance + v_redemption.amount
    );
END;
$$;
