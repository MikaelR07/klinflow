-- Fix Marketplace Deletion Policy
-- This allows sellers to permanently delete their own listings.

DROP POLICY IF EXISTS "Sellers delete listings" ON public.marketplace_listings;

CREATE POLICY "Sellers delete listings" 
ON public.marketplace_listings FOR DELETE 
TO authenticated 
USING (auth.uid() = seller_id);
