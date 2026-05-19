-- Migration: 20260515_add_deposit_rpc.sql
-- Description: Adds a secure RPC to handle agent/user deposits to their wallet.

CREATE OR REPLACE FUNCTION public.deposit_to_wallet(p_amount DECIMAL)
RETURNS void AS $$
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Deposit amount must be positive';
    END IF;

    UPDATE public.profiles
    SET wallet_balance = COALESCE(wallet_balance, 0) + p_amount
    WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
