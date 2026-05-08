-- Migration: 20240503_add_booking_type.sql
-- Description: Adds booking_type column to allow users to specify if they want any agent or staff only.

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_type TEXT DEFAULT 'any';
