-- ============================================================
-- CleanFlow DB Reset Script
-- Clears ALL transactional data while preserving user accounts
-- 
-- PRESERVED: auth.users, profiles, system_settings, waste_categories
-- CLEARED: bookings, marketplace, notifications
--
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

BEGIN;

-- 1. Marketplace (order matters due to foreign keys)
TRUNCATE TABLE marketplace_offers CASCADE;
TRUNCATE TABLE marketplace_orders CASCADE;
TRUNCATE TABLE marketplace_listings CASCADE;

-- 2. Bookings
TRUNCATE TABLE bookings CASCADE;

-- 3. Notifications
TRUNCATE TABLE notifications CASCADE;

-- 4. Reset wallet balances on profiles to zero (keeps the accounts)
UPDATE profiles SET 
  wallet_balance = 0;

COMMIT;

-- Verify
SELECT 'bookings' AS "table", COUNT(*) AS "rows" FROM bookings
UNION ALL SELECT 'marketplace_listings', COUNT(*) FROM marketplace_listings
UNION ALL SELECT 'marketplace_orders', COUNT(*) FROM marketplace_orders
UNION ALL SELECT 'marketplace_offers', COUNT(*) FROM marketplace_offers
UNION ALL SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL SELECT 'profiles (kept)', COUNT(*) FROM profiles;
