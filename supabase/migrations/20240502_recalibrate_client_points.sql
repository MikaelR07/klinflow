-- Migration: 20240502_recalibrate_client_points.sql
-- Description: Completely resets and recalculates all Client/Resident GFP from scratch to fix the accidental wipe.

-- 1. Reset all users' points to 0 to ensure a clean slate
UPDATE public.profiles 
SET reward_points = 0
WHERE role IN ('user', 'resident');

-- 2. Recalculate and award points perfectly based on completed bookings
UPDATE public.profiles p
SET reward_points = sub.total_gfp
FROM (
    SELECT user_id, SUM(COALESCE(actual_weight_kg, weight_kg, bags, 0) * 5) as total_gfp
    FROM public.bookings
    WHERE status = 'completed' AND user_id IS NOT NULL
    GROUP BY user_id
) sub
WHERE p.id = sub.user_id AND p.role IN ('user', 'resident');
