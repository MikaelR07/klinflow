-- Migration: 20260521_rfqs_and_offers.sql
-- Description: Creates the rfqs and rfq_offers tables with RLS policies, and an rfq-images storage bucket.

-- Create RFQs table
CREATE TABLE IF NOT EXISTS public.rfqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    buyer_type TEXT CHECK (buyer_type IN ('agent', 'company', 'fleet')),
    category TEXT NOT NULL,
    material_grade TEXT NOT NULL,
    requested_weight NUMERIC NOT NULL,
    weight_unit TEXT DEFAULT 'kg',
    target_price NUMERIC,
    pickup_area TEXT NOT NULL,
    images TEXT[] DEFAULT '{}',
    notes TEXT,
    deadline TIMESTAMPTZ,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'fulfilled', 'closed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create RFQ Offers table
CREATE TABLE IF NOT EXISTS public.rfq_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    offered_weight NUMERIC NOT NULL,
    offered_price NUMERIC NOT NULL,
    images TEXT[] DEFAULT '{}',
    notes TEXT,
    earliest_shipping_date TIMESTAMPTZ,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable moddatetime extension
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

-- Create Triggers to auto-update updated_at column
CREATE TRIGGER handle_updated_at_rfqs
    BEFORE UPDATE ON public.rfqs
    FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);

CREATE TRIGGER handle_updated_at_rfq_offers
    BEFORE UPDATE ON public.rfq_offers
    FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);

-- Enable Row Level Security
ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_offers ENABLE ROW LEVEL SECURITY;

-- ── RLS Policies for RFQs ──

-- Anyone can view open RFQs
CREATE POLICY "Anyone can view open RFQs" 
ON public.rfqs FOR SELECT 
USING (status = 'open' OR auth.uid() = buyer_id);

-- Buyer can create their own RFQ
CREATE POLICY "Buyers can insert own RFQs" 
ON public.rfqs FOR INSERT 
WITH CHECK (auth.uid() = buyer_id);

-- Buyer can update their own RFQ
CREATE POLICY "Buyers can update own RFQs" 
ON public.rfqs FOR UPDATE 
USING (auth.uid() = buyer_id);

-- Buyer can delete their own RFQ
CREATE POLICY "Buyers can delete own RFQs" 
ON public.rfqs FOR DELETE 
USING (auth.uid() = buyer_id);


-- ── RLS Policies for RFQ Offers ──

-- Seller can view their own offers, Buyer can view offers sent to them
CREATE POLICY "Users can view relevant offers" 
ON public.rfq_offers FOR SELECT 
USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

-- Seller can insert an offer
CREATE POLICY "Sellers can insert offers" 
ON public.rfq_offers FOR INSERT 
WITH CHECK (auth.uid() = seller_id);

-- Seller can update their offer, Buyer can update offer status
CREATE POLICY "Users can update relevant offers" 
ON public.rfq_offers FOR UPDATE 
USING (auth.uid() = seller_id OR auth.uid() = buyer_id);


-- ── Storage Bucket for RFQ Images ──

INSERT INTO storage.buckets (id, name, public) 
VALUES ('rfq-images', 'rfq-images', true) 
ON CONFLICT (id) DO NOTHING;

-- RLS for Storage Bucket Objects
CREATE POLICY "Public Access to RFQ Images" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'rfq-images' );

CREATE POLICY "Authenticated users can upload RFQ images" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'rfq-images' AND auth.role() = 'authenticated' );

CREATE POLICY "Users can update own RFQ images" 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'rfq-images' AND auth.uid() = owner );

CREATE POLICY "Users can delete own RFQ images" 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'rfq-images' AND auth.uid() = owner );
