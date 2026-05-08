CREATE TABLE IF NOT EXISTS public.material_prices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    material_name TEXT UNIQUE NOT NULL,
    price_per_kg DECIMAL(10,2) NOT NULL DEFAULT 10.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed with default values
INSERT INTO material_prices (material_name, price_per_kg)
VALUES
    ('Plastics', 15.00),
    ('Metals', 30.00),
    ('Paper & Cardboard', 5.00),
    ('Glass', 5.00),
    ('E-Waste', 40.00)
ON CONFLICT (material_name) 
DO UPDATE SET price_per_kg = EXCLUDED.price_per_kg;

-- RLS Policies
ALTER TABLE public.material_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for material prices" ON public.material_prices FOR SELECT USING (true);
CREATE POLICY "Admin full access for material prices" ON public.material_prices FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
