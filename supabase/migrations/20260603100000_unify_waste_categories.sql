-- ════════════════════════════════════════════════════════════════
-- UNIFY WASTE CATEGORIES — 20260603_unify_waste_categories.sql
-- ════════════════════════════════════════════════════════════════

-- 1. Add parent_category and price_per_kg to waste_categories if not present
ALTER TABLE public.waste_categories
  ADD COLUMN IF NOT EXISTS parent_category TEXT,
  ADD COLUMN IF NOT EXISTS price_per_kg DECIMAL(10,2) DEFAULT 0.00;

-- 2. Migrate existing materials from material_prices to waste_categories if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'material_prices') THEN
    INSERT INTO public.waste_categories (
      label,
      slug,
      parent_category,
      price_per_kg,
      price_per_unit,
      is_active
    )
    SELECT 
      material_name,
      LOWER(REPLACE(material_name, ' ', '-')),
      category,
      price_per_kg,
      price_per_kg,
      true
    FROM public.material_prices
    ON CONFLICT (slug) DO UPDATE
    SET 
      parent_category = EXCLUDED.parent_category,
      price_per_kg = EXCLUDED.price_per_kg,
      price_per_unit = EXCLUDED.price_per_unit;
  END IF;
END $$;

-- 3. Drop material_prices table and its policies
DROP TABLE IF EXISTS public.material_prices CASCADE;

-- 4. Update waste_categories RLS to ensure admins can insert/update/delete
DO $$
BEGIN
    -- Drop existing policies if they exist so we can recreate cleanly
    DROP POLICY IF EXISTS "Public read access for waste categories" ON public.waste_categories;
    DROP POLICY IF EXISTS "Admin full access for waste categories" ON public.waste_categories;
    
    -- Public read access
    CREATE POLICY "Public read access for waste categories" 
      ON public.waste_categories FOR SELECT USING (true);
      
    -- Admin full access
    -- We allow any user whose profile role is 'admin', or whose agent_account_type is 'company_admin'
    CREATE POLICY "Admin full access for waste categories" 
      ON public.waste_categories FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() 
            AND (role = 'admin' OR agent_account_type = 'company_admin')
        )
      );
END
$$;
