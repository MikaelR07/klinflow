-- Migration: 20240429_add_gender_to_profiles.sql
-- Description: Adds gender field to profiles for analytics and personalization

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS gender TEXT;

-- Validation check for common gender values
ALTER TABLE public.profiles
  ADD CONSTRAINT check_gender_values
  CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say'));
