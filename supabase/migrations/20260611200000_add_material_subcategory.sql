-- Add subcategory columns to marketplace_listings
ALTER TABLE public.marketplace_listings
  ADD COLUMN IF NOT EXISTS material_category TEXT,
  ADD COLUMN IF NOT EXISTS material_subcategory TEXT;

-- Backfill: existing listings keep their material as category
UPDATE public.marketplace_listings
SET material_category = material
WHERE material_category IS NULL;
