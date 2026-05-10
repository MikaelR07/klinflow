-- ════════════════════════════════════════════════════════════════
-- CLEANFLOW IoT HANDSHAKE SETUP
-- Migration to add serial_number support and unclaimed test devices.
-- ════════════════════════════════════════════════════════════════

-- 1. ADD COLUMNS (If not existing from previous runs)
ALTER TABLE public.iot_devices ADD COLUMN IF NOT EXISTS serial_number TEXT UNIQUE;
ALTER TABLE public.iot_devices ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'inactive';

-- 2. SEED UNCLAIMED DEVICES
-- These represent bins sitting in the warehouse waiting for users to link them.
INSERT INTO public.iot_devices (name, type, serial_number, status, visibility, fill_level)
VALUES 
  ('Smart Bin (Warehouse)', 'smart-bin', 'BIN-1001', 'unclaimed', 'private', 0),
  ('Smart Bin (Warehouse)', 'smart-bin', 'BIN-1002', 'unclaimed', 'private', 0),
  ('AQ Meter Alpha', 'air-quality', 'AQ-2001', 'unclaimed', 'private', 45),
  ('Wastewater Node 1', 'wastewater', 'WW-3001', 'unclaimed', 'private', 92)
ON CONFLICT (serial_number) DO NOTHING;

-- 3. HELPER FUNCTION: Link Device
-- Securely claims a device for the current user.
CREATE OR REPLACE FUNCTION link_iot_device(p_serial TEXT, p_owner_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  UPDATE public.iot_devices
  SET 
    owner_id = p_owner_id,
    status = 'active',
    updated_at = NOW()
  WHERE serial_number = p_serial 
    AND (owner_id IS NULL OR status = 'unclaimed')
  RETURNING jsonb_build_object(
    'success', true, 
    'id', id, 
    'name', name
  ) INTO v_result;

  IF v_result IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid serial number or device already claimed.');
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. TELEMETRY PULSE (SIMULATOR)
-- Allows updating sensor data (bypasses RLS via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION pulse_iot_device(p_device_id UUID, p_updates JSONB)
RETURNS VOID AS $$
BEGIN
  UPDATE public.iot_devices
  SET 
    fill_level = COALESCE((p_updates->>'fill_level')::INTEGER, fill_level),
    aqi = COALESCE((p_updates->>'aqi')::INTEGER, aqi),
    efficiency = COALESCE((p_updates->>'efficiency')::NUMERIC, efficiency),
    last_pulse = NOW(),
    updated_at = NOW()
  WHERE id = p_device_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
