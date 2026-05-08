-- Migration: 20240502_add_counter_offers.sql
-- Description: Adds columns to support B2B marketplace renegotiations.

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS counter_offer_amount DECIMAL,
ADD COLUMN IF NOT EXISTS counter_offer_status TEXT;

-- RPC to securely submit a counter offer
CREATE OR REPLACE FUNCTION submit_counter_offer(
    p_booking_id UUID,
    p_new_amount DECIMAL
) RETURNS TEXT AS $$
BEGIN
    UPDATE public.bookings
    SET status = 'counter_offer_pending',
        counter_offer_amount = p_new_amount,
        counter_offer_status = 'pending'
    WHERE id = p_booking_id;
    RETURN 'success';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
