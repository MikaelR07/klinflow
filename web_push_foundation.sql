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
CREATE POLICY "Users can manage their own push subscriptions"
ON public.push_subscriptions
FOR ALL
USING (auth.uid() = user_id);

-- ── 2. NOTIFICATION PUSH TRIGGER (ARCHITECTURE) ─────────────────────
-- This function will eventually trigger a Supabase Edge Function 
-- that uses the 'web-push' library to send the actual notification.
CREATE OR REPLACE FUNCTION public.on_new_notification_push()
RETURNS TRIGGER AS $$
BEGIN
  -- We trigger an Edge Function named 'send-push-notification'
  -- This requires the Supabase HTTP extension to be enabled.
  -- For now, we just prepare the logic.
  
  PERFORM
    net.http_post(
      url := 'https://heqxpcrguaopiimsuqmk.supabase.co/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'notification', row_to_json(NEW),
        'user_id', NEW.user_id
      )
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Whenever a notification is added to the inbox, try to push it.
-- (Note: This is commented out until the Edge Function is ready)
-- DROP TRIGGER IF EXISTS trigger_push_notification ON public.notifications;
-- CREATE TRIGGER trigger_push_notification
-- AFTER INSERT ON public.notifications
-- FOR EACH ROW
-- EXECUTE FUNCTION public.on_new_notification_push();
