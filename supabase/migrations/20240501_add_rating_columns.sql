-- Migration: 20240501_add_rating_columns.sql
-- Description: Adds rating and feedback columns to the bookings table to enable client-to-agent reviews.

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS agent_rating INTEGER CHECK (agent_rating >= 1 AND agent_rating <= 5),
ADD COLUMN IF NOT EXISTS agent_rating_comment TEXT;

-- Index for performance when calculating agent averages
CREATE INDEX IF NOT EXISTS idx_bookings_agent_rating ON public.bookings(agent_id, agent_rating) WHERE agent_rating IS NOT NULL;
