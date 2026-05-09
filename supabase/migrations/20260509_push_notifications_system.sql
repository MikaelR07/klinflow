
-- ── 1. PUSH SUBSCRIPTIONS TABLE ──────────────────────────────────────
-- Stores the unique endpoints and keys for Web Push (Chrome, Safari, Firefox)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  device_type TEXT, -- 'mobile', 'desktop', 'ios'
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only manage their own subscriptions
DROP POLICY IF EXISTS "Users can manage their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can manage their own push subscriptions"
ON public.push_subscriptions
FOR ALL
USING (auth.uid() = user_id);

-- ── 2. ENABLE HTTP EXTENSION ──────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";

-- ── 3. NOTIFICATION PUSH TRIGGER ──────────────────────────────────
-- This function triggers the Supabase Edge Function to send the push alert
CREATE OR REPLACE FUNCTION public.on_new_notification_push()
RETURNS TRIGGER AS $$
BEGIN
  -- We trigger the 'send-push-notification' Edge Function
  -- Note: We pass the service role key for authentication
  PERFORM
    extensions.http_post(
      url := 'https://heqxpcrguaopiimsuqmk.supabase.co/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
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
