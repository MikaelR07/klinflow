-- ── 1. PUSH SUBSCRIPTIONS & PRIVATE SETTINGS ───────────────────────────
-- Stores the unique endpoints and keys for Web Push
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  device_type TEXT, 
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ DEFAULT now()
);

-- Create private schema for secrets if it doesn't exist
CREATE SCHEMA IF NOT EXISTS private;
CREATE TABLE IF NOT EXISTS private.settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.settings ENABLE ROW LEVEL SECURITY; -- Nobody can read except security definers

-- Policies
DROP POLICY IF EXISTS "Users can manage their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can manage their own push subscriptions"
ON public.push_subscriptions
FOR ALL
USING (auth.uid() = user_id);

-- ── 2. ENABLE PG_NET EXTENSION ──────────────────────────────────────
-- pg_net is asynchronous and recommended for database triggers
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ── 3. NOTIFICATION PUSH TRIGGER ──────────────────────────────────
-- This function triggers the Supabase Edge Function to send the push alert
CREATE OR REPLACE FUNCTION public.on_new_notification_push()
RETURNS TRIGGER AS $$
DECLARE
  svc_key TEXT;
BEGIN
  -- Retrieve the service role key from private settings
  SELECT value INTO svc_key FROM private.settings WHERE key = 'service_role_key' LIMIT 1;

  -- We trigger the 'send-push-notification' Edge Function asynchronously
  PERFORM
    net.http_post(
      url := 'https://heqxpcrguaopiimsuqmk.supabase.co/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || COALESCE(svc_key, 'MISSING_KEY')
      ),
      body := jsonb_build_object(
        'notification', row_to_json(NEW),
        'target_user', NEW.target_user,
        'target_role', NEW.target_role
      )
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Whenever a notification is added, trigger the push logic
DROP TRIGGER IF EXISTS trigger_push_notification ON public.notifications;
CREATE TRIGGER trigger_push_notification
AFTER INSERT ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.on_new_notification_push();
