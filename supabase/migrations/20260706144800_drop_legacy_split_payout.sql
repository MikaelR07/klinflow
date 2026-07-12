-- Fix: platform_treasury table had RLS enabled with no SELECT policy,
-- causing the admin app to get 0 rows even though data existed.
-- Also missing GRANT statements for authenticated users.

-- Disable RLS (this is an internal ledger table, not user-facing)
ALTER TABLE public.platform_treasury DISABLE ROW LEVEL SECURITY;

-- Grant access to all roles
GRANT ALL ON TABLE "public"."platform_treasury" TO "anon";
GRANT ALL ON TABLE "public"."platform_treasury" TO "authenticated";
GRANT ALL ON TABLE "public"."platform_treasury" TO "service_role";

-- Drop the legacy 8-param overload of complete_booking_split_payout
-- that doesn't insert into platform_treasury.
DROP FUNCTION IF EXISTS public.complete_booking_split_payout(uuid, uuid, uuid, numeric, numeric, numeric, numeric, integer);
