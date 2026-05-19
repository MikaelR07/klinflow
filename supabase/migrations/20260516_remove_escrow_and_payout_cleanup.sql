-- Migration: 20260516_remove_escrow_and_payout_cleanup.sql
-- Description: Removes redundant escrow logic and process_booking_payout RPC. 
-- Also CLEANS UP legacy triggers that were causing double-payouts and duplicate notifications.

-- 1. CRITICAL CLEANUP: Drop legacy triggers that interfere with modern RPC logic
DROP TRIGGER IF EXISTS on_booking_completed    ON public.bookings;
DROP TRIGGER IF EXISTS on_booking_paid_rewards ON public.bookings;
DROP FUNCTION IF EXISTS public.credit_user_rewards();
DROP FUNCTION IF EXISTS public.handle_booking_completion();

-- 2. Remove the redundant process_booking_payout function
DROP FUNCTION IF EXISTS public.process_booking_payout(uuid, numeric);

-- 3. Update complete_booking_split_payout to be 100% immediate & handle notifications
CREATE OR REPLACE FUNCTION public.complete_booking_split_payout(
    p_booking_uuid UUID,
    p_agent_uuid UUID,
    p_client_uuid UUID,
    p_weight_kg DECIMAL,
    p_estimated_value DECIMAL,
    p_client_gfp INT,
    p_is_manual BOOLEAN 
) RETURNS TEXT AS $$
DECLARE
    v_actual_agent_id UUID;
    v_target_wallet_uuid UUID;
    v_account_type TEXT;
    v_company_id UUID;
    v_booking_status TEXT;
    v_assigned_agent_id UUID;
    
    v_cashback_percentage DECIMAL;
    v_platform_cut DECIMAL;
    v_client_cashback DECIMAL;
    v_agent_total DECIMAL;
BEGIN
    v_actual_agent_id := auth.uid();
    IF v_actual_agent_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Enforce that the caller cannot spoof p_agent_uuid
    IF p_agent_uuid IS DISTINCT FROM v_actual_agent_id THEN
        RAISE EXCEPTION 'Unauthorized: p_agent_uuid mismatch';
    END IF;

    -- Lock booking row and get ownership
    SELECT agent_id, status INTO v_assigned_agent_id, v_booking_status
    FROM public.bookings
    WHERE id = p_booking_uuid
    FOR UPDATE;

    IF v_booking_status = 'completed' THEN
        RAISE EXCEPTION 'Idempotency: Booking already completed';
    END IF;

    IF v_assigned_agent_id IS DISTINCT FROM v_actual_agent_id THEN
        RAISE EXCEPTION 'Unauthorized: Caller is not the assigned agent for this booking';
    END IF;

    -- 1. Identify the Agent / Fleet
    SELECT agent_account_type, company_id INTO v_account_type, v_company_id 
    FROM profiles WHERE id = p_agent_uuid;

    IF v_account_type = 'fleet_driver' AND v_company_id IS NOT NULL THEN
        v_target_wallet_uuid := v_company_id;
    ELSE
        v_target_wallet_uuid := p_agent_uuid;
    END IF;

    -- 2. Look up the Custom Configuration
    SELECT cashback_percentage INTO v_cashback_percentage
    FROM agent_configurations
    WHERE agent_id = v_target_wallet_uuid;
    
    IF v_cashback_percentage IS NULL THEN
        v_cashback_percentage := 10.00;
    END IF;

    -- 3. Calculate the Dynamic Splits (Resident-First Buy-Back Model)
    -- Total Value: p_estimated_value (e.g., 855)
    -- Platform Cut: 10% (e.g., 85.5)
    -- Resident Payout: 90% (e.g., 769.5) -> The material value paid to the seller
    -- Agent Earning: Fixed or remainder (In this model, the agent is often paid a flat fee or by fleet)
    
    v_platform_cut := p_estimated_value * 0.10;
    v_client_cashback := p_estimated_value * 0.90; -- Bulk payout to resident
    v_agent_total := 0; -- In buy-back mode, agent earnings are handled separately or via fleet salary

    -- 4. 100% IMMEDIATE PAYOUT
    UPDATE bookings 
    SET status = 'completed', weight_kg = p_weight_kg 
    WHERE id = p_booking_uuid;

    -- 5. Pay Resident (The Seller)
    IF p_client_uuid IS NOT NULL THEN
        UPDATE profiles
        SET wallet_balance = wallet_balance + v_client_cashback,
            reward_points = reward_points + p_client_gfp
        WHERE id = p_client_uuid;
        
        INSERT INTO public.wallet_transactions (profile_id, amount, transaction_type, reference_id, metadata)
        VALUES (p_client_uuid, v_client_cashback, 'payout', p_booking_uuid, jsonb_build_object('role', 'resident', 'type', 'material_buyback'));

        -- 6. NOTIFY RESIDENT (Server-side)
        INSERT INTO public.notifications (target_user, target_role, type, title, body)
        VALUES (
            p_client_uuid, 'user', 'success', 'Payment Received! 💰',
            'You just received KSh ' || ROUND(v_client_cashback, 2) || ' for your recyclables. Your contribution matters!'
        );
    END IF;

    -- 7. Agent Logic (If they get a small incentive or are independent)
    -- For now, we focus on the Resident Payout issue.
    -- If we wanted to give the agent a cut, we would subtract it from the platform_cut.

    RETURN 'success';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

