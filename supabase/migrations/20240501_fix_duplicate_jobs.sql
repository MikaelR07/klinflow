-- Migration: 20240501_fix_duplicate_jobs.sql
-- Description: Ensures that jobs targeted to a specific agent only appear in their 'Active' tab, 
-- while the 'Available' tab only shows open marketplace jobs.

-- 1. Fix get_available_bookings: Only show jobs with NO agent assigned (Open Marketplace)
CREATE OR REPLACE FUNCTION public.get_available_bookings(agent_uuid UUID)
RETURNS SETOF public.bookings AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.bookings
    WHERE status = 'pending'
    AND agent_id IS NULL; -- Only show jobs that haven't been targeted yet
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix get_active_agent_jobs: Show jobs explicitly assigned to this agent
CREATE OR REPLACE FUNCTION public.get_active_agent_jobs(agent_uuid UUID)
RETURNS SETOF public.bookings AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.bookings
    WHERE agent_id = agent_uuid
    AND status IN ('pending', 'confirmed', 'in_progress'); -- Shows both targeted and accepted jobs
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
