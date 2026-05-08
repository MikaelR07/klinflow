-- Migration: 20240429_fleet_invite_codes.sql
-- Description: Adds a unique fleet invite code to profiles for company admins to onboard drivers.

-- 1. Add the column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS fleet_invite_code TEXT UNIQUE;

-- 2. Create a function to generate a random 6-character code
CREATE OR REPLACE FUNCTION generate_fleet_code() RETURNS TEXT AS $$
DECLARE
    v_chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    v_result TEXT := '';
    i INTEGER := 0;
    v_exists BOOLEAN;
BEGIN
    LOOP
        v_result := 'CF-';
        FOR i IN 1..6 LOOP
            v_result := v_result || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
        END LOOP;
        
        -- Check if it already exists
        SELECT EXISTS(SELECT 1 FROM public.profiles WHERE fleet_invite_code = v_result) INTO v_exists;
        
        IF NOT v_exists THEN
            RETURN v_result;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- 3. Auto-generate code for Company Admins on INSERT or UPDATE
CREATE OR REPLACE FUNCTION public.handle_fleet_invite_code()
RETURNS trigger AS $$
BEGIN
  IF NEW.agent_account_type = 'company_admin' AND NEW.fleet_invite_code IS NULL THEN
    NEW.fleet_invite_code := generate_fleet_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_company_admin_created ON public.profiles;
CREATE TRIGGER on_company_admin_created
  BEFORE INSERT OR UPDATE OF agent_account_type ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_fleet_invite_code();

-- 4. Backfill existing company admins
UPDATE public.profiles
SET fleet_invite_code = generate_fleet_code()
WHERE agent_account_type = 'company_admin' AND fleet_invite_code IS NULL;
