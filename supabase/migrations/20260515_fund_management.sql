-- Migration: fund_management_system.sql
-- Description: Implements a fund request and internal transfer system for fleets.

-- 1. Create Fund Requests Table
CREATE TABLE IF NOT EXISTS public.fund_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES public.profiles(id) NOT NULL,
    company_id UUID REFERENCES public.profiles(id) NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    reason TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fund_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Drivers can see their own requests" ON public.fund_requests
    FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can create requests" ON public.fund_requests
    FOR INSERT WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Owners can see requests for their company" ON public.fund_requests
    FOR SELECT USING (auth.uid() = company_id);

CREATE POLICY "Owners can update requests for their company" ON public.fund_requests
    FOR UPDATE USING (auth.uid() = company_id);

-- 2. Internal Transfer RPC (Disbursement)
CREATE OR REPLACE FUNCTION public.approve_fund_request(p_request_id UUID)
RETURNS json AS $$
DECLARE
    v_request RECORD;
    v_owner_balance NUMERIC;
BEGIN
    -- 1. Get request details and lock for update
    SELECT * INTO v_request 
    FROM public.fund_requests 
    WHERE id = p_request_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Request not found');
    END IF;

    IF v_request.status != 'pending' THEN
        RETURN json_build_object('success', false, 'message', 'Request already processed');
    END IF;

    -- 2. Verify Owner Balance
    SELECT wallet_balance INTO v_owner_balance 
    FROM public.profiles 
    WHERE id = v_request.company_id;

    IF v_owner_balance < v_request.amount THEN
        RETURN json_build_object('success', false, 'message', 'Insufficient company balance');
    END IF;

    -- 3. Atomic Transfer
    -- Debit Owner
    UPDATE public.profiles 
    SET wallet_balance = wallet_balance - v_request.amount 
    WHERE id = v_request.company_id;

    -- Credit Driver
    UPDATE public.profiles 
    SET wallet_balance = wallet_balance + v_request.amount 
    WHERE id = v_request.driver_id;

    -- Update Request Status
    UPDATE public.fund_requests 
    SET status = 'approved', updated_at = now() 
    WHERE id = p_request_id;

    -- 4. Record Transactions (Audit Trail)
    -- This assumes a wallet_transactions table exists with these columns. 
    -- If it doesn't, this part might need adjustment to match your existing transaction log table.
    INSERT INTO public.wallet_transactions (profile_id, amount, type, status, description, metadata)
    VALUES 
    (v_request.company_id, -v_request.amount, 'withdrawal', 'completed', 'Fund disbursement to driver: ' || v_request.driver_id, json_build_object('request_id', p_request_id, 'target', 'driver')),
    (v_request.driver_id, v_request.amount, 'topup', 'completed', 'Fund receipt from company owner', json_build_object('request_id', p_request_id, 'source', 'owner'));

    RETURN json_build_object('success', true, 'message', 'Funds disbursed successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RPC to get pending requests for owner
CREATE OR REPLACE FUNCTION public.get_pending_fund_requests(p_owner_id UUID)
RETURNS SETOF json AS $$
BEGIN
    RETURN QUERY
    SELECT json_build_object(
        'id', r.id,
        'amount', r.amount,
        'reason', r.reason,
        'status', r.status,
        'created_at', r.created_at,
        'driver_name', p.name,
        'driver_avatar', p.avatar_url
    )
    FROM public.fund_requests r
    JOIN public.profiles p ON r.driver_id = p.id
    WHERE r.company_id = p_owner_id AND r.status = 'pending'
    ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
