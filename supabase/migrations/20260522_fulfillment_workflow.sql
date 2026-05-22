-- Migration: 20260522_fulfillment_workflow.sql
-- Description: Creates the full post-acceptance fulfillment architecture.

-- 1. Create Enums
CREATE TYPE public.fulfillment_status_enum AS ENUM (
  'pending_coordination',
  'pickup_scheduled',
  'agent_assigned',
  'agent_on_the_way',
  'arrived',
  'material_verification',
  'pickup_completed',
  'in_transit',
  'delivered',
  'completed',
  'cancelled',
  'disputed'
);

CREATE TYPE public.delivery_method_enum AS ENUM ('agent_pickup', 'self_drop', 'flexible');

-- 2. Create fulfillment_orders table
CREATE TABLE IF NOT EXISTS public.fulfillment_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
    proposal_id UUID NOT NULL REFERENCES public.rfq_offers(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    delivery_method public.delivery_method_enum NOT NULL,
    pickup_address TEXT,
    dropoff_address TEXT,
    
    scheduled_date DATE,
    scheduled_time TIME,
    estimated_arrival TIMESTAMPTZ,
    
    status public.fulfillment_status_enum DEFAULT 'pending_coordination',
    verification_code VARCHAR(6) NOT NULL,
    
    -- Financial & Verification States
    payment_status TEXT DEFAULT 'pending',
    verification_status TEXT DEFAULT 'pending',
    
    -- Operational Data
    actual_weight NUMERIC,
    verified_weight NUMERIC,
    quality_grade TEXT,
    contamination_level NUMERIC,
    
    completion_notes TEXT,
    cancellation_reason TEXT,
    dispute_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create fulfillment_status_history table
CREATE TABLE IF NOT EXISTS public.fulfillment_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fulfillment_id UUID NOT NULL REFERENCES public.fulfillment_orders(id) ON DELETE CASCADE,
    status public.fulfillment_status_enum NOT NULL,
    actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create delivery_assignments table
CREATE TABLE IF NOT EXISTS public.delivery_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fulfillment_id UUID NOT NULL REFERENCES public.fulfillment_orders(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assignment_status TEXT DEFAULT 'pending' CHECK (assignment_status IN ('pending', 'accepted', 'rejected', 'reassigned')),
    dispatch_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create material_verifications table
CREATE TABLE IF NOT EXISTS public.material_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fulfillment_id UUID NOT NULL REFERENCES public.fulfillment_orders(id) ON DELETE CASCADE,
    submitted_weight NUMERIC NOT NULL,
    verified_weight NUMERIC NOT NULL,
    quality_grade TEXT NOT NULL,
    contamination_level NUMERIC NOT NULL,
    photos TEXT[] DEFAULT '{}',
    notes TEXT,
    verified_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create disputes table
CREATE TABLE IF NOT EXISTS public.disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fulfillment_id UUID NOT NULL REFERENCES public.fulfillment_orders(id) ON DELETE CASCADE,
    raised_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    dispute_type TEXT NOT NULL,
    evidence_photos TEXT[] DEFAULT '{}',
    description TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved')),
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 7. Add Triggers for updated_at
CREATE TRIGGER handle_updated_at_fulfillment_orders
    BEFORE UPDATE ON public.fulfillment_orders
    FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);

CREATE TRIGGER handle_updated_at_delivery_assignments
    BEFORE UPDATE ON public.delivery_assignments
    FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);

-- 8. Row Level Security

ALTER TABLE public.fulfillment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fulfillment_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- fulfillment_orders RLS
CREATE POLICY "Users can view relevant fulfillments" 
ON public.fulfillment_orders FOR SELECT 
USING (
    auth.uid() = buyer_id OR 
    auth.uid() = seller_id OR 
    auth.uid() = assigned_agent_id OR 
    auth.uid() = organization_id
);

CREATE POLICY "Users can update relevant fulfillments" 
ON public.fulfillment_orders FOR UPDATE 
USING (
    auth.uid() = buyer_id OR 
    auth.uid() = seller_id OR 
    auth.uid() = assigned_agent_id OR 
    auth.uid() = organization_id
);

-- fulfillment_status_history RLS
CREATE POLICY "Users can view relevant history" 
ON public.fulfillment_status_history FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.fulfillment_orders fo
        WHERE fo.id = fulfillment_id
        AND (auth.uid() = fo.buyer_id OR auth.uid() = fo.seller_id OR auth.uid() = fo.assigned_agent_id OR auth.uid() = fo.organization_id)
    )
);

CREATE POLICY "Actors can insert history" 
ON public.fulfillment_status_history FOR INSERT 
WITH CHECK (auth.uid() = actor_id);

-- delivery_assignments RLS
CREATE POLICY "Company and driver can view assignments" 
ON public.delivery_assignments FOR SELECT 
USING (auth.uid() = company_id OR auth.uid() = driver_id);

CREATE POLICY "Company can insert assignments" 
ON public.delivery_assignments FOR INSERT 
WITH CHECK (auth.uid() = company_id);

CREATE POLICY "Company and driver can update assignments" 
ON public.delivery_assignments FOR UPDATE 
USING (auth.uid() = company_id OR auth.uid() = driver_id);

-- material_verifications RLS
CREATE POLICY "Users can view relevant verifications" 
ON public.material_verifications FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.fulfillment_orders fo
        WHERE fo.id = fulfillment_id
        AND (auth.uid() = fo.buyer_id OR auth.uid() = fo.seller_id OR auth.uid() = fo.assigned_agent_id OR auth.uid() = fo.organization_id)
    )
);

CREATE POLICY "Verifiers can insert verifications" 
ON public.material_verifications FOR INSERT 
WITH CHECK (auth.uid() = verified_by);

-- disputes RLS
CREATE POLICY "Users can view relevant disputes" 
ON public.disputes FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.fulfillment_orders fo
        WHERE fo.id = fulfillment_id
        AND (auth.uid() = fo.buyer_id OR auth.uid() = fo.seller_id OR auth.uid() = fo.assigned_agent_id OR auth.uid() = fo.organization_id)
    )
);

CREATE POLICY "Involved users can raise disputes" 
ON public.disputes FOR INSERT 
WITH CHECK (auth.uid() = raised_by);

-- 9. Accept RFQ RPC
CREATE OR REPLACE FUNCTION public.accept_rfq_offer_v2(
    p_offer_id UUID,
    p_delivery_method public.delivery_method_enum DEFAULT 'agent_pickup',
    p_pickup_address TEXT DEFAULT NULL,
    p_dropoff_address TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_rfq_id UUID;
    v_buyer_id UUID;
    v_seller_id UUID;
    v_buyer_account_type TEXT;
    v_buyer_company_id UUID;
    v_verification_code VARCHAR(6);
    v_fulfillment_id UUID;
BEGIN
    -- 1. Fetch offer details
    SELECT rfq_id, buyer_id, seller_id INTO v_rfq_id, v_buyer_id, v_seller_id
    FROM public.rfq_offers
    WHERE id = p_offer_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Offer not found or not pending';
    END IF;

    -- 2. Fetch buyer details
    SELECT agent_account_type, company_id INTO v_buyer_account_type, v_buyer_company_id
    FROM public.profiles
    WHERE id = v_buyer_id;

    -- 3. Update RFQ and Offers
    UPDATE public.rfq_offers SET status = 'accepted' WHERE id = p_offer_id;
    UPDATE public.rfq_offers SET status = 'rejected' WHERE rfq_id = v_rfq_id AND status = 'pending' AND id != p_offer_id;
    UPDATE public.rfqs SET status = 'fulfilled' WHERE id = v_rfq_id;

    -- 4. Generate random 6 digit code
    v_verification_code := lpad(floor(random() * 1000000)::text, 6, '0');

    -- 5. Create Fulfillment Order
    INSERT INTO public.fulfillment_orders (
        rfq_id, proposal_id, buyer_id, seller_id, 
        organization_id, assigned_agent_id,
        delivery_method, pickup_address, dropoff_address, verification_code
    ) VALUES (
        v_rfq_id, p_offer_id, v_buyer_id, v_seller_id,
        CASE WHEN v_buyer_account_type = 'company_admin' THEN v_buyer_id ELSE NULL END,
        CASE WHEN v_buyer_account_type = 'independent' THEN v_buyer_id ELSE NULL END,
        p_delivery_method, p_pickup_address, p_dropoff_address, v_verification_code
    ) RETURNING id INTO v_fulfillment_id;

    -- 6. Insert initial history
    INSERT INTO public.fulfillment_status_history (fulfillment_id, status, actor_id, notes)
    VALUES (v_fulfillment_id, 'pending_coordination', v_buyer_id, 'Fulfillment order created upon acceptance.');

    RETURN v_fulfillment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
