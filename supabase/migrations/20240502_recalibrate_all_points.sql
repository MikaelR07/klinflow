-- Migration: 20240502_recalibrate_all_points.sql
-- Description: Completely resets and recalculates all Track Points from scratch to eliminate any double-counting bugs.

-- 1. Reset everyone to 0 first (except clients, we only recalculate agents/companies here)
UPDATE public.profiles 
SET reward_points = 0
WHERE agent_account_type IN ('fleet_driver', 'independent', 'company_admin')
   OR company_id IS NOT NULL
   OR fleet_invite_code IS NOT NULL;

-- 2. Give points to Independent Agents & Fleet Drivers for their own work
UPDATE public.profiles p
SET reward_points = sub.total_gfp
FROM (
    SELECT agent_id, SUM(COALESCE(actual_weight_kg, weight_kg, bags, 0) * 5) as total_gfp
    FROM public.bookings
    WHERE status = 'completed' AND agent_id IS NOT NULL
    GROUP BY agent_id
) sub
WHERE p.id = sub.agent_id;

-- 3. Give matching points to Company Owners based on their Fleet Drivers' work
UPDATE public.profiles p
SET reward_points = COALESCE(p.reward_points, 0) + sub.total_gfp
FROM (
    SELECT 
        driver.company_id, 
        SUM(COALESCE(b.actual_weight_kg, b.weight_kg, b.bags, 0) * 5) as total_gfp
    FROM public.bookings b
    JOIN public.profiles driver ON b.agent_id = driver.id
    WHERE b.status = 'completed' 
      AND b.agent_id IS NOT NULL
      AND driver.agent_account_type = 'fleet_driver'
      AND driver.company_id IS NOT NULL
    GROUP BY driver.company_id
) sub
WHERE p.id = sub.company_id;
