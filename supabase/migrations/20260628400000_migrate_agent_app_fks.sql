-- ==============================================================================
-- MIGRATION: Switch company_id FKs from profiles(id) to companies(id)
-- ==============================================================================

DO $$
DECLARE
    v_row RECORD;
    v_hub_company_id UUID;
    v_owner_profile RECORD;
    v_count INT;
BEGIN
    -- 1. Drop old foreign key constraints
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_company_id_fkey;
    ALTER TABLE public.company_join_requests DROP CONSTRAINT IF EXISTS company_join_requests_company_id_fkey;
    ALTER TABLE public.fund_requests DROP CONSTRAINT IF EXISTS fund_requests_company_id_fkey;
    ALTER TABLE public.delivery_assignments DROP CONSTRAINT IF EXISTS delivery_assignments_company_id_fkey;

    -- 2. Helper function logic to ensure an owner has a Hub Company
    -- For any legacy table row that references an owner's profile.id as company_id,
    -- we must ensure that owner has a real Hub companies row, and then we replace
    -- the profile.id with the companies.id.

    v_count := 0;
    
    -- MIGRATE PROFILES
    FOR v_row IN SELECT id, company_id FROM public.profiles WHERE company_id IS NOT NULL LOOP
        -- Attempt to find the Hub company
        SELECT company_id INTO v_hub_company_id FROM public.user_companies WHERE user_id = v_row.company_id AND membership_role = 'owner' LIMIT 1;
        
        IF v_hub_company_id IS NULL THEN
            -- Check if the referenced profile exists and is an admin
            SELECT * INTO v_owner_profile FROM public.profiles WHERE id = v_row.company_id AND agent_account_type = 'company_admin';
            IF FOUND THEN
                -- Provision the hub company
                v_hub_company_id := gen_random_uuid();
                INSERT INTO public.companies (id, name, slug) VALUES (v_hub_company_id, COALESCE(v_owner_profile.name, 'Migrated Company'), 'migrated-company-' || substr(v_owner_profile.id::text, 1, 8));
                INSERT INTO public.user_companies (company_id, user_id, membership_role) VALUES (v_hub_company_id, v_owner_profile.id, 'owner');
            END IF;
        END IF;

        IF v_hub_company_id IS NOT NULL THEN
            UPDATE public.profiles SET company_id = v_hub_company_id WHERE id = v_row.id;
            v_count := v_count + 1;
        ELSE
            -- Invalid or missing owner, set to NULL (safe for profiles)
            UPDATE public.profiles SET company_id = NULL WHERE id = v_row.id;
        END IF;
    END LOOP;
    RAISE NOTICE 'Migrated % profiles.', v_count;

    -- MIGRATE COMPANY_JOIN_REQUESTS
    v_count := 0;
    FOR v_row IN SELECT id, company_id FROM public.company_join_requests WHERE company_id IS NOT NULL LOOP
        SELECT company_id INTO v_hub_company_id FROM public.user_companies WHERE user_id = v_row.company_id AND membership_role = 'owner' LIMIT 1;
        
        IF v_hub_company_id IS NULL THEN
            SELECT * INTO v_owner_profile FROM public.profiles WHERE id = v_row.company_id AND agent_account_type = 'company_admin';
            IF FOUND THEN
                v_hub_company_id := gen_random_uuid();
                INSERT INTO public.companies (id, name, slug) VALUES (v_hub_company_id, COALESCE(v_owner_profile.name, 'Migrated Company'), 'migrated-company-' || substr(v_owner_profile.id::text, 1, 8));
                INSERT INTO public.user_companies (company_id, user_id, membership_role) VALUES (v_hub_company_id, v_owner_profile.id, 'owner');
            END IF;
        END IF;

        IF v_hub_company_id IS NOT NULL THEN
            BEGIN
                UPDATE public.company_join_requests SET company_id = v_hub_company_id WHERE id = v_row.id;
                v_count := v_count + 1;
            EXCEPTION WHEN unique_violation THEN
                DELETE FROM public.company_join_requests WHERE id = v_row.id;
            END;
        ELSE
            DELETE FROM public.company_join_requests WHERE id = v_row.id;
        END IF;
    END LOOP;
    RAISE NOTICE 'Migrated % company_join_requests.', v_count;

    -- MIGRATE FUND_REQUESTS
    v_count := 0;
    FOR v_row IN SELECT id, company_id FROM public.fund_requests WHERE company_id IS NOT NULL LOOP
        SELECT company_id INTO v_hub_company_id FROM public.user_companies WHERE user_id = v_row.company_id AND membership_role = 'owner' LIMIT 1;
        
        IF v_hub_company_id IS NULL THEN
            SELECT * INTO v_owner_profile FROM public.profiles WHERE id = v_row.company_id AND agent_account_type = 'company_admin';
            IF FOUND THEN
                v_hub_company_id := gen_random_uuid();
                INSERT INTO public.companies (id, name, slug) VALUES (v_hub_company_id, COALESCE(v_owner_profile.name, 'Migrated Company'), 'migrated-company-' || substr(v_owner_profile.id::text, 1, 8));
                INSERT INTO public.user_companies (company_id, user_id, membership_role) VALUES (v_hub_company_id, v_owner_profile.id, 'owner');
            END IF;
        END IF;

        IF v_hub_company_id IS NOT NULL THEN
            UPDATE public.fund_requests SET company_id = v_hub_company_id WHERE id = v_row.id;
            v_count := v_count + 1;
        ELSE
            DELETE FROM public.fund_requests WHERE id = v_row.id;
        END IF;
    END LOOP;
    RAISE NOTICE 'Migrated % fund_requests.', v_count;

    -- MIGRATE DELIVERY_ASSIGNMENTS
    v_count := 0;
    FOR v_row IN SELECT id, company_id FROM public.delivery_assignments WHERE company_id IS NOT NULL LOOP
        SELECT company_id INTO v_hub_company_id FROM public.user_companies WHERE user_id = v_row.company_id AND membership_role = 'owner' LIMIT 1;
        
        IF v_hub_company_id IS NULL THEN
            SELECT * INTO v_owner_profile FROM public.profiles WHERE id = v_row.company_id AND agent_account_type = 'company_admin';
            IF FOUND THEN
                v_hub_company_id := gen_random_uuid();
                INSERT INTO public.companies (id, name, slug) VALUES (v_hub_company_id, COALESCE(v_owner_profile.name, 'Migrated Company'), 'migrated-company-' || substr(v_owner_profile.id::text, 1, 8));
                INSERT INTO public.user_companies (company_id, user_id, membership_role) VALUES (v_hub_company_id, v_owner_profile.id, 'owner');
            END IF;
        END IF;

        IF v_hub_company_id IS NOT NULL THEN
            UPDATE public.delivery_assignments SET company_id = v_hub_company_id WHERE id = v_row.id;
            v_count := v_count + 1;
        ELSE
            DELETE FROM public.delivery_assignments WHERE id = v_row.id;
        END IF;
    END LOOP;
    RAISE NOTICE 'Migrated % delivery_assignments.', v_count;

    -- 3. Add new foreign key constraints referencing companies(id)
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;
    ALTER TABLE public.company_join_requests ADD CONSTRAINT company_join_requests_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
    ALTER TABLE public.fund_requests ADD CONSTRAINT fund_requests_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
    ALTER TABLE public.delivery_assignments ADD CONSTRAINT delivery_assignments_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

END;
$$;
