-- ── AGENT LOGISTICS UPGRADE ──────────────────────────────────────────
-- Adds tracking for Agents who are currently heading to the Hub.

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_en_route BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS held_balance DECIMAL(12,2) DEFAULT 0.00;

ALTER TABLE public.assets 
ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT FALSE;

-- ── RPC: SPLIT PAYOUT (50/50) ──────────────────────────
CREATE OR REPLACE FUNCTION public.complete_booking_split_payout(
    p_booking_uuid UUID,
    p_agent_uuid UUID,
    p_weight_kg DECIMAL,
    p_immediate_payout DECIMAL,
    p_held_payout DECIMAL
) RETURNS TEXT AS $$
BEGIN
    -- 1. Update Booking Status
    UPDATE bookings 
    SET status = 'completed', weight_kg = p_weight_kg 
    WHERE id = p_booking_uuid;

    -- 2. Pay Agent Immediate (50%)
    UPDATE profiles 
    SET wallet_balance = wallet_balance + p_immediate_payout,
        held_balance = held_balance + p_held_payout
    WHERE id = p_agent_uuid;

    RETURN 'success';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── RPC: HUB DEPOSIT (RELEASE HELD FUNDS) ──────────────────────────
CREATE OR REPLACE FUNCTION public.hub_deposit_cargo(
    p_agent_uuid UUID
) RETURNS DECIMAL AS $$
DECLARE
    v_released_amount DECIMAL;
BEGIN
    -- 1. Get the current held balance
    SELECT held_balance INTO v_released_amount FROM profiles WHERE id = p_agent_uuid;

    -- 2. Move held to wallet and reset en_route
    UPDATE profiles 
    SET wallet_balance = wallet_balance + held_balance,
        held_balance = 0,
        is_en_route = FALSE
    WHERE id = p_agent_uuid;

    -- 3. Mark all assets as deposited
    UPDATE assets 
    SET status = 'deposited' 
    WHERE verifier_id = p_agent_uuid AND status = 'verified';

    RETURN v_released_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Optional: Index for faster radar performance
CREATE INDEX IF NOT EXISTS idx_profiles_en_route ON public.profiles (is_en_route) WHERE is_en_route = TRUE;

-- ── UPGRADE COMPLETE ──
