-- Migration: 20240429_add_company_name_to_profiles.sql
-- Description: Adds company_name field to profiles for businesses/admins

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Index for searching companies by name
CREATE INDEX IF NOT EXISTS idx_profiles_company_name ON public.profiles(company_name) WHERE company_name IS NOT NULL;
