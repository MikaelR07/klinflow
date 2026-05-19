-- Migrations to remove IoT infrastructure
-- Date: 2026-05-15

DROP TABLE IF EXISTS public.iot_devices CASCADE;
DROP FUNCTION IF EXISTS public.link_iot_device(p_serial text, p_owner_id uuid);
DROP FUNCTION IF EXISTS public.pulse_iot_device(p_device_id uuid, p_updates jsonb);

-- Cleanup Profile Columns related to IoT if any
ALTER TABLE public.profiles DROP COLUMN IF EXISTS last_pulse;
