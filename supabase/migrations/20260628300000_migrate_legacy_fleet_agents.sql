-- ==============================================================================
-- MIGRATION: Migrate Legacy Fleet Agents to Hub Architecture
-- ==============================================================================
-- This script finds all approved fleet drivers who are linked to a company admin's
-- profile ID (the legacy way) and inserts them into the new user_companies table
-- so they show up in the Hub Team Management page.

DO $$
DECLARE
    v_agent RECORD;
    v_hub_company_id UUID;
    v_count INT := 0;
BEGIN
    -- Loop through all users who are marked as fleet_driver and have a company_id
    FOR v_agent IN 
        SELECT id, name, company_id 
        FROM public.profiles 
        WHERE agent_account_type = 'fleet_driver' 
          AND company_id IS NOT NULL
    LOOP
        -- The legacy company_id is actually the profile ID of the company owner.
        -- We need to find the new Hub company ID that this owner owns.
        SELECT company_id INTO v_hub_company_id
        FROM public.user_companies
        WHERE user_id = v_agent.company_id 
          AND membership_role = 'owner'
        LIMIT 1;

        IF v_hub_company_id IS NOT NULL THEN
            -- Insert the agent into the real Hub company as a 'member'
            INSERT INTO public.user_companies (company_id, user_id, membership_role)
            VALUES (v_hub_company_id, v_agent.id, 'member')
            ON CONFLICT (user_id, company_id) DO NOTHING;

            v_count := v_count + 1;
            RAISE NOTICE 'Migrated Agent % to Hub Company %', v_agent.name, v_hub_company_id;
        ELSE
            RAISE NOTICE 'Skipped Agent %: Owner % has no Hub company setup yet.', v_agent.name, v_agent.company_id;
        END IF;
    END LOOP;

    RAISE NOTICE 'Successfully migrated % legacy fleet agents to Hub architecture.', v_count;
END;
$$;
