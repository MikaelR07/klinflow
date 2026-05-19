-- Migration: restore_pure_trade_payout.sql
-- Description: Restores the pure B2C Trade model (100% payout to client, deducted from agent) that was accidentally overwritten by the financial integrity hardening migration.

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
    v_target_wallet_uuid UUID;
    v_account_type TEXT;
    v_company_id UUID;
BEGIN
    -- 1. Self-Healing: If client uuid is missing, recover it from the booking record
    IF p_client_uuid IS NULL THEN
        SELECT user_id INTO p_client_uuid FROM public.bookings WHERE id = p_booking_uuid;
    END IF;

    -- 2. Identify the Agent / Fleet
    SELECT agent_account_type, company_id INTO v_account_type, v_company_id 
    FROM profiles WHERE id = p_agent_uuid;

    -- Route financial deduction to company wallet if they are a fleet driver
    IF v_account_type = 'fleet_driver' AND v_company_id IS NOT NULL THEN
        v_target_wallet_uuid := v_company_id;
    ELSE
        v_target_wallet_uuid := p_agent_uuid;
    END IF;

    -- 2. Execute Database Updates (ALL IMMEDIATE)
    
    -- Check if agent has enough funds before proceeding
    DECLARE
        v_current_balance DECIMAL;
    BEGIN
        SELECT COALESCE(wallet_balance, 0) INTO v_current_balance FROM profiles WHERE id = v_target_wallet_uuid FOR UPDATE;
        IF v_current_balance < p_estimated_value THEN
            RAISE EXCEPTION 'Insufficient wallet balance. Please top up your wallet to complete this pickup.';
        END IF;
    END;

    -- Mark booking complete, record the actual verified weight, and store the 10% platform fee
    UPDATE bookings 
    SET status = 'completed', 
        weight_kg = p_weight_kg,
        actual_weight_kg = p_weight_kg,
        fee = p_estimated_value * 0.10
    WHERE id = p_booking_uuid;

    -- 3. Agent BUYS material (Deduct FULL 100% from Agent/Fleet Wallet) & Award Track Points
    UPDATE profiles 
    SET wallet_balance = COALESCE(wallet_balance, 0) - p_estimated_value,
        reward_points = COALESCE(reward_points, 0) + p_client_gfp
    WHERE id = v_target_wallet_uuid;

    -- If the agent is a fleet driver, also award the points to the driver themselves
    IF v_account_type = 'fleet_driver' AND v_company_id IS NOT NULL THEN
        UPDATE profiles
        SET reward_points = COALESCE(reward_points, 0) + p_client_gfp
        WHERE id = p_agent_uuid;
    END IF;

    -- 4. Client GETS Paid 90% (Add to Client Wallet) & Award Track Points
    IF p_client_uuid IS NOT NULL THEN
        UPDATE profiles
        SET wallet_balance = COALESCE(wallet_balance, 0) + (p_estimated_value * 0.90),
            reward_points = COALESCE(reward_points, 0) + p_client_gfp
        WHERE id = p_client_uuid;

        -- Log transaction for the client so they see their 90% payment
        INSERT INTO public.rewards_ledger 
            (profile_id, booking_id, transaction_type, amount_cashback, amount_points, description)
        VALUES 
            (p_client_uuid, p_booking_uuid, 'earning', (p_estimated_value * 0.90), p_client_gfp,
             'Recyclable Sale (Net): ' || p_weight_kg || 'kg = KSh ' || (p_estimated_value * 0.90));
    END IF;

    RETURN 'success';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
