-- Migration: 20260614132500_finalize_group_rfq.sql
-- Description: RPC to finalize a group collection RFQ and generate fulfillment orders for all accepted pledges.

CREATE OR REPLACE FUNCTION public.finalize_group_rfq(
    p_rfq_id UUID
) RETURNS INTEGER AS $$
DECLARE
    v_buyer_id UUID;
    v_buyer_account_type TEXT;
    v_buyer_company_id UUID;
    v_pickup_address TEXT;
    
    v_offer RECORD;
    v_verification_code VARCHAR(6);
    v_fulfillment_id UUID;
    v_count INTEGER := 0;
BEGIN
    -- 1. Fetch RFQ details
    SELECT buyer_id, pickup_area INTO v_buyer_id, v_pickup_address
    FROM public.rfqs
    WHERE id = p_rfq_id AND status = 'open' AND is_group_collection = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Group RFQ not found or not open';
    END IF;

    -- 2. Fetch buyer details
    SELECT agent_account_type, company_id INTO v_buyer_account_type, v_buyer_company_id
    FROM public.profiles
    WHERE id = v_buyer_id;

    -- 3. Update RFQ status
    UPDATE public.rfqs SET status = 'fulfilled' WHERE id = p_rfq_id;

    -- 4. Reject any pending offers (if any)
    UPDATE public.rfq_offers SET status = 'rejected' WHERE rfq_id = p_rfq_id AND status = 'pending';

    -- 5. Loop through all accepted offers and generate fulfillment orders
    FOR v_offer IN 
        SELECT id, seller_id 
        FROM public.rfq_offers 
        WHERE rfq_id = p_rfq_id AND status = 'accepted'
    LOOP
        -- Generate random 6 digit code
        v_verification_code := lpad(floor(random() * 1000000)::text, 6, '0');

        -- Create Fulfillment Order
        INSERT INTO public.fulfillment_orders (
            rfq_id, proposal_id, buyer_id, seller_id, 
            organization_id, assigned_agent_id,
            delivery_method, pickup_address, verification_code,
            status
        ) VALUES (
            p_rfq_id, v_offer.id, v_buyer_id, v_offer.seller_id,
            CASE WHEN v_buyer_account_type = 'company_admin' THEN v_buyer_id ELSE NULL END,
            CASE WHEN v_buyer_account_type = 'independent' THEN v_buyer_id ELSE NULL END,
            'agent_pickup', v_pickup_address, v_verification_code,
            CASE WHEN v_buyer_account_type = 'independent' THEN 'agent_assigned'::public.fulfillment_status_enum ELSE 'pending_coordination'::public.fulfillment_status_enum END
        ) RETURNING id INTO v_fulfillment_id;

        -- Insert initial history
        INSERT INTO public.fulfillment_status_history (fulfillment_id, status, actor_id, notes)
        VALUES (
            v_fulfillment_id, 
            CASE WHEN v_buyer_account_type = 'independent' THEN 'agent_assigned'::public.fulfillment_status_enum ELSE 'pending_coordination'::public.fulfillment_status_enum END, 
            v_buyer_id, 
            'Fulfillment order created from Group Collection pool.'
        );

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
