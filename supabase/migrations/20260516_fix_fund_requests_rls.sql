-- Migration: fix_fund_requests_rls.sql
-- Description: Hardens and fixes the RLS policies for fund_requests to prevent 401/Violation errors.

-- 1. Drop existing problematic policies
DROP POLICY IF EXISTS "Drivers can create requests" ON public.fund_requests;
DROP POLICY IF EXISTS "Drivers can see their own requests" ON public.fund_requests;
DROP POLICY IF EXISTS "Owners can see requests for their company" ON public.fund_requests;
DROP POLICY IF EXISTS "Owners can update requests for their company" ON public.fund_requests;

-- 2. Re-implement Robust Policies
-- Allow drivers to insert: Check that they are authenticated and the driver_id matches their UID
CREATE POLICY "Drivers can create requests" ON public.fund_requests
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = driver_id);

-- Allow drivers to see their own requests
CREATE POLICY "Drivers can see their own requests" ON public.fund_requests
    FOR SELECT 
    TO authenticated
    USING (auth.uid() = driver_id);

-- Allow owners to see requests directed to them
CREATE POLICY "Owners can see requests for their company" ON public.fund_requests
    FOR SELECT 
    TO authenticated
    USING (auth.uid() = company_id);

-- Allow owners to update (approve/reject) requests directed to them
CREATE POLICY "Owners can update requests for their company" ON public.fund_requests
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = company_id)
    WITH CHECK (auth.uid() = company_id);

-- 3. Ensure proper table permissions for authenticated users
GRANT ALL ON TABLE public.fund_requests TO authenticated;
