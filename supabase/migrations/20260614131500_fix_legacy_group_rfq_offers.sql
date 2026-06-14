-- Migration: 20260614131500_fix_legacy_group_rfq_offers.sql

-- Automatically update any legacy "pending" offers on Group Collection RFQs to "accepted".
-- This ensures that any pledges made before the auto-pool feature was fully implemented are safely merged into the pool.

UPDATE public.rfq_offers 
SET status = 'accepted'
WHERE status = 'pending' 
AND rfq_id IN (
    SELECT id FROM public.rfqs WHERE is_group_collection = true
);
