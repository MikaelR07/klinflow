-- Drop the existing function first
DROP FUNCTION IF EXISTS public.complete_booking_split_payout(UUID, UUID, UUID, DECIMAL, DECIMAL, INT, BOOLEAN);

-- Recreate with correct trade logic
CREATE OR REPLACE FUNCTION public.complete_booking_split_payout(
    p_booking_uuid UUID,
    p_agent_uuid UUID,
    p_client_uuid UUID,
    p_weight_kg DECIMAL,
    p_estimated_value DECIMAL, -- This is the exact payout value (e.g. 150) the client should get
    p_client_gfp INT,
    p_is_manual BOOLEAN
) RETURNS TEXT AS $$
DECLARE
    v_target_wallet_uuid UUID;
    v_account_type TEXT;
    v_company_id UUID;
    
    v_platform_cut DECIMAL;
    v_agent_deduction DECIMAL;
BEGIN
    -- 1. Identify the Agent / Fleet
    SELECT agent_account_type, company_id INTO v_account_type, v_company_id 
    FROM profiles WHERE id = p_agent_uuid;

    IF v_account_type = 'fleet_driver' AND v_company_id IS NOT NULL THEN
        v_target_wallet_uuid := v_company_id;
    ELSE
        v_target_wallet_uuid := p_agent_uuid;
    END IF;

    -- 2. Calculate the Trade Splits
    -- Since this is an agent BUYING recyclables from a client:
    v_platform_cut := p_estimated_value * 0.10; -- Platform takes 10% fee from the agent
    v_agent_deduction := p_estimated_value + v_platform_cut; -- Agent pays the client AND the platform

    -- 3. Execute Database Updates (ALL IMMEDIATE)
    
    -- Mark booking complete and record the exact client payout in client_cashback
    UPDATE bookings 
    SET status = 'completed', 
        actual_weight_kg = p_weight_kg, 
        client_cashback = p_estimated_value,
        payment_status = 'paid'
    WHERE id = p_booking_uuid;

    -- Deduct from Agent / Company Wallet (They pay the client + platform fee)
    UPDATE profiles 
    SET wallet_balance = wallet_balance - v_agent_deduction
    WHERE id = v_target_wallet_uuid;

    -- Pay Resident directly into their Klinflow digital wallet
    IF p_client_uuid IS NOT NULL THEN
        UPDATE profiles
        SET wallet_balance = wallet_balance + p_estimated_value,
            reward_points = reward_points + p_client_gfp
        WHERE id = p_client_uuid;
    END IF;

    RETURN 'success';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
