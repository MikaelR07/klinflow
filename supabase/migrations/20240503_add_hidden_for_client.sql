-- Migration: Add hidden_for_client to bookings for soft-delete history clearing
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS hidden_for_client BOOLEAN DEFAULT FALSE;

-- Update RLS policies to ensure users can update this column
-- (Assuming existing policies allow update on own bookings)
