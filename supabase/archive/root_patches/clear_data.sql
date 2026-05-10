-- ── FULL RESET SCRIPT (FIXED) ──────────────────────────────────────────
-- This will wipe EVERYTHING transactional AND reset all user stats to zero.

-- 1. Disable triggers
SET session_replication_role = 'replica';

-- 2. Clear all history/jobs/orders
TRUNCATE TABLE public.bookings CASCADE;
TRUNCATE TABLE public.notifications CASCADE;
TRUNCATE TABLE public.push_subscriptions CASCADE;
TRUNCATE TABLE public.assets CASCADE;
TRUNCATE TABLE public.marketplace_orders CASCADE;
TRUNCATE TABLE public.marketplace_listings CASCADE;

-- 3. RESET USER STATS & WALLETS
-- (Note: Impact stats like KG/CO2 are calculated live from reward_points)
UPDATE public.profiles 
SET 
  wallet_balance = 0, 
  rating = NULL,
  reward_points = 0,
  completed_cleared_at = NOW();

-- 4. Re-enable triggers
SET session_replication_role = 'origin';

-- ── RESET COMPLETE ──
-- Your apps will now show 0 KSh and No Activity.
