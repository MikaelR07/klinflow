-- Dynamic Seed Script: 3 Companies, 3 Owners, 30 Agents (Some Managers, Some Field)
-- Password for all users will be: 12345678

DO $$
DECLARE
    enc_password TEXT := crypt('12345678', gen_salt('bf', 10));
    company_id UUID;
    owner_id UUID;
    agent_id UUID;
    company_name TEXT;
    phone_prefix TEXT;
BEGIN
    -- 0. DELETE EXISTING SEED USERS TO START FRESH
    DELETE FROM auth.users WHERE email LIKE '2547100%' OR email LIKE '2547200%' OR email LIKE '2547300%';
    DELETE FROM public.companies WHERE slug LIKE 'company-test-slug-%';

    -- Loop to create 3 separate companies
    FOR c IN 1..3 LOOP
        company_id := gen_random_uuid();
        owner_id := gen_random_uuid();
        
        -- Set company names and phone prefixes based on iteration
        IF c = 1 THEN
            company_name := 'Acme Recycling Corp';
            phone_prefix := '07100';
        ELSIF c = 2 THEN
            company_name := 'EcoCycle Solutions';
            phone_prefix := '07200';
        ELSE
            company_name := 'GreenEarth Ltd';
            phone_prefix := '07300';
        END IF;

        -- ==========================================
        -- 1. CREATE COMPANY OWNER
        -- ==========================================
        INSERT INTO auth.users (id, instance_id, email, aud, role, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change_token_current, email_change, reauthentication_token)
        VALUES (owner_id, '00000000-0000-0000-0000-000000000000', '254' || substring(phone_prefix from 2) || '00000@klinflow.ke', 'authenticated', 'authenticated', enc_password, now(), '{"provider":"email","providers":["email"]}'::jsonb, ('{"phone":"' || phone_prefix || '00000"}')::jsonb, now(), now(), '', '', '', '', '', '');

        INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
        VALUES (gen_random_uuid(), owner_id, owner_id::text, format('{"sub":"%s","email":"%s"}', owner_id, '254' || substring(phone_prefix from 2) || '00000@klinflow.ke')::jsonb, 'email', now(), now(), now());

        -- ==========================================
        -- 2. CREATE COMPANY (Depends on Owner ID)
        -- ==========================================
        INSERT INTO public.companies (id, name, slug, owner_id)
        VALUES (company_id, company_name, 'company-test-slug-' || c, owner_id);

        -- Create Owner Profile

        INSERT INTO public.profiles (id, name, phone, email, role, is_verified, company_id, agent_account_type)
        VALUES (owner_id, 'Owner ' || c || ' (' || company_name || ')', phone_prefix || '00000', '254' || substring(phone_prefix from 2) || '00000@klinflow.ke', 'admin', true, owner_id, 'company_admin');

        INSERT INTO public.user_companies (company_id, user_id, membership_role)
        VALUES (company_id, owner_id, 'owner');

        -- Give Owner ALL Hub Roles
        INSERT INTO public.hub_user_roles (company_id, user_id, role)
        VALUES 
            (company_id, owner_id, 'operations_manager'),
            (company_id, owner_id, 'fleet_manager'),
            (company_id, owner_id, 'sales_manager'),
            (company_id, owner_id, 'finance_manager'),
            (company_id, owner_id, 'executive_viewer');

        -- ==========================================
        -- 3. CREATE 10 AGENTS PER COMPANY
        -- ==========================================
        FOR a IN 1..10 LOOP
            agent_id := gen_random_uuid();
            
            -- Insert Auth User
            INSERT INTO auth.users (id, instance_id, email, aud, role, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change_token_current, email_change, reauthentication_token)
            VALUES (agent_id, '00000000-0000-0000-0000-000000000000', '254' || substring(phone_prefix from 2) || lpad(a::text, 5, '0') || '@klinflow.ke', 'authenticated', 'authenticated', enc_password, now(), '{"provider":"email","providers":["email"]}'::jsonb, ('{"phone":"' || phone_prefix || lpad(a::text, 5, '0') || '"}')::jsonb, now(), now(), '', '', '', '', '', '');

            -- Insert Auth Identity
            INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
            VALUES (gen_random_uuid(), agent_id, agent_id::text, format('{"sub":"%s","email":"%s"}', agent_id, '254' || substring(phone_prefix from 2) || lpad(a::text, 5, '0') || '@klinflow.ke')::jsonb, 'email', now(), now(), now());

            -- Insert Profile
            -- Agents 1-5 are "Managers" (Hub Access), Agents 6-10 are "Field Agents" (Mobile Only)
            INSERT INTO public.profiles (id, name, phone, email, role, is_verified, company_id, agent_account_type)
            VALUES (
                agent_id, 
                CASE WHEN a <= 5 THEN 'Manager ' || a ELSE 'Field Agent ' || a END || ' (Co ' || c || ')', 
                phone_prefix || lpad(a::text, 5, '0'), 
                '254' || substring(phone_prefix from 2) || lpad(a::text, 5, '0') || '@klinflow.ke', 
                'agent', 
                true, 
                owner_id, 
                'fleet_driver'
            );

            -- Assign to Company
            INSERT INTO public.user_companies (company_id, user_id, membership_role)
            VALUES (company_id, agent_id, 'member');

            -- Only give Hub Roles to the first 5 agents
            IF a = 1 THEN
                INSERT INTO public.hub_user_roles (company_id, user_id, role) VALUES (company_id, agent_id, 'operations_manager');
            ELSIF a = 2 THEN
                INSERT INTO public.hub_user_roles (company_id, user_id, role) VALUES (company_id, agent_id, 'fleet_manager');
            ELSIF a = 3 THEN
                INSERT INTO public.hub_user_roles (company_id, user_id, role) VALUES (company_id, agent_id, 'finance_manager');
            ELSIF a = 4 THEN
                INSERT INTO public.hub_user_roles (company_id, user_id, role) VALUES (company_id, agent_id, 'sales_manager');
            ELSIF a = 5 THEN
                INSERT INTO public.hub_user_roles (company_id, user_id, role) VALUES (company_id, agent_id, 'executive_viewer');
            END IF;
            
        END LOOP;
    END LOOP;
END $$;
