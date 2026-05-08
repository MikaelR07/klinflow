-- ── REFINEMENT: Fix UUID Waste Type Lookup in Rewards Engine ──────────────────
-- This migration updates the reward trigger to correctly handle cases where 
-- bookings.waste_type is a UUID pointing to waste_categories.

CREATE OR REPLACE FUNCTION public.credit_user_rewards()
RETURNS TRIGGER AS $$
DECLARE
  v_category_name   TEXT;
  v_material_rate   NUMERIC;
  v_earned_cashback NUMERIC;
  v_earned_points   INTEGER;
  v_agent_pay       NUMERIC;
  v_weight          NUMERIC;
  v_points_per_kg   INTEGER := 5;
BEGIN
  -- Trigger Logic: Fire on 'completed' status or 'paid' payment status
  IF (NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed'))
  OR (NEW.payment_status = 'paid' AND (OLD.payment_status IS DISTINCT FROM 'paid')) THEN

    -- 1. Safety Guard: Prevent double-crediting
    IF EXISTS (
      SELECT 1 FROM public.rewards_ledger WHERE booking_id = NEW.id
    ) THEN
      RETURN NEW;
    END IF;

    -- 2. Determine the Weight
    v_weight := COALESCE(NEW.actual_weight_kg, NEW.weight_kg, NEW.bags, 1);

    -- 3. Resolve Waste Type UUID to a human-readable label
    -- Some older bookings might have slugs, newer ones have UUIDs.
    BEGIN
        SELECT label INTO v_category_name 
        FROM public.waste_categories 
        WHERE id::text = NEW.waste_type::text
        LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
        v_category_name := NEW.waste_type;
    END;

    IF v_category_name IS NULL THEN
        v_category_name := NEW.waste_type;
    END IF;

    -- 4. Lookup Material Rate from material_prices table using the resolved name
    -- We use fuzzy matching to handle "Metal" vs "Metals" or "Plastics" vs "Plastic"
    SELECT price_per_kg INTO v_material_rate 
    FROM public.material_prices 
    WHERE material_name ILIKE '%' || v_category_name || '%' 
       OR v_category_name ILIKE '%' || material_name || '%'
    LIMIT 1;

    -- Fallback rate if material not found
    IF v_material_rate IS NULL THEN
      v_material_rate := 5.00; 
    END IF;

    -- 5. Calculate Values
    v_earned_cashback := v_weight * v_material_rate;
    v_earned_points   := floor(v_weight * v_points_per_kg);
    
    -- FOUNDER'S RATE: 85% Payout to Agent (from founder_launch_split.sql)
    v_agent_pay       := COALESCE(NEW.fee, 0) * 0.85;

    -- 6. UPDATE RESIDENT (Deduct Fee, Add Cashback & Points)
    UPDATE public.profiles
    SET 
      wallet_balance = COALESCE(wallet_balance, 0) - COALESCE(NEW.fee, 0) + v_earned_cashback,
      reward_points  = COALESCE(reward_points, 0) + v_earned_points
    WHERE id = NEW.user_id;

    -- 7. UPDATE AGENT (Add 85% Commission)
    IF NEW.agent_id IS NOT NULL THEN
      UPDATE public.profiles
      SET wallet_balance = COALESCE(wallet_balance, 0) + v_agent_pay
      WHERE id = NEW.agent_id;
    END IF;

    -- 8. LOG TRANSACTION (Resident's View)
    INSERT INTO public.rewards_ledger (
      profile_id, booking_id, amount_cashback, amount_points, transaction_type, description
    )
    VALUES (
      NEW.user_id, 
      NEW.id, 
      v_earned_cashback - COALESCE(NEW.fee, 0), 
      v_earned_points, 
      'earning', 
      'Recycling ' || v_weight || 'kg of ' || v_category_name || ' (Founder Split)'
    );

    -- 9. NOTIFY RESIDENT
    INSERT INTO public.notifications (target_user, target_role, type, title, body)
    VALUES (
      NEW.user_id, 'user', 'reward', 'Mission Success! 🚛', 
      'Impact net: KSh ' || (v_earned_cashback - COALESCE(NEW.fee, 0)) || '. You earned ' || v_earned_points || ' XP.'
    );

    -- 10. NOTIFY AGENT
    IF NEW.agent_id IS NOT NULL THEN
      INSERT INTO public.notifications (target_user, target_role, type, title, body)
      VALUES (
        NEW.agent_id, 'agent', 'reward', 'Founder Commission Received! 💰', 
        'KSh ' || v_agent_pay || ' added to wallet (85% Split)'
      );
    END IF;

  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
