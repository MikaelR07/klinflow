-- Migration: add_missing_asset_columns.sql
-- Description: Adds digital_batch_id, metadata, and is_manual to the assets table for tracking and digital twin features.

ALTER TABLE public.assets 
  ADD COLUMN IF NOT EXISTS digital_batch_id TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB,
  ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT false;
