-- Migration: 20240429_instant_cleared_payouts.sql
-- Description: Removes all escrow/held logic. 100% of agent/admin funds are deposited immediately into their wallet as cleared funds. Hub check-ins are now purely for physical inventory tracking, not money release.

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

    -- 3. Calculate the Splits (CleanFlow takes 10%)
    v_platform_cut := p_estimated_value * 0.10;
    v_client_cashback := p_estimated_value * (v_cashback_percentage / 100.0);
    
    -- The Agent / Company gets exactly what is left over
    v_agent_total := p_estimated_value - v_platform_cut - v_client_cashback;

    -- 4. Mark booking complete
    UPDATE bookings SET status = 'completed', weight_kg = p_weight_kg WHERE id = p_booking_uuid;

    -- 5. Execute 100% INSTANT Database Updates (No Held Balances)
    IF v_account_type = 'fleet_driver' AND v_company_id IS NOT NULL THEN
        -- Instant cleared funds directly to Company Admin
        UPDATE profiles SET wallet_balance = wallet_balance + v_agent_total WHERE id = v_company_id;
    ELSE
        -- Instant cleared funds directly to Independent Agent
        UPDATE profiles SET wallet_balance = wallet_balance + v_agent_total WHERE id = p_agent_uuid;
    END IF;

    -- Pay Resident Cashback
    IF p_client_uuid IS NOT NULL THEN
        UPDATE profiles
        SET wallet_balance = wallet_balance + v_client_cashback,
            reward_points = reward_points + p_client_gfp
        WHERE id = p_client_uuid;
    END IF;

    RETURN 'success';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Adjust the Hub Deposit RPC to only handle physical asset status, not money (since money is already released)
CREATE OR REPLACE FUNCTION public.hub_deposit_cargo(
    p_agent_uuid UUID
) RETURNS DECIMAL AS $$
BEGIN
    -- 1. Reset driver's en_route status (their truck is empty now)
    UPDATE profiles 
    SET is_en_route = FALSE
    WHERE id = p_agent_uuid;

    -- 2. Mark all assets as physically deposited in the hub inventory
    UPDATE assets 
    SET status = 'deposited' 
    WHERE verifier_id = p_agent_uuid AND status = 'verified';

    -- Return 0 because no money was held/released at this step
    RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
