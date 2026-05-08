-- ============================================================
-- CleanFlow DB Cleanup Migration v2 (Corrected Business Model)
-- Phase 1: Agent Completes Pickup (Escrow)
-- Phase 2: Client Releases Funds (Final Payout & 10% Cut)
-- ============================================================

-- STEP 1: Drop conflicting triggers (prevent double-crediting)
DROP TRIGGER IF EXISTS on_booking_completed    ON public.bookings;
DROP TRIGGER IF EXISTS on_booking_paid_rewards ON public.bookings;

-- STEP 2: Drop orphaned/conflicting functions
DROP FUNCTION IF EXISTS public.complete_booking_secure(UUID, UUID, NUMERIC, NUMERIC);
DROP FUNCTION IF EXISTS public.handle_booking_completion();
DROP FUNCTION IF EXISTS public.credit_user_rewards();
DROP FUNCTION IF EXISTS public.calculate_and_award_rewards();
DROP FUNCTION IF EXISTS public.complete_booking_split_payout(UUID, UUID, NUMERIC, NUMERIC, BOOLEAN, UUID, INTEGER);

-- STEP 3: Create Phase 1 Function (Agent hands over)
CREATE OR REPLACE FUNCTION public.agent_completes_pickup(
    p_booking_uuid   UUID,
    p_agent_uuid     UUID,
    p_weight_kg      NUMERIC,
    p_total_fee      NUMERIC
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Move booking to escrow state. No money moves yet.
    UPDATE public.bookings 
    SET 
        status = 'picked_up',
        payment_status = 'authorized',
        actual_weight_kg = p_weight_kg,
        total_price = p_total_fee,
        agent_id = p_agent_uuid,
        updated_at = NOW()
    WHERE id = p_booking_uuid;

    RETURN 'success';
END;
$$;

-- STEP 4: Create Phase 2 Function (Client Finalizes & Releases Funds)
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
    -- CleanFlow takes 10% of the total logistics fee
    v_platform_cut    := v_total_fee * 0.10;
    -- Agent/Company gets 90% of the logistics fee
    v_agent_payout    := v_total_fee * 0.90;
    -- Client gets a cashback percentage of the logistics fee
    v_client_cashback := v_total_fee * (v_cashback_pct / 100.0);

    -- 5. Mark booking as completed & paid
    UPDATE public.bookings 
    SET 
        status         = 'completed',
        payment_status = 'paid',
        updated_at     = NOW()
    WHERE id = p_booking_uuid;

    -- 6. Pay the Agent / Company (100% instantly upon client release)
    IF v_account_type = 'fleet_driver' AND v_company_id IS NOT NULL THEN
        -- Fleet: 100% goes to the Company Admin
        UPDATE public.profiles SET wallet_balance = COALESCE(wallet_balance, 0) + v_agent_payout WHERE id = v_company_id;
    ELSE
        -- Independent: 100% goes to the Driver
        UPDATE public.profiles SET wallet_balance = COALESCE(wallet_balance, 0) + v_agent_payout WHERE id = v_agent_uuid;
    END IF;

    -- 7. Reward the Client (Cashback + GFP)
    UPDATE public.profiles
    SET wallet_balance = COALESCE(wallet_balance, 0) + v_client_cashback,
        reward_points  = COALESCE(reward_points, 0)  + p_client_gfp
    WHERE id = p_client_uuid;

    -- 8. Log the transaction for transparency
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

-- STEP 5: Grant execution rights
GRANT EXECUTE ON FUNCTION public.agent_completes_pickup(UUID, UUID, NUMERIC, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.client_releases_funds(UUID, UUID, INTEGER) TO authenticated;
