-- Add DELETE policies for Swarms and Collective Goals to allow creators to delete them

CREATE POLICY "Enable delete for swarm creator" ON public.swarms
FOR DELETE USING (auth.uid() = creator_id);

CREATE POLICY "Enable delete for goal creator" ON public.collective_goals
FOR DELETE USING (auth.uid() = creator_id);
