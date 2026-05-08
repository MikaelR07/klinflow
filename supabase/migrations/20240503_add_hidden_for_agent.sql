-- Migration: Add hidden_for_agent to bookings for soft-delete history clearing on the agent app
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS hidden_for_agent BOOLEAN DEFAULT FALSE;
