-- Migration: 20240507_fix_job_duplication_final_v2.sql
-- Description: Standardizes mission visibility based on the 'Agreement Phase'.
-- 1. Resident Bookings: Must be accepted by the agent even if targeted (appear in 'Available' first).
-- 2. Marketplace Trades: Agreements are pre-negotiated (go directly to 'Active').

-- 1. Fix get_available_bookings: 
-- Shows jobs that require agent action (Accept/Decline).
CREATE OR REPLACE FUNCTION public.get_available_bookings(agent_uuid UUID)
RETURNS SETOF public.bookings AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.bookings
    WHERE status = 'pending'
    AND is_market_trade = false                      -- Marketplace trades bypass the 'Requested' tab
    AND (agent_id IS NULL OR agent_id = agent_uuid); -- Show open pool OR missions targeted to me
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix get_active_agent_jobs:
-- Shows missions that are officially confirmed/accepted.
CREATE OR REPLACE FUNCTION public.get_active_agent_jobs(agent_uuid UUID)
RETURNS SETOF public.bookings AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.bookings
    WHERE agent_id = agent_uuid
    AND (
        -- Scenario A: Marketplace trades (Pre-accepted via bidding)
        (is_market_trade = true AND status IN ('pending', 'confirmed', 'scheduled', 'in_progress', 'in-progress', 'picked_up'))
        OR
        -- Scenario B: Resident pickups (Only show after the agent has clicked 'Accept')
        (is_market_trade = false AND status IN ('confirmed', 'scheduled', 'accepted', 'in_progress', 'in-progress', 'picked_up'))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
