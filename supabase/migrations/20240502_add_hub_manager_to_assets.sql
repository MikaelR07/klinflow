-- Add hub_manager_id to assets to track who verified/received the cargo
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS hub_manager_id UUID REFERENCES public.profiles(id);

-- Update RLS to allow hub managers to see their received inventory
CREATE POLICY "Hub managers view received assets"
ON public.assets
FOR SELECT
USING (hub_manager_id = auth.uid());
