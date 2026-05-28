-- Add material, description, and images to swarm_participants table
ALTER TABLE public.swarm_participants
ADD COLUMN IF NOT EXISTS material TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
