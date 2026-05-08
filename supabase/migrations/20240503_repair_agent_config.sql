-- Repair Migration: Ensure agent_configurations has all required columns for discovery
ALTER TABLE public.agent_configurations 
  ADD COLUMN IF NOT EXISTS base_logistics_fee NUMERIC(10,2) DEFAULT 200.00,
  ADD COLUMN IF NOT EXISTS accepted_materials JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS service_scale TEXT DEFAULT 'standard';

-- Ensure the relationship is correct
COMMENT ON TABLE public.agent_configurations IS 'Stores operational settings for agents and companies.';
