-- ── FLEET VISIBILITY SECURITY POLICY ──
-- This migration ensures that Company Admins can see their own drivers' profiles
-- and that all agents can see the Company Admin's basic info.

-- 1. Enable RLS on profiles if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. POLICY: Users can manage their own profile
DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
CREATE POLICY "Users can manage own profile" 
ON public.profiles FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. POLICY: Company Admins can view their fleet drivers
DROP POLICY IF EXISTS "Company Admins can view their fleet" ON public.profiles;
CREATE POLICY "Company Admins can view their fleet" 
ON public.profiles FOR SELECT
TO authenticated
USING (company_id = auth.uid());

-- 4. POLICY: Fleet Drivers can see their Company Admin's basic profile
DROP POLICY IF EXISTS "Drivers can view their company admin" ON public.profiles;
CREATE POLICY "Drivers can view their company admin" 
ON public.profiles FOR SELECT
TO authenticated
USING (id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- 5. POLICY: Public visibility for Agents (for Residents to book them)
DROP POLICY IF EXISTS "Public can view agents for booking" ON public.profiles;
CREATE POLICY "Public can view agents for booking" 
ON public.profiles FOR SELECT
TO authenticated
USING (role = 'agent' OR role = 'business');

-- 6. Ensure everyone can see who the Admin is
DROP POLICY IF EXISTS "Allow viewing of company admins" ON public.profiles;
CREATE POLICY "Allow viewing of company admins"
ON public.profiles FOR SELECT
TO authenticated
USING (agent_account_type = 'company_admin');
