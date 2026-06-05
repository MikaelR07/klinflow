-- Ensure RLS is enabled
ALTER TABLE public.swarms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swarm_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collective_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_participants ENABLE ROW LEVEL SECURITY;

-- Drop existing delete policies to avoid conflicts
DROP POLICY IF EXISTS "Enable delete for swarm creator" ON public.swarms;
DROP POLICY IF EXISTS "Enable delete for goal creator" ON public.collective_goals;
DROP POLICY IF EXISTS "Enable swarm creator to delete participants" ON public.swarm_participants;
DROP POLICY IF EXISTS "Enable goal creator to delete participants" ON public.goal_participants;

-- Swarms: Creator can delete
CREATE POLICY "Enable delete for swarm creator" ON public.swarms
FOR DELETE USING (auth.uid() = creator_id);

-- Goals: Creator can delete
CREATE POLICY "Enable delete for goal creator" ON public.collective_goals
FOR DELETE USING (auth.uid() = creator_id);

-- Swarm Participants: Creator of the swarm can delete any participant
CREATE POLICY "Enable swarm creator to delete participants" ON public.swarm_participants
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.swarms s
    WHERE s.id = swarm_participants.swarm_id
    AND s.creator_id = auth.uid()
  )
);

-- Goal Participants: Creator of the goal can delete any participant
CREATE POLICY "Enable goal creator to delete participants" ON public.goal_participants
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.collective_goals g
    WHERE g.id = goal_participants.goal_id
    AND g.creator_id = auth.uid()
  )
);
