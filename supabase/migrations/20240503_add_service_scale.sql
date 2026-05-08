-- Migration: Add service_scale to agent_configurations to support weight-based discovery filtering
-- standard: Up to 50kg, bulk: 50kg-500kg, industrial: 500kg+
ALTER TABLE public.agent_configurations ADD COLUMN IF NOT EXISTS service_scale TEXT DEFAULT 'standard';
