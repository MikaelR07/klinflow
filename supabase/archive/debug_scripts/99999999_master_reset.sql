-- ── MASTER RESET: Clear Transactional Data ─────────────────────────────────────
-- This script wipes all activity but KEEPS your user profiles and settings.

-- Use CASCADE to handle foreign key dependencies automatically
TRUNCATE TABLE 
  public.bookings, 
  public.rewards_ledger, 
  public.notifications, 
  public.assets, 
  public.marketplace_listings, 
  public.marketplace_orders,
  public.messages
CASCADE;

-- Optional: Reset user wallet balances and points to zero for a clean start
UPDATE public.profiles 
SET 
  wallet_balance = 0, 
  reward_points = 0,
  completed_cleared_at = NULL,
  cancelled_cleared_at = NULL;

-- Log the reset event
INSERT INTO public.notifications (target_user, target_role, type, title, body)
SELECT id, role, 'system', 'Network Reset', 'The CleanFlow database has been reset for debugging. Your account is preserved.'
FROM public.profiles;
