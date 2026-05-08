-- Migration: 20240502_retroactive_recovered_kg.sql
-- Description: Retroactively sets actual_weight_kg for past completed bookings to fix the "0 Recovered KG" dashboard bug.

UPDATE public.bookings
SET actual_weight_kg = weight_kg
WHERE status = 'completed' 
  AND actual_weight_kg IS NULL 
  AND weight_kg IS NOT NULL;
