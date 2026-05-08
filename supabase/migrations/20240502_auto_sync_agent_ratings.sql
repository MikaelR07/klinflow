-- ══════════════════════════════════════════════════════════════════════════════
-- Auto-recalculate agent rating whenever a booking gets a new agent_rating
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.sync_agent_rating()
RETURNS TRIGGER AS $$
DECLARE
    v_avg_rating NUMERIC;
BEGIN
    -- Recalculate the average rating for this agent from all their rated bookings
    SELECT ROUND(AVG(agent_rating::NUMERIC), 1)
    INTO v_avg_rating
    FROM public.bookings
    WHERE agent_id = NEW.agent_id
      AND agent_rating IS NOT NULL;

    -- Update the agent's profile with their new average
    UPDATE public.profiles
    SET rating = COALESCE(v_avg_rating, 0)
    WHERE id = NEW.agent_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists, then create
DROP TRIGGER IF EXISTS on_agent_rated ON public.bookings;
CREATE TRIGGER on_agent_rated
    AFTER UPDATE OF agent_rating ON public.bookings
    FOR EACH ROW
    WHEN (NEW.agent_rating IS NOT NULL)
    EXECUTE FUNCTION public.sync_agent_rating();

-- Also run a one-time recalculation for all existing ratings
UPDATE public.profiles p
SET rating = sub.avg_rating
FROM (
    SELECT agent_id, ROUND(AVG(agent_rating::NUMERIC), 1) as avg_rating
    FROM public.bookings
    WHERE agent_rating IS NOT NULL
    GROUP BY agent_id
) sub
WHERE p.id = sub.agent_id;
