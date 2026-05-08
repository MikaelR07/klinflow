-- ══════════════════════════════════════════════════════════════════════════════
-- MIGRATION: Kill ALL legacy reward triggers on bookings
-- 
-- ROOT CAUSE: Multiple triggers fire when bookings.status → 'completed',
-- each one independently updating profiles.reward_points with DIFFERENT math.
-- The client_releases_funds RPC calculates the correct GFP (weight × 5),
-- but these triggers race against it and corrupt the final value.
--
-- SOLUTION: Drop every trigger on public.bookings that touches rewards/payouts.
-- The client_releases_funds RPC becomes the SOLE source of truth.
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. Kill the reward trigger (credit_user_rewards)
--    This was calculating: weight × 5 but falling back to bags column
--    causing wrong GFP (e.g., 30 instead of 100)
DROP TRIGGER IF EXISTS on_booking_completed ON public.bookings;

-- 2. Kill the escrow/service fee trigger (handle_service_payout)
--    This was also awarding bonus points via add_reward_points()
DROP TRIGGER IF EXISTS on_service_paid ON public.bookings;

-- 3. Also drop the names we tried before (in case they exist under aliases)
DROP TRIGGER IF EXISTS on_booking_completed_rewards ON public.bookings;
DROP TRIGGER IF EXISTS tr_credit_user_rewards ON public.bookings;

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. Rebuild client_releases_funds as the ONLY payout function
-- ══════════════════════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.client_releases_funds(UUID, UUID, INTEGER);

CREATE FUNCTION public.client_releases_funds(
    p_booking_uuid UUID,
    p_client_uuid  UUID,
    p_client_gfp   INTEGER DEFAULT 0
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

    IF v_agent_uuid IS NULL THEN
        RETURN 'error: booking not found';
    END IF;

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
        v_cashback_pct := 10.00;
    END IF;

    -- 4. Calculate splits
    v_total_fee       := COALESCE(v_total_fee, 0);
    v_platform_cut    := v_total_fee * 0.10;
    v_agent_payout    := v_total_fee * 0.90;
    v_client_cashback := v_total_fee * (v_cashback_pct / 100.0);

    -- 5. Mark booking completed & paid, store cashback
    --    NOTE: No triggers will fire now because we dropped them above!
    UPDATE public.bookings 
    SET 
        status          = 'completed',
        payment_status  = 'paid',
        client_cashback = v_client_cashback,
        updated_at      = NOW()
    WHERE id = p_booking_uuid;

    -- 6. Pay the Agent / Company
    IF v_account_type = 'fleet_driver' AND v_company_id IS NOT NULL THEN
        UPDATE public.profiles SET wallet_balance = COALESCE(wallet_balance, 0) + v_agent_payout WHERE id = v_company_id;
    ELSE
        UPDATE public.profiles SET wallet_balance = COALESCE(wallet_balance, 0) + v_agent_payout WHERE id = v_agent_uuid;
    END IF;

    -- 7. Reward the Client (Cashback + GFP)
    --    p_client_gfp is calculated by the app as: actual_weight_kg × 5
    --    This is THE ONLY place reward_points gets updated. Period.
    UPDATE public.profiles
    SET wallet_balance = COALESCE(wallet_balance, 0) + v_client_cashback,
        reward_points  = COALESCE(reward_points, 0)  + p_client_gfp
    WHERE id = p_client_uuid;

    -- 8. Log the transaction
    INSERT INTO public.rewards_ledger 
        (profile_id, booking_id, transaction_type, amount_cashback, amount_points, description)
    VALUES 
        (p_client_uuid, p_booking_uuid, 'earning', v_client_cashback, p_client_gfp,
         'Recycling reward: ' || COALESCE(v_weight_kg, 0) || 'kg × 5 = ' || p_client_gfp || ' GFP');

    -- 9. Notify the Client
    INSERT INTO public.notifications (target_user, target_role, type, title, body)
    VALUES (
        p_client_uuid, 'user', 'success', 'Payment Complete & Rewards Earned! 💸',
        'You earned KSh ' || ROUND(v_client_cashback, 2) || ' cashback plus ' || p_client_gfp || ' GFP points!'
    );

    RETURN 'success';
END;
$$;

-- 10. Grant access
GRANT EXECUTE ON FUNCTION public.client_releases_funds(UUID, UUID, INTEGER) TO authenticated;
