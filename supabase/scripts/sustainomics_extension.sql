-- ════════════════════════════════════════════════════════════════
-- CleanFlow KE — Sustainomics Extension (Rewards & Subscriptions)
-- Description: Blueprint for financial infrastructure on Supabase.
-- ════════════════════════════════════════════════════════════════

-- 1. EXTEND PROFILES
-- Run this to add financial state to your existing profiles table.
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'lite',
ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS reward_points INTEGER DEFAULT 0;

-- 2. EXTEND BOOKINGS
-- Run this to store logistics and pricing telemetry.
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS actual_weight_kg DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS distance_km DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS logistics_fee DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS total_price DECIMAL(10,2);

-- 3. REWARDS LEDGER TABLE
-- Audit trail for every single point and shilling.
CREATE TABLE IF NOT EXISTS public.rewards_ledger (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id        UUID NOT NULL REFERENCES auth.users(id),
  booking_id        UUID REFERENCES public.bookings(id),
  amount_cashback   DECIMAL(10,2) DEFAULT 0.00,
  amount_points     INTEGER DEFAULT 0,
  transaction_type  TEXT CHECK (transaction_type IN ('earning', 'withdrawal', 'subscription_payment')),
  description       TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RLS POLICIES FOR LEDGER
ALTER TABLE public.rewards_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ledger"
  ON public.rewards_ledger FOR SELECT
  USING (auth.uid() = profile_id);

-- 5. AUTOMATED REWARD TRIGGER
-- Automatically credits user wallet when an agent marks a pickup as 'completed'.
CREATE OR REPLACE FUNCTION credit_user_rewards()
RETURNS TRIGGER AS $$
DECLARE
  v_cashback_per_kg DECIMAL := 5.00;  -- Average cashback per KG
  v_points_per_kg INTEGER := 5;      -- Average points per KG
  v_earned_cashback DECIMAL;
  v_earned_points INTEGER;
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    v_earned_cashback := NEW.actual_weight_kg * v_cashback_per_kg;
    v_earned_points := NEW.actual_weight_kg * v_points_per_kg;

    -- Update Profile
    UPDATE public.profiles
    SET 
      wallet_balance = wallet_balance + v_earned_cashback,
      reward_points = reward_points + v_earned_points
    WHERE id = NEW.user_id;

    -- Log Transaction
    INSERT INTO public.rewards_ledger (profile_id, booking_id, amount_cashback, amount_points, transaction_type, description)
    VALUES (NEW.user_id, NEW.id, v_earned_cashback, v_earned_points, 'earning', 'Recycling reward for ' || NEW.actual_weight_kg || 'kg pickup');

    -- Send Real-time Notification
    INSERT INTO public.notifications (target_user, target_role, type, title, body)
    VALUES (
      NEW.user_id, 
      'user', 
      'reward', 
      'Rewards Earned! 🌿', 
      'You just earned KSh ' || v_earned_cashback || ' and ' || v_earned_points || ' XP for your environmental impact.'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_booking_completed ON public.bookings;
CREATE TRIGGER on_booking_completed
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION credit_user_rewards();
