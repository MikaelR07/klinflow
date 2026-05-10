-- ═══════════════════════════════════════════════════════════════
-- CleanFlow KE — Supabase Database Schema
-- Run this entire file in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── Enable UUID extension ────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ════════════════════════════════════════════════════════════════
-- 1. PROFILES TABLE
--    Extends Supabase auth.users with CleanFlow-specific data.
--    One row per registered user.
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL UNIQUE,
  role        TEXT NOT NULL CHECK (role IN ('user', 'agent', 'admin')),
  avatar      TEXT DEFAULT '👤',
  location    JSONB DEFAULT '{"estate":"Nairobi","latitude":null,"longitude":null}'::jsonb,
  id_number   TEXT,                   -- Green Agents only
  vehicle     TEXT,                   -- Green Agents only
  rating      NUMERIC(3,1) DEFAULT 5.0,
  is_online   BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at on any row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security: users can only see/edit their own profile
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Service can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (true); -- Supabase edge function or backend handles insert on signup


-- ════════════════════════════════════════════════════════════════
-- 2. IOT_READINGS TABLE
--    Real-time sensor telemetry from smart bins and air sensors.
--    Subscribe to this table via Supabase Realtime.
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.iot_readings (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bin_id                TEXT NOT NULL,        -- e.g. 'bin-1', 'bin-2'
  bin_name              TEXT,
  bin_location          TEXT,
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Owner (for private sensors)
  visibility            TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'estate', 'global')),
  fill_level            INTEGER CHECK (fill_level BETWEEN 0 AND 100),
  aqi                   INTEGER,              -- Air Quality Index
  odour_level           TEXT,                 -- 'None' | 'Mild' | 'Strong' | 'Gas Leak Detected'
  wastewater_efficiency INTEGER,             -- Percentage 0-100
  estate                TEXT,                 -- Which estate this reading belongs to
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security for Hierarchical IoT
ALTER TABLE public.iot_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view private or estate-shared IoT"
  ON public.iot_readings FOR SELECT
  USING (
    auth.uid() = user_id OR 
    (visibility = 'estate' AND estate = (SELECT (location->>'estate') FROM public.profiles WHERE id = auth.uid())) OR
    visibility = 'global'
  );

CREATE POLICY "Service can insert IoT readings"
  ON public.iot_readings FOR INSERT
  WITH CHECK (true);

-- Enable Realtime for this table (run in SQL Editor)
ALTER PUBLICATION supabase_realtime ADD TABLE public.iot_readings;


-- ════════════════════════════════════════════════════════════════
-- 3. HYGENEX_MESSAGES TABLE
--    Persisted chat history between users and the HygeneX AI.
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.hygenex_messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user', 'ai')),
  text        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.hygenex_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
  ON public.hygenex_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages"
  ON public.hygenex_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.hygenex_messages;


-- ════════════════════════════════════════════════════════════════
-- 4. BOOKINGS TABLE
--    Waste pickup bookings made by residents.
-- ════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.bookings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  waste_type      TEXT,                -- 'General', 'Organic', 'Recyclable', 'Hazardous'
  preferred_date  DATE NOT NULL,
  time_slot       TEXT,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  notes           TEXT,
  estate          TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = agent_id);

CREATE POLICY "Users can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = agent_id);

-- ═══════════════════════════════════════════════════════════════
-- Done! All tables created.
-- ═══════════════════════════════════════════════════════════════
