-- ── 1. UPDATE SYSTEM ECONOMICS ────────────────────────────────────────
-- Set the base logistics fee to 200 KSh as discussed.
INSERT INTO public.system_config (key, label, value, description)
VALUES ('fee_pickup', 'Logistics Fee', 200, 'Base logistics fee for pickups')
ON CONFLICT (key) DO UPDATE SET value = 200, label = 'Logistics Fee';

-- ── 2. UPDATE REWARD & SPLIT LOGIC ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.credit_user_rewards()
RETURNS TRIGGER AS $$
DECLARE
  v_material_rate   NUMERIC;
  v_earned_cashback NUMERIC;
  v_earned_points   INTEGER;
  v_agent_pay       NUMERIC;
  v_weight          NUMERIC;
  v_points_per_kg   NUMERIC := 5; -- Base rate
  v_xp_multiplier   NUMERIC := 1.0;
  v_user_tier       TEXT;
BEGIN
  -- Fire only on completion
  IF (NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed')) THEN

    -- Prevent double-crediting
    IF EXISTS (SELECT 1 FROM public.rewards_ledger WHERE booking_id = NEW.id) THEN
      RETURN NEW;
    END IF;

    -- A. Get User's Tier for XP Boost
    SELECT COALESCE(subscription_tier, 'lite') INTO v_user_tier FROM public.profiles WHERE id = NEW.user_id;
    
    IF v_user_tier = 'standard' THEN v_xp_multiplier := 1.5; -- Silver
    ELSIF v_user_tier = 'premium' THEN v_xp_multiplier := 2.0; -- Gold
    ELSE v_xp_multiplier := 1.0; -- Lite/Free
    END IF;

    -- B. Lookup Price from Unified Categories
    SELECT price_per_kg INTO v_material_rate FROM public.waste_categories 
    WHERE id::text = NEW.waste_type::text LIMIT 1;
    IF v_material_rate IS NULL THEN v_material_rate := 5.00; END IF;

    v_weight := COALESCE(NEW.actual_weight_kg, NEW.weight_kg, NEW.bags, 1);

    -- C. MATH
    v_earned_cashback := v_weight * v_material_rate;
    v_earned_points   := floor(v_weight * v_points_per_kg * v_xp_multiplier);
    
    -- NEW 80/20 SPLIT: Agent gets 80% of the logistics fee (defaults to 200)
    v_agent_pay       := COALESCE(NEW.fee, 200) * 0.80; 

    -- D. PAYOUTS
    -- Subtract Fee, Add Cashback & Points
    UPDATE public.profiles SET 
      wallet_balance = COALESCE(wallet_balance, 0) - COALESCE(NEW.fee, 200) + v_earned_cashback,
      reward_points  = COALESCE(reward_points, 0) + v_earned_points
    WHERE id = NEW.user_id;

    -- Credit Agent (80% commission)
    IF NEW.agent_id IS NOT NULL THEN
      UPDATE public.profiles SET wallet_balance = COALESCE(wallet_balance, 0) + v_agent_pay
      WHERE id = NEW.agent_id;
    END IF;

    -- E. LOGGING
    INSERT INTO public.rewards_ledger (profile_id, booking_id, amount_cashback, amount_points, transaction_type, description)
    VALUES (NEW.user_id, NEW.id, v_earned_cashback - COALESCE(NEW.fee, 200), v_earned_points, 'earning', 
           'Pickup Completed (' || v_user_tier || ' Boost: ' || v_xp_multiplier || 'x)');

  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
