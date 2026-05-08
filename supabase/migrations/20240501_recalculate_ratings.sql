-- Recalculate all agent ratings from the actual booking data
UPDATE public.profiles p
SET rating = (
    SELECT ROUND(AVG(agent_rating::NUMERIC), 1)
    FROM public.bookings
    WHERE agent_id = p.id
      AND agent_rating IS NOT NULL
);
