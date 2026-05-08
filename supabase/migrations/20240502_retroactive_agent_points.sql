-- Migration: 20240502_retroactive_agent_points.sql
-- Description: Retroactively awards Track Points (GFP) to agents for all their past completed bookings.

UPDATE public.profiles p
SET reward_points = COALESCE(p.reward_points, 0) + sub.total_gfp
FROM (
    SELECT agent_id, SUM(COALESCE(actual_weight_kg, weight_kg, bags, 0) * 5) as total_gfp
    FROM public.bookings
    WHERE status = 'completed' AND agent_id IS NOT NULL
    GROUP BY agent_id
) sub
WHERE p.id = sub.agent_id;
