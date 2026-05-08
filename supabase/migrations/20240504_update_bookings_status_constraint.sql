-- Migration: 20240504_update_bookings_status_constraint.sql
-- Description: Updates the bookings_status_check constraint to allow 'counter_offer_pending' and 'in-progress'.

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check 
CHECK (status IN (
    'pending', 
    'scheduled', 
    'confirmed', 
    'in_progress', 
    'in-progress', 
    'completed', 
    'cancelled', 
    'picked_up', 
    'arrived', 
    'counter_offer_pending'
));
