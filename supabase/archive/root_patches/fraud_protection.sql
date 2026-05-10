-- ── ADVANCED FRAUD PROTECTION & ESCROW LOGIC ──
-- This RPC safely completes a booking from the Agent App.
-- If the Agent inputs a weight that is suspiciously higher (>50%) than the Client's estimate,
-- the payout is held in 'pending_clearance' status until the CleanFlow Hub verifies it!

DROP FUNCTION IF EXISTS public.complete_booking_secure(UUID, UUID, NUMERIC, NUMERIC);

CREATE OR REPLACE FUNCTION public.complete_booking_secure(
    p_booking_uuid UUID,
    p_agent_uuid UUID,
    p_weight_kg NUMERIC,
    p_final_fee NUMERIC
) RETURNS text AS $$
DECLARE
    v_estimated_bags NUMERIC;
    v_new_status TEXT := 'completed';
BEGIN
    -- 1. Fetch the Client's original estimated weight (stored in 'bags')
    SELECT COALESCE(bags, 1) INTO v_estimated_bags 
    FROM public.bookings 
    WHERE id = p_booking_uuid;
    
    -- 2. FRAUD CHECK: Is the verified weight suspiciously large?
    -- Example: Client estimated 5kg, Agent verified 50kg. (50 > 5 * 1.5)
    -- If it deviates by more than 50%, we hold the funds!
    IF p_weight_kg > (v_estimated_bags * 1.5) THEN
        v_new_status := 'pending_clearance';
    END IF;

    -- 3. Update the Booking
    -- If status = 'completed', the trigger instantly credits the Client's wallet.
    -- If status = 'pending_clearance', the trigger IGNORES it, protecting CleanFlow's capital.
    UPDATE public.bookings 
    SET 
        agent_id = p_agent_uuid,
        actual_weight_kg = p_weight_kg,
        total_price = p_final_fee,
        status = v_new_status,
        updated_at = NOW()
    WHERE id = p_booking_uuid;
    
    RETURN v_new_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
