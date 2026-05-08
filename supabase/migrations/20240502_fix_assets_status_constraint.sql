-- Migration: 20240502_fix_assets_status_constraint.sql
-- Description: Updates the assets status check constraint to include 'transferred_to_hub'

ALTER TABLE public.assets DROP CONSTRAINT IF EXISTS assets_status_check;

ALTER TABLE public.assets ADD CONSTRAINT assets_status_check
CHECK (status IN (
  'verified',
  'transferred_to_hub',
  'listed',
  'escrow',
  'sold',
  'processed',
  'delivered'
));
