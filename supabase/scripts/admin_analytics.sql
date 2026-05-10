-- ════════════════════════════════════════════════════════════════
-- CLEANFLOW ADMIN ANALYTICS — Production RPC Layer
-- Run this in Supabase SQL Editor to deploy all admin functions.
-- ════════════════════════════════════════════════════════════════

-- 1. OVERVIEW STATS
-- Returns a master snapshot of system health
DROP FUNCTION IF EXISTS get_admin_overview();
CREATE OR REPLACE FUNCTION get_admin_overview()
RETURNS JSONB AS $$
DECLARE
  v_users         INTEGER;
  v_active_agents INTEGER;
  v_reg_agents    INTEGER;
  v_businesses    INTEGER;
  v_revenue       NUMERIC(12,2);
  v_tonnage       NUMERIC(12,2);
  v_pending       INTEGER;
  v_rewards       NUMERIC(12,2);
  v_premium       INTEGER;
  v_standard      INTEGER;
  v_free          INTEGER;
  v_pickup_rev    NUMERIC(12,2);
  v_sub_rev       NUMERIC(12,2);
  v_commission    NUMERIC(12,2);
BEGIN
  v_users := (SELECT count(*) FROM public.profiles WHERE role = 'user');
  v_active_agents := (SELECT count(*) FROM public.profiles WHERE role = 'agent' AND is_online = true);
  v_reg_agents := (SELECT count(*) FROM public.profiles WHERE role = 'agent');
  v_businesses := (SELECT count(*) FROM public.profiles WHERE role = 'business');
  
  v_pickup_rev := (SELECT COALESCE(sum(fee), 0) FROM public.bookings WHERE status = 'completed');
  v_tonnage := (SELECT COALESCE(sum(actual_weight_kg), 0) FROM public.bookings WHERE status = 'completed');
  v_pending := (SELECT count(*) FROM public.bookings WHERE status NOT IN ('completed', 'cancelled'));
  v_rewards := (SELECT COALESCE(sum(wallet_balance), 0) FROM public.profiles);
  
  -- Subscription metrics (Filtered to only count customers)
  v_premium := (SELECT count(*) FROM public.profiles WHERE role = 'user' AND subscription_tier = 'premium');
  v_standard := (SELECT count(*) FROM public.profiles WHERE role = 'user' AND subscription_tier = 'standard');
  v_free := (SELECT count(*) FROM public.profiles WHERE role = 'user' AND subscription_tier = 'lite');

  -- Mathematical Derivations
  v_sub_rev := (v_standard * 1200) + (v_premium * 2500);
  v_commission := v_pickup_rev * 0.20; -- Platform takes 20%
  v_revenue := v_pickup_rev + v_sub_rev;

  RETURN jsonb_build_object(
    'totalUsers', v_users,
    'activeAgents', v_active_agents,
    'registeredAgents', v_reg_agents,
    'totalBusinesses', v_businesses,
    'totalRevenue', v_revenue,
    'subscriptionRevenue', v_sub_rev,
    'commissionRevenue', v_commission,
    'totalWeight', v_tonnage,
    'pendingJobs', v_pending,
    'rewardsLiabilities', v_rewards,
    'premiumMembers', v_premium,
    'standardMembers', v_standard,
    'freeTierMembers', v_free
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. REVENUE & GROWTH TRENDS
-- Returns last 6 months of earnings
DROP FUNCTION IF EXISTS get_revenue_trends();
CREATE OR REPLACE FUNCTION get_revenue_trends()
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(t)
    FROM (
      SELECT 
        to_char(date_trunc('month', updated_at), 'Mon') as month,
        sum(fee) as revenue,
        count(*) as bookings
      FROM public.bookings
      WHERE status = 'completed' 
        AND updated_at >= NOW() - INTERVAL '6 months'
      GROUP BY date_trunc('month', updated_at)
      ORDER BY date_trunc('month', updated_at)
    ) t
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. MATERIAL DISTRIBUTION (TOP 5)
-- Returns the top 5 materials collected
DROP FUNCTION IF EXISTS get_material_distribution();
CREATE OR REPLACE FUNCTION get_material_distribution()
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(t)
    FROM (
      SELECT 
        waste_type as name,
        sum(actual_weight_kg) as value
      FROM public.bookings
      WHERE status = 'completed'
      GROUP BY waste_type
      ORDER BY value DESC
      LIMIT 5
    ) t
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. HIGH ALERT MONITORING
-- Finds bookings pending for more than 24 hours
DROP FUNCTION IF EXISTS get_high_alert_bookings();
CREATE OR REPLACE FUNCTION get_high_alert_bookings()
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(t)
    FROM (
      SELECT 
        b.id,
        p.name as customer_name,
        b.waste_type,
        b.created_at,
        EXTRACT(EPOCH FROM (NOW() - b.created_at))/3600 as hours_pending
      FROM public.bookings b
      JOIN public.profiles p ON b.user_id = p.id
      WHERE b.status = 'pending' 
        AND b.created_at < NOW() - INTERVAL '24 hours'
      ORDER BY b.created_at ASC
      LIMIT 10
    ) t
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
