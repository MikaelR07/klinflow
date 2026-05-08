-- Migration: 20240501_store_cashback_on_booking.sql
-- Description: Adds a client_cashback column to bookings so the UI can
-- accurately display how much the client earned back per transaction.

-- 1. Add the column (safe - only if not exists)
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS client_cashback NUMERIC(10, 2) DEFAULT 0;

-- 2. Update client_releases_funds to write the cashback back to the booking row
CREATE OR REPLACE FUNCTION public.client_releases_funds(
    p_booking_uuid   UUID,
    p_client_uuid    UUID,
    p_client_gfp     INTEGER DEFAULT 0
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_agent_uuid        UUID;
    v_total_fee         NUMERIC;
    v_weight_kg         NUMERIC;
    v_account_type      TEXT;
    v_company_id        UUID;
    v_cashback_pct      NUMERIC;
    
    v_platform_cut      NUMERIC;
    v_agent_payout      NUMERIC;
    v_client_cashback   NUMERIC;
BEGIN
    -- 1. Fetch Booking Details
    SELECT agent_id, total_price, actual_weight_kg 
    INTO v_agent_uuid, v_total_fee, v_weight_kg
    FROM public.bookings 
    WHERE id = p_booking_uuid;

    -- 2. Identify the Agent / Fleet type
    SELECT agent_account_type, company_id 
    INTO v_account_type, v_company_id
    FROM public.profiles 
    WHERE id = v_agent_uuid;

    -- 3. Lookup custom cashback % from agent_configurations
    IF v_account_type = 'fleet_driver' AND v_company_id IS NOT NULL THEN
        SELECT cashback_percentage INTO v_cashback_pct FROM public.agent_configurations WHERE agent_id = v_company_id;
    ELSE
        SELECT cashback_percentage INTO v_cashback_pct FROM public.agent_configurations WHERE agent_id = v_agent_uuid;
    END IF;

    IF v_cashback_pct IS NULL THEN
        v_cashback_pct := 10.00; -- Default 10% cashback to client
    END IF;

    -- 4. Calculate The Exact Splits
    v_platform_cut    := v_total_fee * 0.10;
    v_agent_payout    := v_total_fee * 0.90;
    v_client_cashback := v_total_fee * (v_cashback_pct / 100.0);

    -- 5. Mark booking as completed & paid, AND store cashback for history
    UPDATE public.bookings 
    SET 
        status          = 'completed',
        payment_status  = 'paid',
        client_cashback = v_client_cashback,   -- Store so UI can show "You Earned KSh X"
        updated_at      = NOW()
    WHERE id = p_booking_uuid;

    -- 6. Pay the Agent / Company (100% instantly upon client release)
    IF v_account_type = 'fleet_driver' AND v_company_id IS NOT NULL THEN
        UPDATE public.profiles SET wallet_balance = COALESCE(wallet_balance, 0) + v_agent_payout WHERE id = v_company_id;
    ELSE
        UPDATE public.profiles SET wallet_balance = COALESCE(wallet_balance, 0) + v_agent_payout WHERE id = v_agent_uuid;
    END IF;

    -- 7. Reward the Client (Cashback + GFP)
    UPDATE public.profiles
    SET wallet_balance = COALESCE(wallet_balance, 0) + v_client_cashback,
        reward_points  = COALESCE(reward_points, 0)  + p_client_gfp
    WHERE id = p_client_uuid;

    -- 8. Log the transaction
    INSERT INTO public.rewards_ledger 
        (profile_id, booking_id, transaction_type, amount_cashback, amount_points, description)
    VALUES 
        (p_client_uuid, p_booking_uuid, 'earning', v_client_cashback, p_client_gfp,
         'Cashback for Pickup #' || p_booking_uuid);

    -- 9. Notify the Client
    INSERT INTO public.notifications (target_user, target_role, type, title, body)
    VALUES (
        p_client_uuid, 'user', 'success', 'Payment Complete & Rewards Earned! 💸',
        'You paid KSh ' || ROUND(v_total_fee) || ' and earned KSh ' || ROUND(v_client_cashback, 2) || ' cashback plus ' || p_client_gfp || ' GFP points!'
    );

    RETURN 'success';
END;
$$;

GRANT EXECUTE ON FUNCTION public.client_releases_funds(UUID, UUID, INTEGER) TO authenticated;
