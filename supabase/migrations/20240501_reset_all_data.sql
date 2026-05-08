-- Migration: 20240501_reset_all_data.sql
-- Description: Clears all operational data while preserving user accounts (profiles).
-- WARNING: This is a destructive operation.

-- 1. TRUNCATE OPERATIONAL TABLES
-- (Using CASCADE to handle foreign key dependencies)
TRUNCATE TABLE public.assets CASCADE;
TRUNCATE TABLE public.bookings CASCADE;
TRUNCATE TABLE public.notifications CASCADE;
TRUNCATE TABLE public.marketplace_orders CASCADE;
TRUNCATE TABLE public.marketplace_listings CASCADE;

-- 2. RESET USER BALANCES & POINTS
-- (Keeps the user accounts but resets their progress)
UPDATE public.profiles 
SET wallet_balance = 0,
    held_balance = 0,
    reward_points = 0;

-- 3. RESET SEQUENCES (Optional, for clean IDs)
-- ALTER SEQUENCE IF EXISTS bookings_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS assets_id_seq RESTART WITH 1;

COMMIT;
