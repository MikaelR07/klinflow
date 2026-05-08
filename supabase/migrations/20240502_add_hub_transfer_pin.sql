-- Migration: 20240502_add_hub_transfer_pin.sql
-- Description: Adds a PIN column to profiles for the Gate Check-in OTP flow

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS hub_transfer_pin TEXT;
