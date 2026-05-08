-- ── UPGRADE: Service Profile Infrastructure for PaaS ────────────────
-- This migration enables agents and companies to define their own 
-- operational boundaries (Min/Max Weight) and custom categories.

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS service_profile JSONB DEFAULT '{
  "min_weight": 2,
  "max_weight": 50,
  "categories": [
    {"name": "Plastic", "sub": ["PET", "HDPE"], "enabled": true, "base_rate": 15},
    {"name": "Paper", "sub": ["Cardboard", "Office"], "enabled": true, "base_rate": 10},
    {"name": "Metal", "sub": ["Aluminium", "Steel"], "enabled": true, "base_rate": 25}
  ]
}';

-- Indexing for high-speed matching in the Client App
CREATE INDEX IF NOT EXISTS idx_profiles_service_profile ON public.profiles USING GIN (service_profile);

-- Add a comment for documentation
COMMENT ON COLUMN public.profiles.service_profile IS 'Stores agent/company specific operational limits and category capabilities for the marketplace matching engine.';
