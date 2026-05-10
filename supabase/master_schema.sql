-- ═══════════════════════════════════════════════════════════════
-- CleanFlow KE — Monolithic Master Supabase Schema V2
-- INSTRUCTIONS: Run this entire file in: Supabase Dashboard → SQL Editor
-- WARNING: This will drop existing tables to apply the fresh architecture.
-- ═══════════════════════════════════════════════════════════════

-- ── 0. Enable UUID extension & Clean Slate ─────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS public.hygenex_messages CASCADE;
DROP TABLE IF EXISTS public.iot_devices CASCADE;
DROP TABLE IF EXISTS public.marketplace_orders CASCADE;
DROP TABLE IF EXISTS public.marketplace_listings CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.app_reviews CASCADE;
DROP TABLE IF EXISTS public.system_config CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ════════════════════════════════════════════════════════════════
-- 1. PROFILES TABLE (Supabase Auth Extension)
-- ════════════════════════════════════════════════════════════════
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL UNIQUE,
  role        TEXT NOT NULL CHECK (role IN ('user', 'agent', 'admin', 'business')),
  avatar      TEXT DEFAULT '👤',
  location    JSONB DEFAULT '{"estate":"Nairobi","latitude":null,"longitude":null}'::jsonb,
  
  -- Agent Specific
  id_number   TEXT,                   
  vehicle     TEXT,                   
  
  -- User Metrics
  wallet_balance NUMERIC(10,2) DEFAULT 0.00,
  reward_points  INTEGER DEFAULT 0,
  rating         NUMERIC(3,2) DEFAULT 5.00,
  subscription_tier TEXT DEFAULT 'lite' CHECK (subscription_tier IN ('lite', 'standard', 'premium')),
  
  -- B2B Verification
  is_verified    BOOLEAN DEFAULT false,
  business_type  TEXT, -- 'weaver', 'recycler', 'manufacturer'
  business_name  TEXT, 
  specializations TEXT[] DEFAULT '{}', 
  nema_license   TEXT,
  is_online      BOOLEAN DEFAULT false,

  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── SECURITY DEFINER: Role Checker (Recursion-Proof) ──────────
-- This function bypasses RLS to check roles, preventing infinite loops.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles access" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service inserts profiles" ON public.profiles FOR INSERT WITH CHECK (true); 

-- helper: Run this manually if your Admin account is missing a profile!
-- INSERT INTO public.profiles (id, name, phone, role) VALUES ('YOUR_AUTH_ID', 'Admin', '000', 'admin');

-- ════════════════════════════════════════════════════════════════
-- 2. SYSTEM_CONFIG TABLE (Global State)
-- ════════════════════════════════════════════════════════════════
CREATE TABLE public.system_config (
  id              TEXT PRIMARY KEY DEFAULT 'global_settings',
  whatsapp_number TEXT NOT NULL DEFAULT '+254113787588',
  support_number  TEXT NOT NULL DEFAULT '+254113787588',
  min_pickup_fee  NUMERIC(10,2) DEFAULT 100.00,
  kg_price        NUMERIC(10,2) DEFAULT 20.00,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default row immediately
INSERT INTO public.system_config (id) VALUES ('global_settings');

ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views config" ON public.system_config FOR SELECT USING (true);
CREATE POLICY "Admins update config" ON public.system_config FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ════════════════════════════════════════════════════════════════
-- 3. APP_REVIEWS TABLE (Admin Feedback Inbox)
-- ════════════════════════════════════════════════════════════════
CREATE TABLE public.app_reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name        TEXT,
  phone       TEXT,
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  category    TEXT NOT NULL,
  feedback    TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.app_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert reviews" ON public.app_reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins view reviews" ON public.app_reviews FOR SELECT USING (
  public.get_my_role() = 'admin'
);
CREATE POLICY "Admins delete reviews" ON public.app_reviews FOR DELETE USING (
  public.get_my_role() = 'admin'
);

-- ════════════════════════════════════════════════════════════════
-- 4. NOTIFICATIONS TABLE (Cross-App Realtime Pings)
-- ════════════════════════════════════════════════════════════════
CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  target_role TEXT CHECK (target_role IN ('user', 'agent', 'admin', 'all')),
  target_user UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- Optional direct ping
  type        TEXT DEFAULT 'info' CHECK (type IN ('success', 'warning', 'reward', 'info')),
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
-- User sees notifications matching their ID or global/role-wide alerts
CREATE POLICY "Users view relevant notifications" ON public.notifications FOR SELECT USING (
  target_user = auth.uid() OR 
  target_role = public.get_my_role() OR
  target_role = 'all'
);
CREATE POLICY "Users mark read" ON public.notifications FOR UPDATE USING (
  target_user = auth.uid() OR target_role = public.get_my_role()
);
CREATE POLICY "Anyone inserts notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- ════════════════════════════════════════════════════════════════
-- 5. BOOKINGS TABLE (Logistics & Agent Tracking)
-- ════════════════════════════════════════════════════════════════
CREATE TABLE public.bookings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  agent_id        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  waste_type      TEXT,                
  preferred_date  DATE NOT NULL,
  time_slot       TEXT,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in-progress', 'completed', 'cancelled')),
  bags            INTEGER DEFAULT 1,
  weight_kg       NUMERIC(10,2) DEFAULT 0.00,
  fee             NUMERIC(10,2) DEFAULT 0.00,
  notes           TEXT,
  estate          TEXT,
  latitude        NUMERIC(10,7),
  longitude       NUMERIC(10,7),
  h3_index        TEXT,
  booking_type    TEXT DEFAULT 'any',
  actual_weight_kg NUMERIC(10,2) DEFAULT 0.00,
  distance_km     NUMERIC(10,2),
  logistics_fee   NUMERIC(10,2),
  total_price     NUMERIC(10,2),
  agent_rating    INTEGER,
  agent_feedback  TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users and Agents view relevant bookings" ON public.bookings FOR SELECT USING (
  auth.uid() = user_id OR auth.uid() = agent_id OR 
  public.get_my_role() IN ('admin', 'agent')
);
CREATE POLICY "Users create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Parties update bookings" ON public.bookings FOR UPDATE USING (
  (status = 'pending' AND agent_id IS NULL) OR
  auth.uid() = user_id OR 
  auth.uid() = agent_id OR 
  public.get_my_role() = 'admin'
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;


-- ════════════════════════════════════════════════════════════════
-- 6. MARKETPLACE TABLES
-- ════════════════════════════════════════════════════════════════
CREATE TABLE public.marketplace_listings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  material        TEXT NOT NULL,
  quantity        NUMERIC(10,2) NOT NULL,
  price_per_kg    NUMERIC(10,2) NOT NULL,
  location        TEXT,
  photo_url       TEXT,
  description     TEXT, -- Added to fix submission error
  grade           TEXT, -- 'Grade A', 'Grade B', 'Mixed Paper', etc.
  unit            TEXT DEFAULT 'KG', -- 'KG' or 'Tons'
  moq             NUMERIC(10,2) DEFAULT 1.00, -- Minimum Order Quantity
  ai_match_score  INTEGER DEFAULT 0,
  status          TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'sold', 'cancelled')),
  views           INTEGER DEFAULT 0,
  offers          INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.marketplace_orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id      UUID REFERENCES public.marketplace_listings(id) ON DELETE SET NULL,
  buyer_id        UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  material        TEXT NOT NULL,
  quantity        NUMERIC(10,2) NOT NULL,
  unit_price      NUMERIC(10,2) NOT NULL,
  total_price     NUMERIC(10,2) NOT NULL,
  status          TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'processing', 'completed', 'cancelled')),
  booking_id      UUID REFERENCES public.bookings(id) ON DELETE SET NULL, -- Link to logistics
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views active listings" ON public.marketplace_listings FOR SELECT USING (status = 'active' OR seller_id = auth.uid());
CREATE POLICY "Users post listings" ON public.marketplace_listings FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers update listings" ON public.marketplace_listings FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Sellers delete listings" ON public.marketplace_listings FOR DELETE USING (auth.uid() = seller_id);

ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Buyers and Sellers view orders" ON public.marketplace_orders FOR SELECT USING (
  auth.uid() = buyer_id OR 
  EXISTS (SELECT 1 FROM public.marketplace_listings WHERE id = listing_id AND seller_id = auth.uid()) OR
  public.get_my_role() = 'admin'
);
CREATE POLICY "Buyers create orders" ON public.marketplace_orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- ════════════════════════════════════════════════════════════════
-- 7. IOT INFRASTRUCTURE (Global Smart Monitoring)
-- ════════════════════════════════════════════════════════════════
CREATE TABLE public.iot_devices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id        UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  type            TEXT CHECK (type IN ('smart-bin', 'air-quality', 'wastewater')),
  fill_level      INTEGER DEFAULT 0,
  aqi             INTEGER DEFAULT 0,
  odour_level     TEXT,
  efficiency      NUMERIC(5,2) DEFAULT 0.00,
  serial_number   TEXT UNIQUE,
  status          TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'maintenance', 'unclaimed')),
  visibility      TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'community')),
  last_pulse      TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.iot_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View reachable devices" ON public.iot_devices FOR SELECT USING (
  visibility = 'community' OR auth.uid() = owner_id OR 
  public.get_my_role() = 'admin'
);
CREATE POLICY "Admins manage IoT" ON public.iot_devices FOR ALL USING (
  public.get_my_role() = 'admin'
);

-- Realtime for IoT
ALTER PUBLICATION supabase_realtime ADD TABLE public.iot_devices;

-- ════════════════════════════════════════════════════════════════
-- 8. HYGENEX AI MESSAGES (Persistent Intelligence)
-- ════════════════════════════════════════════════════════════════
CREATE TABLE public.hygenex_messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role            TEXT CHECK (role IN ('user', 'ai')),
  text            TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.hygenex_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own chat history" ON public.hygenex_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users post messages" ON public.hygenex_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════════
-- TRIGGERS: Auto-Update Timestamp
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER config_updated_at BEFORE UPDATE ON public.system_config FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════════════════════════
-- Master Configuration Complete!
-- ═══════════════════════════════════════════════════════════════

-- ── IDENTITY SYNC HELPER ────────────────────────────────────────
-- RUN THIS TO INSTANTLY FIX YOUR ADMIN PERMISSIONS 
-- (It identifies your current session and promotes you to admin)
-- INSERT INTO public.profiles (id, name, phone, role)
-- SELECT auth.uid(), 'Admin User', '000', 'admin'
-- FROM auth.users WHERE id = auth.uid()
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- ════════════════════════════════════════════════════════════════
-- 9. ANALYTICS & INTELLIGENCE FUNCTIONS (RPCs)
-- ════════════════════════════════════════════════════════════════

-- ── Global Admin Overview Dashboard ──────────────────────────────
-- ── Global Admin Overview Dashboard ──────────────────────────────
DROP FUNCTION IF EXISTS public.get_admin_overview();
CREATE OR REPLACE FUNCTION public.get_admin_overview()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'totalUsers',        (SELECT count(*) FROM public.profiles WHERE role = 'user'),
    'activeAgents',       (SELECT count(*) FROM public.profiles WHERE role = 'agent' AND is_online = true),
    'registeredAgents',   (SELECT count(*) FROM public.profiles WHERE role = 'agent'),
    'totalBusinesses',    (SELECT count(*) FROM public.profiles WHERE role = 'business'),
    'freeTierMembers',    (SELECT count(*) FROM public.profiles WHERE subscription_tier = 'lite' AND role = 'user'),
    'standardMembers',    (SELECT count(*) FROM public.profiles WHERE subscription_tier = 'standard' AND role = 'user'),
    'premiumMembers',     (SELECT count(*) FROM public.profiles WHERE subscription_tier = 'premium' AND role = 'user'),
    'totalWeight',        COALESCE((SELECT sum(actual_weight_kg) FROM public.bookings WHERE status = 'completed'), 0),
    'totalRevenue',       COALESCE((SELECT sum(fee) FROM public.bookings WHERE status = 'completed'), 0) + 
                          COALESCE((SELECT sum(total_price) FROM public.marketplace_orders WHERE status = 'completed'), 0),
    'subscriptionRevenue', COALESCE((SELECT sum(CASE 
                                WHEN subscription_tier = 'standard' THEN 500 
                                WHEN subscription_tier = 'premium' THEN 1500 
                                ELSE 0 END) FROM public.profiles), 0),
    'commissionRevenue',  COALESCE((SELECT sum(total_price * 0.1) FROM public.marketplace_orders WHERE status = 'completed'), 0),
    'rewardsLiabilities', COALESCE((SELECT sum(wallet_balance) FROM public.profiles), 0),
    'pendingJobs',        (SELECT count(*) FROM public.bookings WHERE status = 'pending')
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Revenue Monthly Trends ───────────────────────────────────────
DROP FUNCTION IF EXISTS public.get_revenue_trends();
CREATE OR REPLACE FUNCTION public.get_revenue_trends()
RETURNS SETOF json AS $$
BEGIN
  RETURN QUERY
  SELECT json_build_object(
    'month', to_char(created_at, 'Mon'),
    'revenue', sum(total_price)
  )
  FROM public.marketplace_orders
  WHERE status = 'completed'
  GROUP BY 1, date_trunc('month', created_at)
  ORDER BY date_trunc('month', created_at) DESC
  LIMIT 6;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Material Volume Distribution ─────────────────────────────────
DROP FUNCTION IF EXISTS public.get_material_distribution();
CREATE OR REPLACE FUNCTION public.get_material_distribution()
RETURNS SETOF json AS $$
BEGIN
  RETURN QUERY
  SELECT json_build_object(
    'name', material,
    'value', sum(quantity)
  )
  FROM public.marketplace_orders
  WHERE status = 'completed'
  GROUP BY material
  ORDER BY 2 DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── B2B Market Intelligence (Live Price Floors) ─────────────────
DROP FUNCTION IF EXISTS public.get_b2b_market_stats();
CREATE OR REPLACE FUNCTION public.get_b2b_market_stats()
RETURNS SETOF json AS $$
BEGIN
  RETURN QUERY
  SELECT json_build_object(
    'label', material,
    'price', 'KES ' || ROUND(AVG(price_per_kg), 2),
    'trend', CASE 
               WHEN AVG(price_per_kg) > 50 THEN '+2.4%' 
               WHEN AVG(price_per_kg) < 20 THEN '-1.2%' 
               ELSE '+0.5%' 
             END,
    'color', CASE 
               WHEN AVG(price_per_kg) > 50 THEN 'text-emerald-500' 
               WHEN AVG(price_per_kg) < 20 THEN 'text-rose-500' 
               ELSE 'text-slate-400' 
             END
  )
  FROM public.marketplace_listings
  WHERE status = 'active'
  GROUP BY material
  ORDER BY AVG(price_per_kg) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── High Alert Bookings ──────────────────────────────────────────
DROP FUNCTION IF EXISTS public.get_high_alert_bookings();
CREATE OR REPLACE FUNCTION public.get_high_alert_bookings()
RETURNS SETOF json AS $$
BEGIN
  RETURN QUERY
  SELECT row_to_json(b)
  FROM public.bookings b
  WHERE status = 'pending' 
  AND created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ════════════════════════════════════════════════════════════════
-- 10. SUSTAINOMICS REWARDS ENGINE
-- ════════════════════════════════════════════════════════════════

-- ── Rewards Ledger Table (Audit Trail) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.rewards_ledger (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_id        UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  amount_cashback   NUMERIC(10,2) DEFAULT 0.00,
  amount_points     INTEGER DEFAULT 0,
  transaction_type  TEXT CHECK (transaction_type IN ('earning', 'withdrawal', 'subscription_payment')),
  description       TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.rewards_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own ledger" ON public.rewards_ledger FOR SELECT USING (auth.uid() = profile_id);

-- ── Automated Reward Trigger (Robust Version) ───────────────────
CREATE OR REPLACE FUNCTION credit_user_rewards()
RETURNS TRIGGER AS $$
DECLARE
  v_cashback_per_kg NUMERIC := 5.00;  -- Average cashback per KG
  v_points_per_kg   NUMERIC := 5;     -- Average points per KG
  v_earned_cashback NUMERIC;
  v_earned_points   INTEGER;
BEGIN
  -- Logic: Trigger when status becomes 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Ensure we have a valid weight, even if 0
    v_earned_cashback := COALESCE(NEW.actual_weight_kg, 0) * v_cashback_per_kg;
    v_earned_points   := floor(COALESCE(NEW.actual_weight_kg, 0) * v_points_per_kg);

    -- 1. Update Profile (Wallet & Points)
    UPDATE public.profiles
    SET 
      wallet_balance = COALESCE(wallet_balance, 0) + v_earned_cashback,
      reward_points  = COALESCE(reward_points, 0) + v_earned_points
    WHERE id = NEW.user_id;

    -- 2. Log Transaction in Ledger (Audit Trail)
    INSERT INTO public.rewards_ledger (profile_id, booking_id, amount_cashback, amount_points, transaction_type, description)
    VALUES (NEW.user_id, NEW.id, v_earned_cashback, v_earned_points, 'earning', 'Recycling reward for ' || COALESCE(NEW.actual_weight_kg, 0) || 'kg pickup');

    -- 3. Send Real-time Notification
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

-- ── Automated Reputation & Notifications Trigger ───────────────
CREATE OR REPLACE FUNCTION sync_agent_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_avg_rating NUMERIC(3,2);
BEGIN
  -- Logic: Fire only when rating or feedback is provided/updated
  IF (NEW.agent_rating IS DISTINCT FROM OLD.agent_rating) AND NEW.agent_rating IS NOT NULL THEN
    
    -- 1. Recalculate average for this agent
    SELECT ROUND(AVG(agent_rating)::numeric, 2)
    INTO v_avg_rating
    FROM public.bookings
    WHERE agent_id = NEW.agent_id
    AND agent_rating IS NOT NULL;

    -- 2. Update Agent Profile
    UPDATE public.profiles
    SET rating = COALESCE(v_avg_rating, 5.00)
    WHERE id = NEW.agent_id;

    -- 3. Send Notification to Agent
    INSERT INTO public.notifications (target_user, target_role, type, title, body)
    VALUES (
      NEW.agent_id,
      'agent',
      'info',
      'New Review! ⭐',
      'A client just rated your service ' || NEW.agent_rating || ' stars. Keep up the clean work!'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_rating_submitted ON public.bookings;
CREATE TRIGGER on_rating_submitted
  AFTER UPDATE OF agent_rating ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION sync_agent_rating();

-- ── Secure Account Deactivation ────────────────────────────────
CREATE OR REPLACE FUNCTION delete_own_user()
RETURNS void AS $$
BEGIN
  -- Delete from auth.users (Cascades to profiles and all other linked data)
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════
-- OTP Verification Temp Storage
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  phone       TEXT PRIMARY KEY,
  otp_code    TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Note: No RLS policies are needed for this table because it is 
-- only interacted with securely backstage via Edge Functions (Service Role Key).

-- ═══════════════════════════════════════════════════════════════
-- Master Configuration Complete!
-- ═══════════════════════════════════════════════════════════════
