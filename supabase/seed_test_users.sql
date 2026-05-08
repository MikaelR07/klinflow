-- Seed Test Users for CleanFlow Aggregator Model
-- Password for all users: 12345678 (Bcrypt hash provided)
-- Note: Run this in the Supabase SQL Editor

DO $$
DECLARE
    company_admin_id UUID := 'a1b2c3d4-e5f6-4789-a1b2-c3d4e5f6a7b8';
    fleet_driver_id UUID := 'b2c3d4e5-f6a7-4890-b2c3-d4e5f6a7b8c9';
    independent_agent_id UUID := 'c3d4e5f6-a7b8-4901-c3d4-e5f6a7b8c9d0';
    -- This is a bcrypt hash for '12345678'
    password_hash TEXT := '$2a$10$abcdefghijklmnopqrstuv'; -- Note: In real life you'd use a real hash, but for testing we can use a placeholder and have the user 'reset' or I will use a real one if I can.
    -- Actually, Supabase uses a specific format. Let's use a more standard approach:
    -- I will insert into public.profiles and the user can 'Sign Up' via the app to create the auth.users entry.
    -- BUT the user wants to 'Log In'.
BEGIN
    -- 1. Create Company Admin (Mikael)
    INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
    VALUES (company_admin_id, 'authenticated', 'authenticated', '254712345678@cleanflow.ke', crypt('12345678', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Mikael (Admin)","phone":"0712345678"}', now(), now(), '', '', '', '')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.profiles (id, name, phone, role, agent_account_type, fleet_invite_code, company_name, is_online, is_verified, wallet_balance, reward_points, location)
    VALUES (company_admin_id, 'Mikael (Admin)', '0712345678', 'agent', 'company_admin', 'GLOOP24', 'GreenLoop Logistics', true, true, 5000, 1200, '{"estate": "South B", "latitude": -1.31, "longitude": 36.83}')
    ON CONFLICT (id) DO NOTHING;

    -- 1.5 Add Configuration for Company
    INSERT INTO public.agent_configurations (agent_id, base_logistics_fee, cashback_percentage, accepted_materials)
    VALUES (company_admin_id, 150, 5, '["plastic", "metal", "e-waste"]')
    ON CONFLICT (agent_id) DO NOTHING;

    -- 2. Create Fleet Driver (John)
    INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
    VALUES (fleet_driver_id, 'authenticated', 'authenticated', '254722222222@cleanflow.ke', crypt('12345678', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"John Driver","phone":"0722222222"}', now(), now(), '', '', '', '')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.profiles (id, name, phone, role, agent_account_type, company_id, is_online, is_verified, wallet_balance, reward_points, location)
    VALUES (fleet_driver_id, 'John Driver', '0722222222', 'agent', 'fleet_driver', company_admin_id, true, true, 450, 150, '{"estate": "South B", "latitude": -1.312, "longitude": 36.835}')
    ON CONFLICT (id) DO NOTHING;

    -- 3. Create Independent Agent (Sarah)
    INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
    VALUES (independent_agent_id, 'authenticated', 'authenticated', '254733333333@cleanflow.ke', crypt('12345678', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sarah Freelance","phone":"0733333333"}', now(), now(), '', '', '', '')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.profiles (id, name, phone, role, agent_account_type, is_online, is_verified, wallet_balance, reward_points, location)
    VALUES (independent_agent_id, 'Sarah Freelance', '0733333333', 'agent', 'independent', true, true, 800, 300, '{"estate": "Langata", "latitude": -1.33, "longitude": 36.78}')
    ON CONFLICT (id) DO NOTHING;

    -- 3.5 Add Configuration for Sarah
    INSERT INTO public.agent_configurations (agent_id, base_logistics_fee, cashback_percentage, accepted_materials)
    VALUES (independent_agent_id, 0, 2, '["organic", "general"]')
    ON CONFLICT (agent_id) DO NOTHING;

END $$;
