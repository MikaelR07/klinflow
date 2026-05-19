-- Migration: 20260517_filter_available_bookings_by_material.sql
-- Description: Updates the get_available_bookings RPC to filter open pool bookings
-- based on the agent's accepted_materials configuration.

CREATE OR REPLACE FUNCTION public.get_available_bookings(agent_uuid UUID)
RETURNS SETOF public.bookings AS $$
DECLARE
    v_account_type TEXT;
    v_company_id UUID;
    v_config_agent_id UUID;
    v_accepted_materials JSONB;
BEGIN
    -- 1. Determine which agent's config to use
    SELECT agent_account_type, company_id INTO v_account_type, v_company_id 
    FROM public.profiles WHERE id = agent_uuid;

    IF v_account_type = 'fleet_driver' AND v_company_id IS NOT NULL THEN
        v_config_agent_id := v_company_id;
    ELSE
        v_config_agent_id := agent_uuid;
    END IF;

    -- 2. Fetch the accepted materials from the configuration
    SELECT accepted_materials INTO v_accepted_materials
    FROM public.agent_configurations
    WHERE agent_id = v_config_agent_id;

    -- 3. Return matching bookings
    RETURN QUERY
    SELECT b.* FROM public.bookings b
    WHERE b.status = 'pending'
    AND b.is_market_trade = false
    AND (
        b.agent_id = agent_uuid -- Directly targeted
        OR 
        (
            b.agent_id IS NULL -- Open pool
            AND (
                v_accepted_materials IS NULL 
                OR jsonb_array_length(v_accepted_materials) = 0
                OR v_accepted_materials ? b.waste_type
            )
        )
    )
    ORDER BY b.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
