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
        delivery_method, pickup_address, dropoff_address, verification_code,
        status
    ) VALUES (
        v_rfq_id, p_offer_id, v_buyer_id, v_seller_id,
        CASE WHEN v_buyer_account_type = 'company_admin' THEN v_buyer_id ELSE NULL END,
        CASE WHEN v_buyer_account_type = 'independent' THEN v_buyer_id ELSE NULL END,
        p_delivery_method, p_pickup_address, p_dropoff_address, v_verification_code,
        CASE WHEN v_buyer_account_type = 'independent' THEN 'agent_assigned'::public.fulfillment_status_enum ELSE 'pending_coordination'::public.fulfillment_status_enum END
    ) RETURNING id INTO v_fulfillment_id;

    -- 6. Insert initial history
    INSERT INTO public.fulfillment_status_history (fulfillment_id, status, actor_id, notes)
    VALUES (
        v_fulfillment_id, 
        CASE WHEN v_buyer_account_type = 'independent' THEN 'agent_assigned'::public.fulfillment_status_enum ELSE 'pending_coordination'::public.fulfillment_status_enum END, 
        v_buyer_id, 
        'Fulfillment order created upon acceptance.'
    );

    RETURN v_fulfillment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
