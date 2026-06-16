-- Script to completely remove the stale wallet_balance column from the profiles table
-- WARNING: Ensure that no other parts of the system are relying on this column. 
-- The user_wallets table is now the single source of truth for balances.

ALTER TABLE profiles
DROP COLUMN IF EXISTS wallet_balance;
