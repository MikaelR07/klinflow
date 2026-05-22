-- Migration: Fleet Driver Approval Workflow

CREATE TABLE IF NOT EXISTS public.company_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(driver_id, company_id)
);

-- Enable RLS
ALTER TABLE public.company_join_requests ENABLE ROW LEVEL SECURITY;

-- Policies

-- Drivers can see their own requests
CREATE POLICY "Drivers can view their own requests"
ON public.company_join_requests FOR SELECT
TO authenticated
USING (driver_id = auth.uid());

-- Company owners can see requests targeted to them
CREATE POLICY "Company owners can view requests to their company"
ON public.company_join_requests FOR SELECT
TO authenticated
USING (company_id = auth.uid());

-- Drivers can insert their own requests
CREATE POLICY "Drivers can create requests"
ON public.company_join_requests FOR INSERT
TO authenticated
WITH CHECK (driver_id = auth.uid());

-- Company owners can update requests targeted to them
CREATE POLICY "Company owners can update requests"
ON public.company_join_requests FOR UPDATE
TO authenticated
USING (company_id = auth.uid())
WITH CHECK (company_id = auth.uid());

-- Add a trigger to update updated_at
CREATE OR REPLACE FUNCTION update_company_join_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_company_join_requests_updated_at_trigger ON public.company_join_requests;
CREATE TRIGGER update_company_join_requests_updated_at_trigger
BEFORE UPDATE ON public.company_join_requests
FOR EACH ROW
EXECUTE FUNCTION update_company_join_requests_updated_at();

-- Rpc to approve driver request securely
CREATE OR REPLACE FUNCTION approve_fleet_driver_request(p_request_id UUID)
RETURNS boolean AS $$
DECLARE
    v_request RECORD;
BEGIN
    -- Get request
    SELECT * INTO v_request
    FROM public.company_join_requests
    WHERE id = p_request_id AND company_id = auth.uid() AND status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request not found or not authorized';
    END IF;

    -- Update request status
    UPDATE public.company_join_requests
    SET status = 'approved'
    WHERE id = p_request_id;

    -- Update driver profile to set company_id
    UPDATE public.profiles
    SET company_id = v_request.company_id,
        agent_account_type = 'fleet_driver'
    WHERE id = v_request.driver_id;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rpc to reject driver request securely
CREATE OR REPLACE FUNCTION reject_fleet_driver_request(p_request_id UUID)
RETURNS boolean AS $$
BEGIN
    UPDATE public.company_join_requests
    SET status = 'rejected'
    WHERE id = p_request_id AND company_id = auth.uid() AND status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request not found or not authorized';
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
