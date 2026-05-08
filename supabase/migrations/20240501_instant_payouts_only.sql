-- Migration: 20240501_instant_payouts_only.sql
-- Description: Removes the 'Held Balance' safety and makes all agent/company payouts 100% immediate.

CREATE OR REPLACE FUNCTION public.complete_booking_split_payout(
    p_booking_uuid UUID,
    p_agent_uuid UUID,
    p_client_uuid UUID,
    p_weight_kg DECIMAL,
    p_estimated_value DECIMAL, -- The total wholesale value of the materials
    p_client_gfp INT,
    p_is_manual BOOLEAN
) RETURNS TEXT AS $$
DECLARE
    v_target_wallet_uuid UUID;
    v_account_type TEXT;
    v_company_id UUID;
    
    v_cashback_percentage DECIMAL;
    v_platform_cut DECIMAL;
    v_client_cashback DECIMAL;
    v_agent_total DECIMAL;
BEGIN
    -- 1. Identify the Agent / Fleet
    SELECT agent_account_type, company_id INTO v_account_type, v_company_id 
    FROM profiles WHERE id = p_agent_uuid;

    -- Route to company wallet if they are a fleet driver
    IF v_account_type = 'fleet_driver' AND v_company_id IS NOT NULL THEN
        v_target_wallet_uuid := v_company_id;
    ELSE
        v_target_wallet_uuid := p_agent_uuid;
    END IF;

    -- 2. Look up the Custom Configuration
    SELECT cashback_percentage INTO v_cashback_percentage
    FROM agent_configurations
    WHERE agent_id = v_target_wallet_uuid;
    
    -- Fallback to 10% if config is missing
    IF v_cashback_percentage IS NULL THEN
        v_cashback_percentage := 10.00;
    END IF;

    -- 3. Calculate the Dynamic Splits
    v_platform_cut := p_estimated_value * 0.10; -- Platform always gets fixed 10%
    v_client_cashback := p_estimated_value * (v_cashback_percentage / 100.0);
    
    -- The Agent / Company gets whatever is left over!
    v_agent_total := p_estimated_value - v_platform_cut - v_client_cashback;

    -- 4. Execute Database Updates (ALL IMMEDIATE)
    
    -- Mark booking complete
    UPDATE bookings 
    SET status = 'completed', weight_kg = p_weight_kg 
    WHERE id = p_booking_uuid;

    -- Pay Agent / Company Wallet (100% to Wallet, 0% to Held)
    UPDATE profiles 
    SET wallet_balance = wallet_balance + v_agent_total
    WHERE id = v_target_wallet_uuid;

    -- Pay Resident Cashback & Points
    IF p_client_uuid IS NOT NULL THEN
        UPDATE profiles
        SET wallet_balance = wallet_balance + v_client_cashback,
            reward_points = reward_points + p_client_gfp
        WHERE id = p_client_uuid;
    END IF;

    RETURN 'success';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
