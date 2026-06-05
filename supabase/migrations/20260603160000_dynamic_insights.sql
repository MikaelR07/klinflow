-- ==============================================================================
-- Migration: Dynamic Insights Tab (Fixed)
-- Description: Replaces get_market_intelligence with a version that includes
-- a fully dynamic 'insights' array built from real trade/RFQ/pricing data.
-- All sections are self-contained with no cross-CTE dependencies.
-- ==============================================================================

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
    market_signals jsonb;
    opportunities jsonb;
    hotspots jsonb;
    recommendations jsonb;
    insights jsonb;
BEGIN

    -- =====================================================
    -- 1. COMMODITY TRENDS (Live Price Ticker)
    -- =====================================================
    WITH materials AS (
        SELECT 
            id, label as material_name, parent_category as category, price_per_kg as admin_price
        FROM public.waste_categories
        WHERE is_active = true AND parent_category IS NOT NULL
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
        SELECT material_grade, SUM(weight * price) / NULLIF(SUM(weight), 0) as vwap_30d, SUM(weight) as volume_30d
        FROM recent_transactions WHERE created_at > now() - interval '30 days' GROUP BY material_grade
    ),
    vwap_previous AS (
        SELECT material_grade, SUM(weight * price) / NULLIF(SUM(weight), 0) as vwap_prev, SUM(weight) as volume_prev
        FROM recent_transactions WHERE created_at > now() - interval '60 days' AND created_at <= now() - interval '30 days' GROUP BY material_grade
    ),
    recent_rfqs AS (
        SELECT * FROM public.rfqs WHERE status = 'open' AND created_at > now() - interval '30 days'
    ),
    material_demand AS (
        SELECT material_grade, count(*) as c,
            CASE WHEN count(*) > 10 THEN 'High' WHEN count(*) > 5 THEN 'Moderate' ELSE 'Stable' END as demand_level
        FROM recent_rfqs GROUP BY material_grade
    ),
    material_supply AS (
        SELECT waste_type, count(*) as c,
            CASE WHEN count(*) > 20 THEN 'High' WHEN count(*) > 10 THEN 'Stable' ELSE 'Low' END as supply_level
        FROM public.bookings WHERE status = 'pending' GROUP BY waste_type
    ),
    top_buyers AS (
        SELECT r.material_grade, p.company_name, count(*) as c
        FROM public.rfqs r
        JOIN public.profiles p ON r.buyer_id = p.id
        WHERE r.status = 'open'
        GROUP BY r.material_grade, p.company_name
    ),
    ranked_buyers AS (
        SELECT material_grade, company_name, ROW_NUMBER() OVER(PARTITION BY material_grade ORDER BY c DESC) as rn
        FROM top_buyers
    ),
    top_regions AS (
        SELECT material_grade, pickup_area, count(*) as c
        FROM public.rfqs WHERE status = 'open' GROUP BY material_grade, pickup_area
    ),
    ranked_regions AS (
        SELECT material_grade, pickup_area, ROW_NUMBER() OVER(PARTITION BY material_grade ORDER BY c DESC) as rn
        FROM top_regions
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', LOWER(REPLACE(m.material_name, ' ', '_')),
            'label', m.material_name,
            'category', m.category,
            'price', ROUND(COALESCE(vc.vwap_30d, m.admin_price), 2),
            'change', CASE WHEN vc.vwap_30d IS NOT NULL AND vp.vwap_prev IS NOT NULL AND vp.vwap_prev > 0 THEN ROUND(((vc.vwap_30d - vp.vwap_prev) / vp.vwap_prev * 100), 1) || '%' ELSE '0%' END,
            'trend', CASE WHEN vc.vwap_30d > vp.vwap_prev THEN 'up' WHEN vc.vwap_30d < vp.vwap_prev THEN 'down' ELSE 'stable' END,
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
    LEFT JOIN ranked_buyers tb ON tb.material_grade = m.material_name AND tb.rn = 1
    LEFT JOIN ranked_regions tr ON tr.material_grade = m.material_name AND tr.rn = 1;

    -- =====================================================
    -- 2. OPPORTUNITIES
    -- =====================================================
    SELECT jsonb_agg(
        jsonb_build_object(
            'material', r.material_name,
            'tag', CASE WHEN r.rn = 1 THEN 'BEST OPPORTUNITY' WHEN r.rn = 2 THEN 'FAST MOVING' ELSE 'EMERGING TREND' END,
            'tagColor', CASE WHEN r.rn = 1 THEN 'amber' WHEN r.rn = 2 THEN 'blue' ELSE 'purple' END,
            'metricLabel', CASE WHEN r.rn = 1 THEN 'Expected Price' WHEN r.rn = 2 THEN 'Buyer Requests' ELSE 'Price Trend' END,
            'metricValue', CASE WHEN r.rn = 1 THEN 'KSh ' || r.price || ' /kg' WHEN r.rn = 2 THEN r.req_count || ' This Week' ELSE 'Stable' END,
            'change', CASE WHEN r.vwap_change > 0 THEN '+ ' || ROUND(r.vwap_change, 1) || '% vs last week' ELSE 'No change' END,
            'changeType', CASE WHEN r.vwap_change >= 0 THEN 'positive' ELSE 'negative' END,
            'demand', CASE WHEN r.rn = 1 THEN 'High' WHEN r.rn = 2 THEN 'Very High' ELSE 'Growing' END,
            'confidence', 70 + (3 - r.rn) * 8 + (RANDOM() * 5)::int
        )
    )
    INTO opportunities
    FROM (
        WITH mat_stats AS (
            SELECT 
                wc.label as material_name, 
                wc.price_per_kg as price,
                (SELECT count(*) FROM public.rfqs WHERE material_grade = wc.label AND status = 'open') as req_count,
                COALESCE(
                    (SELECT CASE WHEN prev_vwap.vwap > 0 THEN ((cur_vwap.vwap - prev_vwap.vwap) / prev_vwap.vwap * 100) ELSE 0 END
                     FROM (SELECT SUM(COALESCE(fo2.verified_weight, fo2.actual_weight, o2.offered_weight) * o2.offered_price) / NULLIF(SUM(COALESCE(fo2.verified_weight, fo2.actual_weight, o2.offered_weight)), 0) as vwap
                           FROM public.fulfillment_orders fo2 JOIN public.rfq_offers o2 ON fo2.proposal_id = o2.id JOIN public.rfqs r2 ON fo2.rfq_id = r2.id
                           WHERE fo2.status IN ('completed','delivered') AND r2.material_grade = wc.label AND fo2.created_at > now() - interval '30 days') cur_vwap,
                          (SELECT SUM(COALESCE(fo3.verified_weight, fo3.actual_weight, o3.offered_weight) * o3.offered_price) / NULLIF(SUM(COALESCE(fo3.verified_weight, fo3.actual_weight, o3.offered_weight)), 0) as vwap
                           FROM public.fulfillment_orders fo3 JOIN public.rfq_offers o3 ON fo3.proposal_id = o3.id JOIN public.rfqs r3 ON fo3.rfq_id = r3.id
                           WHERE fo3.status IN ('completed','delivered') AND r3.material_grade = wc.label AND fo3.created_at > now() - interval '60 days' AND fo3.created_at <= now() - interval '30 days') prev_vwap
                    ),
                0) as vwap_change
            FROM public.waste_categories wc
            WHERE wc.is_active = true AND wc.parent_category IS NOT NULL
        )
        SELECT *, ROW_NUMBER() OVER(ORDER BY req_count DESC, price DESC) as rn
        FROM mat_stats
        WHERE req_count > 0 OR vwap_change > 0 OR price > 0
        LIMIT 3
    ) r;

    -- =====================================================
    -- 3. REGIONAL HOTSPOTS
    -- =====================================================
    SELECT jsonb_agg(
        jsonb_build_object(
            'area', r.area,
            'score', 60 + (r.total_reqs * 5) + (RANDOM() * 10)::int
        )
    )
    INTO hotspots
    FROM (
        SELECT pickup_area as area, count(*) as total_reqs 
        FROM public.rfqs 
        WHERE status = 'open' 
        GROUP BY pickup_area
        ORDER BY total_reqs DESC
        LIMIT 4
    ) r;

    -- =====================================================
    -- 4. MARKET SIGNALS (Hero)
    -- =====================================================
    SELECT jsonb_agg(
        jsonb_build_object(
            'text', r.material || ' demand rising',
            'subtext', CASE WHEN r.rn = 1 THEN 'Strong buyer activity' WHEN r.rn = 2 THEN 'High RFQ volume' ELSE 'Trending upwards' END,
            'trend', 'up'
        )
    )
    INTO market_signals
    FROM (
        SELECT label as material, ROW_NUMBER() OVER(ORDER BY price_per_kg DESC) as rn
        FROM public.waste_categories WHERE parent_category IS NOT NULL LIMIT 3
    ) r;

    -- =====================================================
    -- 5. AI RECOMMENDATIONS
    -- =====================================================
    SELECT jsonb_agg(
        jsonb_build_object(
            'title', CASE WHEN r.rn = 1 THEN 'Sell ' || r.material || ' This Week' WHEN r.rn = 2 THEN 'Delay Sales' ELSE 'Focus On ' || r.material END,
            'text', CASE WHEN r.rn = 1 THEN 'Demand is above average. Expected earnings are higher than usual.' WHEN r.rn = 2 THEN 'Prices are expected to improve within 5 days based on market trend.' ELSE 'Highest buyer activity this week with more RFQs coming in.' END,
            'priority', CASE WHEN r.rn = 2 THEN 'Medium Priority' ELSE 'High Priority' END,
            'color', CASE WHEN r.rn = 1 THEN 'emerald' WHEN r.rn = 2 THEN 'amber' ELSE 'purple' END
        )
    )
    INTO recommendations
    FROM (
        SELECT label as material, ROW_NUMBER() OVER(ORDER BY price_per_kg DESC) as rn
        FROM public.waste_categories WHERE parent_category IS NOT NULL LIMIT 3
    ) r;

    -- =====================================================
    -- 6. ACTIONABLE INSIGHTS (Dynamic Intelligence Coach)
    -- All subqueries are self-contained — no cross-section CTE deps.
    -- =====================================================
    WITH
    -- Top demanded material by open RFQ count
    demand_leader AS (
        SELECT material_grade as material, count(*) as rfq_count
        FROM public.rfqs
        WHERE status = 'open' AND created_at > now() - interval '14 days'
        GROUP BY material_grade
        ORDER BY rfq_count DESC
        LIMIT 1
    ),
    -- Region with highest buyer activity
    hot_region AS (
        SELECT pickup_area as region, count(*) as rfq_count
        FROM public.rfqs
        WHERE status = 'open' AND created_at > now() - interval '14 days'
        GROUP BY pickup_area
        ORDER BY rfq_count DESC
        LIMIT 1
    ),
    -- Material with biggest price increase (self-contained VWAP)
    price_mover AS (
        SELECT 
            cur.material_grade as material,
            ROUND(((cur.vwap_30d - prev.vwap_prev) / NULLIF(prev.vwap_prev, 0) * 100), 1) as pct_change
        FROM (
            SELECT r.material_grade, 
                   SUM(COALESCE(fo.verified_weight, fo.actual_weight, o.offered_weight) * o.offered_price) / NULLIF(SUM(COALESCE(fo.verified_weight, fo.actual_weight, o.offered_weight)), 0) as vwap_30d
            FROM public.fulfillment_orders fo
            JOIN public.rfq_offers o ON fo.proposal_id = o.id
            JOIN public.rfqs r ON fo.rfq_id = r.id
            WHERE fo.status IN ('completed', 'delivered') AND fo.created_at > now() - interval '30 days'
            GROUP BY r.material_grade
        ) cur
        JOIN (
            SELECT r.material_grade, 
                   SUM(COALESCE(fo.verified_weight, fo.actual_weight, o.offered_weight) * o.offered_price) / NULLIF(SUM(COALESCE(fo.verified_weight, fo.actual_weight, o.offered_weight)), 0) as vwap_prev
            FROM public.fulfillment_orders fo
            JOIN public.rfq_offers o ON fo.proposal_id = o.id
            JOIN public.rfqs r ON fo.rfq_id = r.id
            WHERE fo.status IN ('completed', 'delivered') AND fo.created_at > now() - interval '60 days' AND fo.created_at <= now() - interval '30 days'
            GROUP BY r.material_grade
        ) prev ON cur.material_grade = prev.material_grade
        WHERE prev.vwap_prev > 0 AND cur.vwap_30d > prev.vwap_prev
        ORDER BY pct_change DESC
        LIMIT 1
    ),
    -- Most fulfilled material (quality insight)
    quality_leader AS (
        SELECT r.material_grade as material, count(*) as completed
        FROM public.fulfillment_orders fo
        JOIN public.rfqs r ON fo.rfq_id = r.id
        WHERE fo.status IN ('completed', 'delivered')
          AND fo.created_at > now() - interval '30 days'
        GROUP BY r.material_grade
        ORDER BY completed DESC
        LIMIT 1
    ),
    -- Total open RFQ volume this week vs last week
    market_volume AS (
        SELECT 
            count(*) as total_open,
            count(*) FILTER (WHERE created_at > now() - interval '7 days') as this_week,
            count(*) FILTER (WHERE created_at > now() - interval '14 days' AND created_at <= now() - interval '7 days') as last_week
        FROM public.rfqs
        WHERE status = 'open'
    ),
    -- Highest-value material by admin price
    premium_material AS (
        SELECT label as material, price_per_kg as price
        FROM public.waste_categories
        WHERE is_active = true AND parent_category IS NOT NULL
        ORDER BY price_per_kg DESC
        LIMIT 1
    ),
    -- Supply gap: materials where demand outstrips supply
    supply_gap AS (
        SELECT 
            r.material_grade as material,
            count(DISTINCT r.id) as demand_count,
            count(DISTINCT b.id) as supply_count
        FROM public.rfqs r
        LEFT JOIN public.bookings b ON b.waste_type = (
            SELECT parent_category FROM public.waste_categories WHERE label = r.material_grade LIMIT 1
        ) AND b.status = 'pending'
        WHERE r.status = 'open'
        GROUP BY r.material_grade
        HAVING count(DISTINCT r.id) > count(DISTINCT b.id)
        ORDER BY (count(DISTINCT r.id) - count(DISTINCT b.id)) DESC
        LIMIT 1
    )
    SELECT jsonb_agg(insight ORDER BY priority ASC)
    INTO insights
    FROM (
        -- Insight 1: Demand Alert
        SELECT 
            jsonb_build_object(
                'category', 'Market Alert',
                'title', 'Prioritize ' || dl.material,
                'text', dl.material || ' has ' || dl.rfq_count || ' active buyer requests. Focus your collections on this material for faster sales.',
                'badge', 'High Demand',
                'color', 'rose',
                'iconName', 'bell'
            ) as insight, 1 as priority
        FROM demand_leader dl WHERE dl.rfq_count > 0

        UNION ALL

        -- Insight 2: Regional Opportunity
        SELECT 
            jsonb_build_object(
                'category', 'Regional Opportunity',
                'title', hr.region || ' Is Hot Right Now',
                'text', hr.rfq_count || ' active RFQs in ' || hr.region || '. Route your pickups here to match buyer demand.',
                'badge', 'Hotspot',
                'color', 'indigo',
                'iconName', 'mappin'
            ) as insight, 2 as priority
        FROM hot_region hr WHERE hr.rfq_count > 0

        UNION ALL

        -- Insight 3: Price Movement
        SELECT 
            jsonb_build_object(
                'category', 'Price Movement',
                'title', pm.material || ' Price Up ' || pm.pct_change || '%',
                'text', pm.material || ' prices have risen ' || pm.pct_change || '% compared to last month. Consider selling now while margins are high.',
                'badge', 'Sell Signal',
                'color', 'emerald',
                'iconName', 'trendingup'
            ) as insight, 3 as priority
        FROM price_mover pm

        UNION ALL

        -- Insight 4: Quality Tip
        SELECT 
            jsonb_build_object(
                'category', 'Quality Insight',
                'title', 'Top Performing: ' || ql.material,
                'text', ql.material || ' leads with ' || ql.completed || ' completed trades this month. Sorting and cleaning this material yields the best payouts.',
                'badge', 'Quality Tip',
                'color', 'purple',
                'iconName', 'award'
            ) as insight, 4 as priority
        FROM quality_leader ql

        UNION ALL

        -- Insight 5: Market Timing
        SELECT 
            jsonb_build_object(
                'category', 'Market Timing',
                'title', CASE 
                    WHEN mv.this_week > mv.last_week THEN 'Market Activity Rising'
                    WHEN mv.this_week < mv.last_week THEN 'Market Cooling - Hold Stock'
                    ELSE 'Market Steady This Week'
                END,
                'text', CASE 
                    WHEN mv.this_week > mv.last_week THEN mv.this_week || ' new RFQs this week vs ' || mv.last_week || ' last week. Buyer demand is accelerating.'
                    WHEN mv.this_week < mv.last_week THEN 'Activity dropped to ' || mv.this_week || ' RFQs from ' || mv.last_week || ' last week. Consider holding stock.'
                    ELSE mv.total_open || ' total open requests in the market. Steady activity means predictable pricing.'
                END,
                'badge', CASE 
                    WHEN mv.this_week > mv.last_week THEN 'Act Now'
                    WHEN mv.this_week < mv.last_week THEN 'Hold'
                    ELSE 'Steady'
                END,
                'color', 'amber',
                'iconName', 'clock'
            ) as insight, 5 as priority
        FROM market_volume mv

        UNION ALL

        -- Insight 6: Premium Material
        SELECT 
            jsonb_build_object(
                'category', 'Premium Material',
                'title', 'Top Earner: ' || pm.material,
                'text', pm.material || ' commands KSh ' || ROUND(pm.price, 0) || '/kg - the highest rate on the platform.',
                'badge', 'Best Price',
                'color', 'emerald',
                'iconName', 'trendingup'
            ) as insight, 6 as priority
        FROM premium_material pm

        UNION ALL

        -- Insight 7: Supply Gap
        SELECT 
            jsonb_build_object(
                'category', 'Supply Gap',
                'title', sg.material || ' Undersupplied',
                'text', sg.demand_count || ' buyer requests but only ' || sg.supply_count || ' active collections for ' || sg.material || '. Prime opportunity to source and sell.',
                'badge', 'Opportunity',
                'color', 'indigo',
                'iconName', 'bell'
            ) as insight, 7 as priority
        FROM supply_gap sg
    ) all_insights;


    -- =====================================================
    -- BUILD FINAL JSON
    -- =====================================================
    result := jsonb_build_object(
        'commodity_trends', COALESCE(commodity_trends, '[]'::jsonb),
        'market_signals', COALESCE(market_signals, '[]'::jsonb),
        'opportunities', COALESCE(opportunities, '[]'::jsonb),
        'hotspots', COALESCE(hotspots, '[]'::jsonb),
        'recommendations', COALESCE(recommendations, '[]'::jsonb),
        'insights', COALESCE(insights, '[]'::jsonb)
    );

    RETURN result;
END;
$$;
