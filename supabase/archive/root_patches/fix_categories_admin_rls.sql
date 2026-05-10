-- 1. Enable RLS on the table (just in case it isn't)
ALTER TABLE public.waste_categories ENABLE ROW LEVEL SECURITY;

-- 2. Allow everyone to READ categories (for the Client App)
DROP POLICY IF EXISTS "Public read access for waste_categories" ON public.waste_categories;
CREATE POLICY "Public read access for waste_categories" 
  ON public.waste_categories FOR SELECT 
  USING (true);

-- 3. Allow Admins to INSERT, UPDATE, and DELETE categories
DROP POLICY IF EXISTS "Admin full access for waste_categories" ON public.waste_categories;
CREATE POLICY "Admin full access for waste_categories" 
  ON public.waste_categories FOR ALL 
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
