-- ── 1. UNIFIED PRICING SCHEMA ──────────────────────────────────────────
-- We add the price directly to the category so there is zero guesswork.
ALTER TABLE public.waste_categories 
ADD COLUMN IF NOT EXISTS price_per_kg NUMERIC DEFAULT 0;

-- ── 2. SEED INITIAL MARKET RATES ──────────────────────────────────────
-- Update your categories with the specific rates from your Admin.
UPDATE public.waste_categories SET price_per_kg = 150 WHERE slug = 'ewaste';
UPDATE public.waste_categories SET price_per_kg = 25  WHERE slug = 'recyclable';
UPDATE public.waste_categories SET price_per_kg = 60  WHERE slug = 'metal';
UPDATE public.waste_categories SET price_per_kg = 10  WHERE slug = 'organic';

-- ── 3. UNIFIED REWARD TRIGGER ─────────────────────────────────────────
-- This version uses a direct ID lookup. No fuzzy name matching needed!
CREATE OR REPLACE FUNCTION public.credit_user_rewards()
RETURNS TRIGGER AS $$
DECLARE
  v_material_rate   NUMERIC;
  v_earned_cashback NUMERIC;
  v_earned_points   INTEGER;
  v_agent_pay       NUMERIC;
  v_weight          NUMERIC;
  v_points_per_kg   INTEGER := 5;
BEGIN
  -- Fire only on completion
  IF (NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed')) THEN

    -- Prevent double-crediting
    IF EXISTS (SELECT 1 FROM public.rewards_ledger WHERE booking_id = NEW.id) THEN
      RETURN NEW;
    END IF;

    v_weight := COALESCE(NEW.actual_weight_kg, NEW.weight_kg, NEW.bags, 1);

    -- DIRECT LOOKUP: Get price using the Category ID stored in waste_type
    SELECT price_per_kg INTO v_material_rate 
    FROM public.waste_categories 
    WHERE id::text = NEW.waste_type::text
    LIMIT 1;

    -- Fallback safety
    IF v_material_rate IS NULL THEN v_material_rate := 5.00; END IF;

    -- MATH: 85% Founder Split for Agent
    v_earned_cashback := v_weight * v_material_rate;
    v_earned_points   := floor(v_weight * v_points_per_kg);
    v_agent_pay       := COALESCE(NEW.fee, 0) * 0.85;

    -- Update Client Profile
    UPDATE public.profiles SET 
      wallet_balance = COALESCE(wallet_balance, 0) - COALESCE(NEW.fee, 0) + v_earned_cashback,
      reward_points  = COALESCE(reward_points, 0) + v_earned_points
    WHERE id = NEW.user_id;

    -- Update Agent Profile (85% Split)
    IF NEW.agent_id IS NOT NULL THEN
      UPDATE public.profiles SET wallet_balance = COALESCE(wallet_balance, 0) + v_agent_pay
      WHERE id = NEW.agent_id;
    END IF;

    -- Log Activity
    INSERT INTO public.rewards_ledger (profile_id, booking_id, amount_cashback, amount_points, transaction_type, description)
    VALUES (NEW.user_id, NEW.id, v_earned_cashback - COALESCE(NEW.fee, 0), v_earned_points, 'earning', 'CleanFlow Unified Payout');

  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
