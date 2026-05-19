-- Migration: fix_financial_trigger.sql
-- Description: Fixes the protect_financial_columns trigger so it allows SECURITY DEFINER RPCs (which run as postgres) to update the wallet_balance.

CREATE OR REPLACE FUNCTION public.protect_financial_columns()
RETURNS TRIGGER AS $$
BEGIN
    -- current_user is the effective user (which becomes 'postgres' or 'supabase_admin' inside SECURITY DEFINER)
    -- current_setting('role') is the session role (e.g., 'authenticated')
    IF current_setting('role') <> 'service_role' AND current_user NOT IN ('postgres', 'supabase_admin') THEN
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
