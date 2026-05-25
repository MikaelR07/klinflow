-- =========================================================
-- Migration: 20260525160000_market_intelligence.sql
-- Description:
-- Optimized Market Intelligence Engine for Klinflow
-- Includes:
--   - safer SECURITY DEFINER
--   - optimized indexes
--   - partial indexes
--   - improved aggregation performance
--   - production-safe UPSERTS
--   - analytics RPC
-- =========================================================

BEGIN;

-- =========================================================
-- 1. ADD CATEGORY COLUMN
-- =========================================================

ALTER TABLE public.material_prices
ADD COLUMN IF NOT EXISTS category TEXT;

-- =========================================================
-- 2. ENSURE UNIQUE CONSTRAINT
-- Required for ON CONFLICT
-- =========================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'material_prices_material_name_key'
    ) THEN
        ALTER TABLE public.material_prices
        ADD CONSTRAINT material_prices_material_name_key
        UNIQUE (material_name);
    END IF;
END $$;

-- =========================================================
-- 3. SAFER DATA NORMALIZATION
-- Instead of deleting production data
-- =========================================================

UPDATE public.material_prices
SET category = 'General'
WHERE category IS NULL;

-- =========================================================
-- 4. SEED MATERIAL DATA
-- =========================================================

INSERT INTO public.material_prices (
    material_name,
    category,
    price_per_kg
)
VALUES

-- =========================
-- Plastics
-- =========================
('PET Plastic', 'Plastics', 22.00),
('HDPE Plastic', 'Plastics', 18.00),
('LDPE Plastic', 'Plastics', 15.00),
('PP Plastic', 'Plastics', 10.00),
('PVC Plastic', 'Plastics', 8.00),

-- =========================
-- Metals
-- =========================
('Aluminium', 'Metals', 45.00),
('Copper', 'Metals', 120.00),
('Steel', 'Metals', 30.00),
('Iron Scrap', 'Metals', 25.00),
('Brass', 'Metals', 80.00),

-- =========================
-- Paper
-- =========================
('Cardboard', 'Paper', 8.00),
('Mixed Paper', 'Paper', 5.00),
('White Office Paper', 'Paper', 12.00),

-- =========================
-- Glass
-- =========================
('Clear Glass', 'Glass', 5.00),
('Mixed Glass', 'Glass', 3.00),

-- =========================
-- E-Waste
-- =========================
('Electronic Boards', 'E-Waste', 150.00),
('Batteries', 'E-Waste', 40.00),
('Copper Cables', 'E-Waste', 90.00),

-- =========================
-- Organic
-- =========================
('Food Waste', 'Organic', 2.00),
('Agricultural Waste', 'Organic', 3.00)

ON CONFLICT (material_name)
DO UPDATE SET
    category = EXCLUDED.category,
    price_per_kg = EXCLUDED.price_per_kg;

-- =========================================================
-- 5. PERFORMANCE INDEXES
-- =========================================================

-- RFQ indexes
CREATE INDEX IF NOT EXISTS idx_rfqs_open_material
ON public.rfqs(material_grade)
WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_rfqs_material_pickup
ON public.rfqs(material_grade, pickup_area);

CREATE INDEX IF NOT EXISTS idx_rfqs_status_category
ON public.rfqs(status, category);

CREATE INDEX IF NOT EXISTS idx_rfqs_created_at
ON public.rfqs(created_at DESC);

-- Booking indexes
CREATE INDEX IF NOT EXISTS idx_bookings_pending_waste
ON public.bookings(waste_type)
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_bookings_status_waste
ON public.bookings(status, waste_type);

-- Fulfillment indexes
CREATE INDEX IF NOT EXISTS idx_fulfillment_orders_rfq
ON public.fulfillment_orders(rfq_id);

CREATE INDEX IF NOT EXISTS idx_fulfillment_orders_buyer
ON public.fulfillment_orders(buyer_id);

-- Material indexes
CREATE INDEX IF NOT EXISTS idx_material_prices_name
ON public.material_prices(material_name);

CREATE INDEX IF NOT EXISTS idx_material_prices_category
ON public.material_prices(category);

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_id
ON public.profiles(id);

-- =========================================================
-- 6. MARKET INTELLIGENCE FUNCTION
-- =========================================================

CREATE OR REPLACE FUNCTION public.get_market_intelligence()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result jsonb;
    commodity_trends jsonb;
    rising_prices jsonb;
    regional_hotspots jsonb;
    most_wanted jsonb;
BEGIN

    -- =====================================================
    -- COMMODITY TRENDS
    -- Optimized aggregation with CTEs
    -- =====================================================

    WITH recent_rfqs AS (
        SELECT *
        FROM public.rfqs
        WHERE status = 'open'
        AND created_at > now() - interval '30 days'
    ),

    recent_bookings AS (
        SELECT *
        FROM public.bookings
        WHERE status = 'pending'
    ),

    material_demand AS (
        SELECT
            material_grade,
            count(*) as c,
            CASE
                WHEN count(*) > 10 THEN 'High'
                WHEN count(*) > 5 THEN 'Moderate'
                ELSE 'Stable'
            END as demand_level
        FROM recent_rfqs
        GROUP BY material_grade
    ),

    material_supply AS (
        SELECT
            waste_type,
            count(*) as c,
            CASE
                WHEN count(*) > 10 THEN 'High'
                WHEN count(*) > 5 THEN 'Moderate'
                ELSE 'Stable'
            END as supply_level
        FROM recent_bookings
        GROUP BY waste_type
    ),

    buyer_counts AS (
        SELECT
            r.material_grade,
            p.company_name,
            count(*) as c
        FROM public.fulfillment_orders fo
        JOIN public.profiles p
            ON fo.buyer_id = p.id
        JOIN public.rfqs r
            ON fo.rfq_id = r.id
        GROUP BY r.material_grade, p.company_name
    ),

    top_buyers AS (
        SELECT
            material_grade,
            company_name
        FROM (
            SELECT
                material_grade,
                company_name,
                row_number() OVER (
                    PARTITION BY material_grade
                    ORDER BY c DESC
                ) as rn
            FROM buyer_counts
        ) ranked
        WHERE rn = 1
    ),

    region_counts AS (
        SELECT
            material_grade,
            pickup_area,
            count(*) as c
        FROM recent_rfqs
        GROUP BY material_grade, pickup_area
    ),

    top_regions AS (
        SELECT
            material_grade,
            pickup_area
        FROM (
            SELECT
                material_grade,
                pickup_area,
                row_number() OVER (
                    PARTITION BY material_grade
                    ORDER BY c DESC
                ) as rn
            FROM region_counts
        ) ranked
        WHERE rn = 1
    )

    SELECT jsonb_agg(
        jsonb_build_object(
            'id', LOWER(REPLACE(m.material_name, ' ', '_')),
            'label', m.material_name,
            'category', m.category,
            'price', m.price_per_kg,
            'change', '0%',
            'trend', 'stable',

            'demand',
            COALESCE(md.demand_level, 'Stable'),

            'supply',
            COALESCE(ms.supply_level, 'Stable'),

            'topBuyer',
            COALESCE(tb.company_name, 'Market Buyers'),

            'region',
            COALESCE(tr.pickup_area, 'Nairobi')
        )
    )
    INTO commodity_trends
    FROM public.material_prices m
    LEFT JOIN material_demand md
        ON md.material_grade = m.material_name
    LEFT JOIN material_supply ms
        ON ms.waste_type = m.category
    LEFT JOIN top_buyers tb
        ON tb.material_grade = m.material_name
    LEFT JOIN top_regions tr
        ON tr.material_grade = m.material_name;

    -- =====================================================
    -- RISING PRICES
    -- =====================================================

    SELECT jsonb_agg(
        jsonb_build_object(
            'material', mp.material_name,
            'status', 'Consistently high value',
            'text', 'This material maintains a strong base price across the ecosystem.',
            'badge', '+ KSh 0.00/kg'
        )
    )
    INTO rising_prices
    FROM (
        SELECT material_name
        FROM public.material_prices
        ORDER BY price_per_kg DESC
        LIMIT 2
    ) mp;

    -- =====================================================
    -- REGIONAL HOTSPOTS
    -- =====================================================

    SELECT jsonb_agg(
        jsonb_build_object(
            'material', 'General Waste',
            'status', 'High volume of requests',
            'text', 'Strong demand and supply flowing from this region.',
            'badge', area
        )
    )
    INTO regional_hotspots
    FROM (
        SELECT
            area,
            count(*) as c
        FROM (
            SELECT pickup_area as area
            FROM public.rfqs
            WHERE status = 'open'

            UNION ALL

            SELECT 'Nairobi' as area
            FROM public.bookings
            WHERE status = 'pending'
        ) all_areas
        GROUP BY area
        ORDER BY c DESC
        LIMIT 2
    ) hotspot_areas;

    -- =====================================================
    -- MOST WANTED TODAY
    -- =====================================================

    SELECT jsonb_agg(
        jsonb_build_object(
            'material', r.material_grade,
            'status', 'Highly popular today',
            'text', 'Buyers are actively seeking this material right now.',
            'badge', r.category
        )
    )
    INTO most_wanted
    FROM (
        SELECT
            material_grade,
            category,
            count(*) as req_count
        FROM public.rfqs
        WHERE status = 'open'
        GROUP BY material_grade, category
        ORDER BY req_count DESC
        LIMIT 2
    ) r;

    -- =====================================================
    -- SAFE FALLBACKS
    -- =====================================================

    IF most_wanted IS NULL THEN
        most_wanted :=
        '[
            {
                "material":"PET Plastic",
                "status":"Steady demand",
                "text":"Consistent demand from local recyclers.",
                "badge":"Plastics"
            },
            {
                "material":"Cardboard",
                "status":"Steady demand",
                "text":"High volume needed for packaging.",
                "badge":"Paper"
            }
        ]'::jsonb;
    END IF;

    IF regional_hotspots IS NULL THEN
        regional_hotspots :=
        '[
            {
                "material":"General",
                "status":"Active Region",
                "text":"High activity noted here.",
                "badge":"Nairobi"
            },
            {
                "material":"General",
                "status":"Active Region",
                "text":"High activity noted here.",
                "badge":"Mombasa"
            }
        ]'::jsonb;
    END IF;

    -- =====================================================
    -- FINAL RESPONSE
    -- =====================================================

    result := jsonb_build_object(

        'commodity_trends',
        COALESCE(commodity_trends, '[]'::jsonb),

        'ai_trends',
        jsonb_build_array(

            jsonb_build_object(
                'title', 'Rising Prices',
                'tagline', 'Materials that hold high value',
                'color', 'emerald',
                'items', COALESCE(rising_prices, '[]'::jsonb)
            ),

            jsonb_build_object(
                'title', 'Regional Hotspots',
                'tagline', 'Places where buyers are looking to buy now',
                'color', 'indigo',
                'items', COALESCE(regional_hotspots, '[]'::jsonb)
            ),

            jsonb_build_object(
                'title', 'Most Wanted Today',
                'tagline', 'What buyers are searching for on the hub',
                'color', 'amber',
                'items', COALESCE(most_wanted, '[]'::jsonb)
            )
        )
    );

    RETURN result;

END;
$$;

-- =========================================================
-- 7. GRANT EXECUTION
-- =========================================================

GRANT EXECUTE
ON FUNCTION public.get_market_intelligence()
TO authenticated;

COMMIT;