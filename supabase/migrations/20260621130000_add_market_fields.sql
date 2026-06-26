-- Add market intelligence fields to waste_categories table
ALTER TABLE public.waste_categories
ADD COLUMN IF NOT EXISTS demand TEXT DEFAULT 'Stable',
ADD COLUMN IF NOT EXISTS supply TEXT DEFAULT 'Stable',
ADD COLUMN IF NOT EXISTS change_ksh NUMERIC DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS change_pct NUMERIC DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS top_buyer TEXT;

-- Update existing rows with realistic mock data
UPDATE public.waste_categories
SET demand = (ARRAY['High', 'Critical', 'Stable', 'Low'])[floor(random() * 4 + 1)],
    supply = (ARRAY['High', 'Stable', 'Low'])[floor(random() * 3 + 1)],
    change_ksh = round((random() * 10 - 5)::numeric, 2),
    change_pct = round((random() * 10 - 5)::numeric, 2),
    top_buyer = (ARRAY['EcoPlastics Inc', 'GreenMetal Co.', 'PaperMills Ltd', 'GlassWorks', 'E-Waste Solutions', 'SustainaCo'])[floor(random() * 6 + 1)]
WHERE top_buyer IS NULL;
