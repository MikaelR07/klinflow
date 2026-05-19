-- Migration: update_withdrawal_rpc.sql
-- Description: Updates the process_wallet_withdrawal RPC to accept withdrawal method and account details for tracking.

DROP FUNCTION IF EXISTS public.process_wallet_withdrawal(numeric, uuid);
DROP FUNCTION IF EXISTS public.process_wallet_withdrawal(numeric, text, text, uuid);

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

    -- Append immutable ledger record, including withdrawal method and account
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
