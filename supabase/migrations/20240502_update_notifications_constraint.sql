-- Update the notifications target role check to include 'hub'
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_target_role_check;

ALTER TABLE public.notifications ADD CONSTRAINT notifications_target_role_check 
CHECK (target_role = ANY (ARRAY['client'::text, 'agent'::text, 'admin'::text, 'business'::text, 'user'::text, 'hub'::text, 'all'::text]));
