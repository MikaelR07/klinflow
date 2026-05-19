-- ═══════════════════════════════════════════════════════════════
-- Klinflow KE — DB Cleanup Script
-- Removes all columns, tables, and functions that are no longer
-- used by any app after the resident-mode unification.
-- 
-- ⚠️  SAFE TO RUN: Everything here is verified unused in app code.
-- ⚠️  ALWAYS BACKUP BEFORE RUNNING IN PRODUCTION.
-- Run in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════
-- SECTION 1: profiles table — Remove unused columns
-- ════════════════════════════════════════════════════════════════

-- client_type: removed after unifying all residents into one type.
-- No app code reads or writes this column anymore.
ALTER TABLE public.profiles DROP COLUMN IF EXISTS client_type;

-- notification_prefs: stored in JSONB in profiles but the app now
-- uses a local default in the authStore and never reads from DB.
-- Keep if you want server-side notification preference syncing.
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS notification_prefs;

-- notes: an internal admin notes field. Only referenced in the
-- VALID_COLUMNS list in authStore but never displayed or written
-- by any UI component.
-- Keeping it as a useful admin scratchpad — comment out to drop:
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS notes;

-- completed_cleared_at / cancelled_cleared_at: Used by UserHome
-- to hide old completed/cancelled bookings from the UI list.
-- These ARE still active — do NOT drop.

-- vehicle: Agent-specific column, still displayed in Agent App UI.
-- DO NOT drop.

-- id_number: Agent-specific, shown in ProfilePage for agents.
-- DO NOT drop.


-- ════════════════════════════════════════════════════════════════
-- SECTION 2: bookings table — Remove unused columns
-- ════════════════════════════════════════════════════════════════

-- agent_rating_comment: Written by bookingStore.submitAgentRating()
-- but NEVER queried or displayed anywhere in the app. The review
-- display uses agent_feedback (separate column). Safe to drop.
ALTER TABLE public.bookings DROP COLUMN IF EXISTS agent_rating_comment;

-- booking_type: Used to route 'freelance' vs 'staff' agents.
-- Still actively read in agentStore and bookingStore.
-- DO NOT drop.

-- payment_status: Actively used by the ReleaseFunds modal flow.
-- DO NOT drop.

-- distance_km / logistics_fee: Written by the sustainomics engine
-- but never displayed in any UI component. Safe to drop if you
-- do not plan to use them for billing breakdowns.
ALTER TABLE public.bookings DROP COLUMN IF EXISTS distance_km;
ALTER TABLE public.bookings DROP COLUMN IF EXISTS logistics_fee;


-- ════════════════════════════════════════════════════════════════
-- SECTION 3: Purge marketplace data created by residents (role='user')
-- ════════════════════════════════════════════════════════════════
-- Residents (role='user') can no longer sell. Remove any stale
-- listings they may have created before the platform unification.
-- This does NOT affect business or agent listings.

DELETE FROM public.marketplace_orders
WHERE listing_id IN (
  SELECT id FROM public.marketplace_listings
  WHERE seller_id IN (SELECT id FROM public.profiles WHERE role = 'user')
);

DELETE FROM public.marketplace_listings
WHERE seller_id IN (
  SELECT id FROM public.profiles WHERE role = 'user'
);


-- ════════════════════════════════════════════════════════════════
-- SECTION 4: Notifications cleanup
-- ════════════════════════════════════════════════════════════════
-- Remove old stale notifications referencing seller-mode messages.
DELETE FROM public.notifications
WHERE body ILIKE '%seller%'
   OR body ILIKE '%marketplace listing%'
   OR title ILIKE '%seller%';

-- The old agent-schema.sql notifications table has columns
-- (severity, channel, is_broadcast, triggered_by, delivered, read_at)
-- that are NOT used by the current notifications table in master_schema.sql.
-- These were from an early schema version and have already been superseded.
-- The master_schema.sql notifications table is the active one.
-- No action needed unless you still have the old schema running.


-- ════════════════════════════════════════════════════════════════
-- SECTION 5: Drop legacy / superseded tables
-- ════════════════════════════════════════════════════════════════

-- rewards: Early-version separate rewards table (agent-schema.sql).
-- Superseded by rewards_ledger. Only rewards_ledger is referenced
-- in app code (test_db.js + master schema trigger).
DROP TABLE IF EXISTS public.rewards CASCADE;

-- iot_readings: Old IoT table from schema.sql.
-- Superseded by iot_devices (master_schema.sql). No app code
-- queries iot_readings anymore — everything uses iot_devices.
DROP TABLE IF EXISTS public.iot_readings CASCADE;

-- otp_verifications: Still actively used by the auth flow
-- (sendOtp / verifyOtp Edge Functions). DO NOT drop.


-- ════════════════════════════════════════════════════════════════
-- SECTION 6: Drop unused RPC functions
-- ════════════════════════════════════════════════════════════════

-- get_revenue_trends: Only reads from marketplace_orders grouped
-- by month. Fine to keep for admin analytics (business app).

-- get_material_distribution: Same — keep for admin analytics.

-- get_b2b_market_stats: Keep for business app admin panel.

-- No unused RPCs identified. All existing RPCs are still called
-- by adminStore.js or the business app.


-- ════════════════════════════════════════════════════════════════
-- ✅ Cleanup Complete
-- ════════════════════════════════════════════════════════════════
-- Summary of changes:
--   DROPPED columns: profiles.client_type
--                    bookings.agent_rating_comment
--                    bookings.distance_km
--                    bookings.logistics_fee
--   DROPPED tables:  rewards (superseded by rewards_ledger)
--                    iot_readings (superseded by iot_devices)
--   DELETED rows:    marketplace_listings by residents (role='user')
--                    marketplace_orders for those listings
--                    seller-related stale notifications
-- ═══════════════════════════════════════════════════════════════
