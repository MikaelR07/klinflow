-- Migration: 20240504_add_trade_payout_rpc.sql
-- Description: Adds the complete_booking_trade_payout RPC for seamless B2B marketplace settlements.

DROP FUNCTION IF EXISTS public.complete_booking_trade_payout(uuid, numeric, numeric);

CREATE OR REPLACE FUNCTION public.complete_booking_trade_payout(
    p_booking_id UUID,
    p_actual_weight DECIMAL,
    p_payout_amount DECIMAL
) RETURNS TEXT AS $$
DECLARE
    v_agent_id UUID;
    v_client_id UUID;
    v_waste_type TEXT;
BEGIN
    -- 1. Fetch involved parties and material type
    SELECT agent_id, user_id, waste_type INTO v_agent_id, v_client_id, v_waste_type
    FROM public.bookings
    WHERE id = p_booking_id;

    IF v_agent_id IS NULL OR v_client_id IS NULL THEN
        RAISE EXCEPTION 'Missing agent or client for trade settlement';
    END IF;

    -- 2. Mark booking complete and update final weight/price
    UPDATE public.bookings 
    SET status = 'completed', 
        weight_kg = p_actual_weight,
        actual_weight_kg = p_actual_weight,
        total_price = p_payout_amount
    WHERE id = p_booking_id;

    -- 3. Deduct funds from Agent
    UPDATE public.profiles 
    SET wallet_balance = COALESCE(wallet_balance, 0) - p_payout_amount
    WHERE id = v_agent_id;

    -- 4. Add funds to Client (Seller)
    UPDATE public.profiles
    SET wallet_balance = COALESCE(wallet_balance, 0) + p_payout_amount
    WHERE id = v_client_id;

    -- 5. Log the transaction for the Seller
    INSERT INTO public.rewards_ledger 
        (profile_id, booking_id, transaction_type, amount_cashback, amount_points, description)
    VALUES 
        (v_client_id, p_booking_id, 'earning', p_payout_amount, 0,
         'Marketplace Sale: ' || p_actual_weight || 'kg = KSh ' || p_payout_amount);

    -- 6. Create inventory asset for the Agent
    -- This ensures the purchased material shows up in the Agent's warehouse
    INSERT INTO public.assets 
        (booking_id, verifier_id, material_type, weight_kg, estimated_value, status, source)
    VALUES 
        (p_booking_id, v_agent_id, v_waste_type, p_actual_weight, p_payout_amount, 'verified', 'marketplace');

    RETURN 'success';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
