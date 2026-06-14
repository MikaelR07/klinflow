-- Migration: 20260614130500_group_rfq_offers_policy.sql

-- Allow any user to view offers that belong to a Group Collection RFQ
-- This enables the client app to calculate total fulfillment progress correctly for all sellers.

CREATE POLICY "Anyone can view group collection offers"
ON public.rfq_offers FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.rfqs r 
        WHERE r.id = rfq_offers.rfq_id 
        AND r.is_group_collection = true
    )
);
