-- Migration: 20240429_fix_held_balance_routing.sql
-- Description: Fixes the payout engine and hub deposit RPC to ensure fleet drivers hold their own balance until deposit, at which point it is transferred to the company wallet.

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
    v_account_type TEXT;
    v_company_id UUID;
    v_cashback_percentage DECIMAL;
    v_platform_cut DECIMAL;
    v_client_cashback DECIMAL;
    v_agent_total DECIMAL;
    v_immediate_payout DECIMAL;
    v_held_payout DECIMAL;
BEGIN
    -- 1. Identify the Agent / Fleet
    SELECT agent_account_type, company_id INTO v_account_type, v_company_id 
    FROM profiles WHERE id = p_agent_uuid;

    -- 2. Look up the Custom Configuration
    IF v_account_type = 'fleet_driver' AND v_company_id IS NOT NULL THEN
        SELECT cashback_percentage INTO v_cashback_percentage FROM agent_configurations WHERE agent_id = v_company_id;
    ELSE
        SELECT cashback_percentage INTO v_cashback_percentage FROM agent_configurations WHERE agent_id = p_agent_uuid;
    END IF;
    
    IF v_cashback_percentage IS NULL THEN
        v_cashback_percentage := 10.00;
    END IF;

    -- 3. Calculate the Dynamic Splits
    v_platform_cut := p_estimated_value * 0.10;
    v_client_cashback := p_estimated_value * (v_cashback_percentage / 100.0);
    v_agent_total := p_estimated_value - v_platform_cut - v_client_cashback;

    -- 4. Calculate Held vs Immediate
    IF p_is_manual THEN
        v_immediate_payout := 0;
        v_held_payout := v_agent_total;
    ELSE
        v_immediate_payout := v_agent_total * 0.5;
        v_held_payout := v_agent_total * 0.5;
    END IF;

    -- 5. Execute Database Updates
    UPDATE bookings SET status = 'completed', weight_kg = p_weight_kg WHERE id = p_booking_uuid;

    -- If Fleet Driver: Immediate goes to Company, Held stays on Driver (until deposited)
    IF v_account_type = 'fleet_driver' AND v_company_id IS NOT NULL THEN
        UPDATE profiles SET wallet_balance = wallet_balance + v_immediate_payout WHERE id = v_company_id;
        UPDATE profiles SET held_balance = held_balance + v_held_payout WHERE id = p_agent_uuid;
    ELSE
        -- Independent Agent
        UPDATE profiles 
        SET wallet_balance = wallet_balance + v_immediate_payout,
            held_balance = held_balance + v_held_payout
        WHERE id = p_agent_uuid;
    END IF;

    -- Pay Resident
    IF p_client_uuid IS NOT NULL THEN
        UPDATE profiles
        SET wallet_balance = wallet_balance + v_client_cashback,
            reward_points = reward_points + p_client_gfp
        WHERE id = p_client_uuid;
    END IF;

    RETURN 'success';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Rewrite the Hub Deposit RPC to correctly route the driver's held balance to their company (or themselves)
CREATE OR REPLACE FUNCTION public.hub_deposit_cargo(
    p_agent_uuid UUID
) RETURNS DECIMAL AS $$
DECLARE
    v_released_amount DECIMAL;
    v_account_type TEXT;
    v_company_id UUID;
BEGIN
    -- 1. Get the current held balance and driver type
    SELECT held_balance, agent_account_type, company_id 
    INTO v_released_amount, v_account_type, v_company_id 
    FROM profiles WHERE id = p_agent_uuid;

    -- 2. Clear driver's held balance and reset en_route
    UPDATE profiles 
    SET held_balance = 0,
        is_en_route = FALSE
    WHERE id = p_agent_uuid;

    -- 3. Route the released funds
    IF v_account_type = 'fleet_driver' AND v_company_id IS NOT NULL THEN
        -- Route to Company
        UPDATE profiles SET wallet_balance = wallet_balance + v_released_amount WHERE id = v_company_id;
    ELSE
        -- Route to Independent Agent
        UPDATE profiles SET wallet_balance = wallet_balance + v_released_amount WHERE id = p_agent_uuid;
    END IF;

    -- 4. Mark all assets as deposited
    UPDATE assets 
    SET status = 'deposited' 
    WHERE verifier_id = p_agent_uuid AND status = 'verified';

    RETURN v_released_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
