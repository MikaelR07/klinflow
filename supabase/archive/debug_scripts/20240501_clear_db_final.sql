-- Clear operational data but keep users and system configs
TRUNCATE TABLE public.bookings CASCADE;
TRUNCATE TABLE public.assets CASCADE;
TRUNCATE TABLE public.notifications CASCADE;

-- Clear optional features (ignore errors if you haven't deployed these yet)
TRUNCATE TABLE public.rewards_ledger CASCADE;
TRUNCATE TABLE public.marketplace_orders CASCADE;
TRUNCATE TABLE public.marketplace_listings CASCADE;
TRUNCATE TABLE public.app_reviews CASCADE;

-- Reset user balances, points, and ratings to their fresh defaults
UPDATE public.profiles
SET 
    wallet_balance = 0,
    reward_points = 0,
    rating = NULL;
