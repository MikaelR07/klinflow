-- Migration: 20240503_add_h3_to_bookings.sql
-- Description: Adds H3 geospatial indexing to bookings for high-performance proximity searches.

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS h3_index TEXT;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookings_h3 ON public.bookings(h3_index);
