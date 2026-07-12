ALTER TABLE public.marketplace_listings 
  ADD COLUMN IF NOT EXISTS target_agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pickup_mode TEXT DEFAULT 'pickup' CHECK (pickup_mode IN ('pickup', 'dropoff'));

ALTER TABLE public.marketplace_orders 
  ADD COLUMN IF NOT EXISTS pickup_mode TEXT DEFAULT 'pickup' CHECK (pickup_mode IN ('pickup', 'dropoff'));
