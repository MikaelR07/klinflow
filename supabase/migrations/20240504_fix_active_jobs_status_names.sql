-- Migration: 20240504_fix_active_jobs_status_names.sql
-- Description: Standardizes 'in-progress' status (hyphenated) in RPCs to match JS application logic.

CREATE OR REPLACE FUNCTION public.get_active_agent_jobs(agent_uuid UUID)
RETURNS SETOF public.bookings AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.bookings
    WHERE agent_id = agent_uuid
    AND status IN ('pending', 'confirmed', 'scheduled', 'in_progress', 'in-progress');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
