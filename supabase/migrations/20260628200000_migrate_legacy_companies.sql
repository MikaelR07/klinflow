-- Migration: Migrate legacy company owners and agents to the new Hub Architecture
-- This script safely transitions users from the old `profiles.company_id = owner_id` model
-- to the new `companies`, `user_companies`, and `hub_user_roles` architecture.

DO $$
DECLARE
    owner_rec RECORD;
    new_company_id UUID;
    agent_rec RECORD;
BEGIN
    -- 1. Find all legacy company owners
    -- We assume they have agent_account_type = 'company_admin' OR other users use their ID as company_id
    FOR owner_rec IN 
        SELECT p.id, p.name, p.business_name, p.email, p.klinflow_id 
        FROM public.profiles p
        WHERE p.agent_account_type = 'company_admin' 
           OR p.id IN (SELECT DISTINCT company_id FROM public.profiles WHERE company_id IS NOT NULL AND company_id != id)
    LOOP
        -- Generate a new UUID for the company
        new_company_id := gen_random_uuid();
        
        -- Create the company record
        INSERT INTO public.companies (id, name, slug, owner_id, created_at, updated_at)
        VALUES (
            new_company_id, 
            COALESCE(owner_rec.business_name, owner_rec.name || ' Company'), 
            'company-' || substring(new_company_id::text from 1 for 8), 
            owner_rec.id,
            now(), 
            now()
        );

        -- Link the owner to this new company as 'owner'
        INSERT INTO public.user_companies (company_id, user_id, membership_role)
        VALUES (new_company_id, owner_rec.id, 'owner')
        ON CONFLICT (company_id, user_id) DO NOTHING;

        -- Give the owner full access to all dashboards
        INSERT INTO public.hub_user_roles (company_id, user_id, role)
        VALUES 
            (new_company_id, owner_rec.id, 'operations_manager'),
            (new_company_id, owner_rec.id, 'fleet_manager'),
            (new_company_id, owner_rec.id, 'sales_manager'),
            (new_company_id, owner_rec.id, 'finance_manager'),
            (new_company_id, owner_rec.id, 'executive_viewer')
        ON CONFLICT DO NOTHING;

        -- 2. Find all agents that were under this owner
        -- (They previously had the owner's profile ID as their company_id)
        FOR agent_rec IN 
            SELECT id FROM public.profiles 
            WHERE company_id = owner_rec.id 
              AND id != owner_rec.id
        LOOP
            -- Link the agent to the new company as a member
            INSERT INTO public.user_companies (company_id, user_id, membership_role)
            VALUES (new_company_id, agent_rec.id, 'member')
            ON CONFLICT (company_id, user_id) DO NOTHING;

            -- We intentionally DO NOT add them to hub_user_roles 
            -- because field agents use the mobile app, not the Hub Dashboard.

            -- Update the agent's profile company_id to the NEW company_id
            UPDATE public.profiles 
            SET company_id = new_company_id 
            WHERE id = agent_rec.id;
        END LOOP;
        
        -- Finally, update the owner's profile company_id to the NEW company_id
        UPDATE public.profiles 
        SET company_id = new_company_id 
        WHERE id = owner_rec.id;
        
    END LOOP;
END $$;
