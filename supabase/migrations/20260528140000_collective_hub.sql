-- Migrations for Collective Hub (Swarms & Goals)

-- 1. Create Swarms Table
CREATE TABLE IF NOT EXISTS public.swarms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    estate TEXT NOT NULL,
    material TEXT NOT NULL,
    target_weight NUMERIC NOT NULL DEFAULT 0,
    current_weight NUMERIC NOT NULL DEFAULT 0,
    closes_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Collective Goals Table
CREATE TABLE IF NOT EXISTS public.collective_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    estate TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    target_weight NUMERIC NOT NULL DEFAULT 0,
    current_weight NUMERIC NOT NULL DEFAULT 0,
    reward TEXT,
    closes_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Swarm Participants Table
CREATE TABLE IF NOT EXISTS public.swarm_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    swarm_id UUID REFERENCES public.swarms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    pledged_weight NUMERIC NOT NULL DEFAULT 0,
    actual_weight NUMERIC DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pledged' CHECK (status IN ('pledged', 'fulfilled', 'withdrawn')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(swarm_id, user_id)
);

-- 4. Create Goal Participants Table
CREATE TABLE IF NOT EXISTS public.goal_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID REFERENCES public.collective_goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    pledged_weight NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pledged' CHECK (status IN ('pledged', 'fulfilled', 'withdrawn')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(goal_id, user_id)
);

-- Add Triggers to automatically update current_weight for Swarms and Goals
CREATE OR REPLACE FUNCTION update_swarm_weight()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.swarms
    SET current_weight = (
        SELECT COALESCE(SUM(pledged_weight), 0)
        FROM public.swarm_participants
        WHERE swarm_id = NEW.swarm_id AND status != 'withdrawn'
    )
    WHERE id = NEW.swarm_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_swarm_participant_change
AFTER INSERT OR UPDATE OR DELETE ON public.swarm_participants
FOR EACH ROW EXECUTE FUNCTION update_swarm_weight();

CREATE OR REPLACE FUNCTION update_goal_weight()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.collective_goals
    SET current_weight = (
        SELECT COALESCE(SUM(pledged_weight), 0)
        FROM public.goal_participants
        WHERE goal_id = NEW.goal_id AND status != 'withdrawn'
    )
    WHERE id = NEW.goal_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_goal_participant_change
AFTER INSERT OR UPDATE OR DELETE ON public.goal_participants
FOR EACH ROW EXECUTE FUNCTION update_goal_weight();

-- Enable RLS
ALTER TABLE public.swarms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swarm_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collective_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_participants ENABLE ROW LEVEL SECURITY;

-- Policies for Swarms
CREATE POLICY "Enable read access for all users" ON public.swarms FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.swarms FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Enable update for creator" ON public.swarms FOR UPDATE USING (auth.uid() = creator_id);

-- Policies for Swarm Participants
CREATE POLICY "Enable read access for all users" ON public.swarm_participants FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.swarm_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for own participation" ON public.swarm_participants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for own participation" ON public.swarm_participants FOR DELETE USING (auth.uid() = user_id);

-- Policies for Collective Goals
CREATE POLICY "Enable read access for all users" ON public.collective_goals FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.collective_goals FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Enable update for creator" ON public.collective_goals FOR UPDATE USING (auth.uid() = creator_id);

-- Policies for Goal Participants
CREATE POLICY "Enable read access for all users" ON public.goal_participants FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.goal_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable update for own participation" ON public.goal_participants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for own participation" ON public.goal_participants FOR DELETE USING (auth.uid() = user_id);
