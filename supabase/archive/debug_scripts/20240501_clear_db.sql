-- Clear operational data but keep users and system configs
TRUNCATE TABLE public.bookings CASCADE;
TRUNCATE TABLE public.assets CASCADE;
TRUNCATE TABLE public.notifications CASCADE;
TRUNCATE TABLE public.rewards_ledger CASCADE;
TRUNCATE TABLE public.marketplace_orders CASCADE;
TRUNCATE TABLE public.marketplace_listings CASCADE;
TRUNCATE TABLE public.app_reviews CASCADE;
TRUNCATE TABLE public.iot_readings CASCADE;
TRUNCATE TABLE public.hygenex_messages CASCADE;

-- Reset user balances, points, and ratings to their defaults
UPDATE public.profiles
SET 
    wallet_balance = 0,
    reward_points = 0,
    rating = 5.0;
