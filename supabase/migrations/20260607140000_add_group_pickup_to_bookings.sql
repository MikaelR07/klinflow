-- Add swarm tracking to bookings
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS swarm_id UUID REFERENCES public.swarms(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_group_pickup BOOLEAN DEFAULT false;
