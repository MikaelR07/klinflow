-- ── 1. ADD RATING COLUMNS TO BOOKINGS ──────────────────────────────
-- These columns allow the user to rate the agent after completion.
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS agent_rating INTEGER CHECK (agent_rating >= 1 AND agent_rating <= 5),
ADD COLUMN IF NOT EXISTS agent_rating_comment TEXT;

-- ── 2. AGENT STATS TRIGGER (OPTIONAL BUT RECOMMENDED) ──────────────
-- This function can be used later to update an agent's average rating 
-- on their profile whenever a new rating is submitted.
CREATE OR REPLACE FUNCTION public.update_agent_average_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.agent_id IS NOT NULL AND NEW.agent_rating IS NOT NULL THEN
    UPDATE public.profiles
    SET rating_average = (
      SELECT AVG(agent_rating)::NUMERIC(3,2)
      FROM public.bookings
      WHERE agent_id = NEW.agent_id AND agent_rating IS NOT NULL
    )
    WHERE id = NEW.agent_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add the trigger to the bookings table
DROP TRIGGER IF EXISTS on_agent_rating_submitted ON public.bookings;
CREATE TRIGGER on_agent_rating_submitted
AFTER UPDATE OF agent_rating ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_agent_average_rating();
