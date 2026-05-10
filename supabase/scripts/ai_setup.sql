-- ════════════════════════════════════════════════════════════════
-- CLEANFLOW AI OPERATIONS MANAGER — SETUP SCRIPT
-- Run this in your Supabase SQL Editor.
-- ════════════════════════════════════════════════════════════════

-- 1. REWARDS & INCENTIVES (AI-Driven)
CREATE TABLE IF NOT EXISTS public.rewards (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  points          INTEGER NOT NULL,
  reason          TEXT NOT NULL,
  category        TEXT CHECK (category IN ('segregation', 'booking', 'reporting', 'community')),
  awarded_by      TEXT DEFAULT 'system',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own rewards" ON public.rewards FOR SELECT USING (auth.uid() = user_id);

-- 2. NEMA COMPLIANCE REPORTS (Admin Oversight)
CREATE TABLE IF NOT EXISTS public.nema_reports (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_type     TEXT NOT NULL, 
  estates         TEXT[],
  report_data     JSONB NOT NULL,
  status          TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'submitted')),
  triggered_by    TEXT DEFAULT 'system',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.nema_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage NEMA reports" ON public.nema_reports FOR ALL USING (public.get_my_role() = 'admin');

-- 3. AGENT ACTIONS (AI Audit Log)
CREATE TABLE IF NOT EXISTS public.agent_actions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trigger_type    TEXT NOT NULL, 
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  payload         JSONB,
  decision        TEXT,
  actions         JSONB, 
  tools_called    TEXT[],
  success         BOOLEAN DEFAULT true,
  duration_ms     INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.agent_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view agent logs" ON public.agent_actions FOR SELECT USING (public.get_my_role() = 'admin');

-- 4. ENABLE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.rewards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hygenex_messages;

-- 5. WEBHOOK TRIGGER (Run this ONLY after deploying the Edge Function)
-- This tells Supabase to call the HygeneX Brain whenever a user messages.
/*
CREATE TRIGGER on_hygenex_message
  AFTER INSERT ON public.hygenex_messages
  FOR EACH ROW
  WHEN (NEW.role = 'user')
  EXECUTE FUNCTION supabase_functions.http_request(
    'http://localhost:54321/functions/v1/hygenex-agent',
    'POST',
    '{"Content-Type":"application/json", "Authorization":"Bearer YOUR_SERVICE_ROLE_KEY"}',
    '{}'
  );
*/
