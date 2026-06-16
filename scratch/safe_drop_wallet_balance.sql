-- Script to safely remove the stale wallet_balance column from the profiles table
-- Handles dependencies like triggers and views before dropping the column.

-- 1. Update the trigger function so it stops looking for the wallet_balance column
CREATE OR REPLACE FUNCTION public.protect_financial_columns()
RETURNS TRIGGER AS $$
BEGIN
    IF current_setting('role') <> 'service_role' THEN
        -- wallet_balance check removed
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

-- 2. Drop the view that is blocking the column deletion
DROP VIEW IF EXISTS public.vw_balance_drift_audit;

-- 3. Safely drop the stale column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS wallet_balance;

-- 4. Recreate the audit view, this time pointing it to the correct user_wallets table
CREATE OR REPLACE VIEW public.vw_balance_drift_audit AS
WITH ledger_sums AS (
    SELECT profile_id, SUM(amount_cashback) as total_from_rewards
    FROM public.rewards_ledger
    GROUP BY profile_id
),
wallet_tx_sums AS (
    SELECT profile_id, SUM(amount) as total_from_wallet_tx
    FROM public.wallet_transactions
    GROUP BY profile_id
),
combined_ledger AS (
    SELECT 
        w.user_id as profile_id,
        p.name,
        w.cash_balance as current_balance,
        COALESCE(rl.total_from_rewards, 0) + COALESCE(wt.total_from_wallet_tx, 0) as calculated_balance
    FROM public.user_wallets w
    JOIN public.profiles p ON p.id = w.user_id
    LEFT JOIN ledger_sums rl ON w.user_id = rl.profile_id
    LEFT JOIN wallet_tx_sums wt ON w.user_id = wt.profile_id
)
SELECT 
    *,
    (current_balance - calculated_balance) as drift_amount
FROM combined_ledger
WHERE ABS(current_balance - calculated_balance) > 0.01;
