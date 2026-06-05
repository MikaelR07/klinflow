-- =========================================================
-- Migration: 20260603110000_market_intelligence_vwap.sql
-- Description:
-- Updates get_market_intelligence to use waste_categories
-- and calculate Volume-Weighted Average Price (VWAP)
-- =========================================================

-- (No explicit transaction — Supabase SQL Editor handles this automatically)

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
    -- COMMODITY TRENDS WITH VWAP
    -- =====================================================

    WITH materials AS (
        SELECT 
            id, 
            label as material_name, 
            parent_category as category, 
            price_per_kg as admin_price
        FROM public.waste_categories
        WHERE is_active = true 
          AND parent_category IS NOT NULL
    ),
    
    recent_transactions AS (
        SELECT 
            r.material_grade,
            COALESCE(fo.verified_weight, fo.actual_weight, o.offered_weight) as weight,
            o.offered_price as price,
            fo.created_at
        FROM public.fulfillment_orders fo
        JOIN public.rfq_offers o ON fo.proposal_id = o.id
        JOIN public.rfqs r ON fo.rfq_id = r.id
        WHERE fo.status IN ('completed', 'delivered')
    ),

    vwap_current AS (
        SELECT 
            material_grade,
            SUM(weight * price) / NULLIF(SUM(weight), 0) as vwap_30d,
            SUM(weight) as volume_30d
        FROM recent_transactions
        WHERE created_at > now() - interval '30 days'
        GROUP BY material_grade
    ),
    
    vwap_previous AS (
        SELECT 
            material_grade,
            SUM(weight * price) / NULLIF(SUM(weight), 0) as vwap_prev,
            SUM(weight) as volume_prev
        FROM recent_transactions
        WHERE created_at > now() - interval '60 days' 
          AND created_at <= now() - interval '30 days'
        GROUP BY material_grade
    ),

    recent_rfqs AS (
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
            'price', ROUND(COALESCE(vc.vwap_30d, m.admin_price), 2),
            'change', 
                CASE 
                    WHEN vc.vwap_30d IS NOT NULL AND vp.vwap_prev IS NOT NULL AND vp.vwap_prev > 0 THEN
                        ROUND(((vc.vwap_30d - vp.vwap_prev) / vp.vwap_prev * 100), 1) || '%'
                    ELSE '0%'
                END,
            'trend', 
                CASE
                    WHEN vc.vwap_30d > vp.vwap_prev THEN 'up'
                    WHEN vc.vwap_30d < vp.vwap_prev THEN 'down'
                    ELSE 'stable'
                END,

            'demand', COALESCE(md.demand_level, 'Stable'),
            'supply', COALESCE(ms.supply_level, 'Stable'),
            'topBuyer', COALESCE(tb.company_name, 'Market Buyers'),
            'region', COALESCE(tr.pickup_area, 'Nairobi')
        ) ORDER BY m.material_name ASC
    )
    INTO commodity_trends
    FROM materials m
    LEFT JOIN vwap_current vc ON vc.material_grade = m.material_name
    LEFT JOIN vwap_previous vp ON vp.material_grade = m.material_name
    LEFT JOIN material_demand md ON md.material_grade = m.material_name
    LEFT JOIN material_supply ms ON ms.waste_type = m.category
    LEFT JOIN top_buyers tb ON tb.material_grade = m.material_name
    LEFT JOIN top_regions tr ON tr.material_grade = m.material_name;

    -- =====================================================
    -- RISING PRICES
    -- =====================================================

    SELECT jsonb_agg(
        jsonb_build_object(
            'material', r.label,
            'status', 'Consistently high value',
            'text', 'This material maintains a strong base price across the ecosystem.',
            'badge', '+ KSh 0.00/kg'
        )
    )
    INTO rising_prices
    FROM (
        SELECT wc.label, wc.price_per_kg
        FROM public.waste_categories wc
        WHERE wc.is_active = true AND wc.parent_category IS NOT NULL
        ORDER BY wc.price_per_kg DESC
        LIMIT 2
    ) r;

    -- =====================================================
    -- REGIONAL HOTSPOTS
    -- =====================================================

    SELECT jsonb_agg(
        jsonb_build_object(
            'material', 'General Waste',
            'status', 'High volume of requests',
            'text', 'Strong demand and supply flowing from this region.',
            'badge', hotspot_areas.area
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

GRANT EXECUTE ON FUNCTION public.get_market_intelligence() TO authenticated;
-- Done.
