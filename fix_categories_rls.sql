-- Run this to ensure the Client App can read the categories
ALTER TABLE public.waste_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access for waste_categories" ON public.waste_categories;
CREATE POLICY "Public read access for waste_categories" ON public.waste_categories FOR SELECT USING (true);
