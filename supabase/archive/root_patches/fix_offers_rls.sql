-- Fix RLS Policies for marketplace_offers
-- Run this in your Supabase SQL Editor

-- 1. Ensure RLS is enabled
ALTER TABLE public.marketplace_offers ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own offers" ON public.marketplace_offers;
DROP POLICY IF EXISTS "Users can view their own offers (sent or received)" ON public.marketplace_offers;
DROP POLICY IF EXISTS "Agents can insert offers" ON public.marketplace_offers;
DROP POLICY IF EXISTS "Buyers and Sellers can view offers" ON public.marketplace_offers;
DROP POLICY IF EXISTS "Buyers can create offers" ON public.marketplace_offers;

-- 3. Create fresh, correct policies
-- Allow users to view offers if they are the buyer OR the seller
CREATE POLICY "Buyers and Sellers can view offers" 
ON public.marketplace_offers 
FOR SELECT 
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Allow agents/buyers to insert offers
CREATE POLICY "Buyers can create offers" 
ON public.marketplace_offers 
FOR INSERT 
WITH CHECK (auth.uid() = buyer_id);

-- Allow buyers or sellers to update offers (e.g. accepting/declining)
CREATE POLICY "Parties can update offers" 
ON public.marketplace_offers 
FOR UPDATE 
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Allow buyers to delete their pending offers
CREATE POLICY "Buyers can delete pending offers" 
ON public.marketplace_offers 
FOR DELETE 
USING (auth.uid() = buyer_id);
