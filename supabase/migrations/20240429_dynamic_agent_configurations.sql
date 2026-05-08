-- Migration: 20240429_dynamic_agent_configurations.sql
-- Description: Adds dynamic autonomy and company/fleet architecture for Agents

-- 1. Update Profiles Table for Fleet Hierarchy
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS agent_account_type TEXT DEFAULT 'independent' 
  CHECK (agent_account_type IN ('independent', 'company_admin', 'fleet_driver')),
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Create Agent Configurations Table
CREATE TABLE IF NOT EXISTS public.agent_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  
  -- Financial Settings
  base_logistics_fee NUMERIC(10,2) DEFAULT 200.00,
  cashback_percentage NUMERIC(5,2) DEFAULT 10.00,
  
  -- Service Configurations
  accepted_materials JSONB DEFAULT '[]'::jsonb, -- Array of slugs e.g., ['plastics', 'metals', 'ewaste']
  custom_rates JSONB DEFAULT '{}'::jsonb,      -- Key-value pair overrides e.g., {"plastics": 12}
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Row Level Security for agent_configurations
ALTER TABLE public.agent_configurations ENABLE ROW LEVEL SECURITY;

-- Anyone can view agent configurations (needed for Client App to show prices)
CREATE POLICY "Public can view agent configurations" 
  ON public.agent_configurations FOR SELECT 
  USING (true);

-- Agents/Companies can only update their own configurations
CREATE POLICY "Agents can manage their own config" 
  ON public.agent_configurations FOR ALL
  USING (auth.uid() = agent_id);

-- 4. Auto-Provision Trigger
-- Automatically creates a configuration record for new independent agents or companies
CREATE OR REPLACE FUNCTION public.handle_new_agent_config()
RETURNS trigger AS $$
BEGIN
  IF NEW.role = 'agent' AND NEW.agent_account_type IN ('independent', 'company_admin') THEN
    INSERT INTO public.agent_configurations (agent_id)
    VALUES (NEW.id)
    ON CONFLICT (agent_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_agent_created_config ON public.profiles;
CREATE TRIGGER on_agent_created_config
  AFTER INSERT OR UPDATE OF role, agent_account_type ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_agent_config();

-- 5. Backfill Existing Agents
-- Give all existing agents an independent account type and a default configuration
UPDATE public.profiles 
SET agent_account_type = 'independent' 
WHERE role = 'agent' AND agent_account_type IS NULL;

INSERT INTO public.agent_configurations (agent_id)
SELECT id FROM public.profiles WHERE role = 'agent'
ON CONFLICT (agent_id) DO NOTHING;
