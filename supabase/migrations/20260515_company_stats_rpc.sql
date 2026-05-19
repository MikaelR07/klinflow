-- Migration: company_stats_rpc.sql
-- Description: Adds an RPC to calculate company/fleet financial metrics on the backend.
-- Fix: Explicitly check if the user is an owner. If not, only return their own data.
-- This prevents fleet drivers from seeing company-wide stats on their personal earnings page.

CREATE OR REPLACE FUNCTION public.get_company_stats_v2(p_user_id UUID)
RETURNS json AS $$
DECLARE
  result json;
  v_driver_ids UUID[];
  v_is_owner BOOLEAN;
  v_week_start DATE := date_trunc('week', CURRENT_DATE)::DATE;
BEGIN
  -- 1. Check if the user is an owner or company admin
  SELECT (agent_account_type IN ('company_admin', 'owner')) INTO v_is_owner
  FROM public.profiles
  WHERE id = p_user_id;

  -- 2. Determine which IDs to aggregate
  IF COALESCE(v_is_owner, false) THEN
    -- If owner, aggregate their own data plus all their fleet drivers
    SELECT COALESCE(array_agg(id), ARRAY[p_user_id]::UUID[]) INTO v_driver_ids 
    FROM public.profiles 
    WHERE company_id = p_user_id OR id = p_user_id;
  ELSE
    -- If individual agent or fleet driver, ONLY aggregate their own data
    v_driver_ids := ARRAY[p_user_id];
  END IF;

  -- 3. Calculate Aggregated Metrics
  SELECT json_build_object(
    -- Financials
    'total',             COALESCE((SELECT sum(total_price) FROM public.bookings WHERE agent_id = ANY(v_driver_ids) AND status = 'completed'), 0),
    'todayPayout',       COALESCE((SELECT sum(total_price) FROM public.bookings WHERE agent_id = ANY(v_driver_ids) AND status = 'completed' AND updated_at::date = CURRENT_DATE), 0),
    'inventoryValue',    COALESCE((SELECT sum(estimated_value) FROM public.assets WHERE verifier_id = ANY(v_driver_ids)), 0),
    
    -- Volume & Counts
    'totalJobs',         (SELECT count(*) FROM public.bookings WHERE agent_id = ANY(v_driver_ids) AND status = 'completed'),
    'completedToday',    (SELECT count(*) FROM public.bookings WHERE agent_id = ANY(v_driver_ids) AND status = 'completed' AND updated_at::date = CURRENT_DATE),
    
    -- Weight Tracking
    'totalKgRecovered',  COALESCE((SELECT sum(weight_kg) FROM public.assets WHERE verifier_id = ANY(v_driver_ids)), 0),
    'todayKg',           COALESCE((SELECT sum(weight_kg) FROM public.assets WHERE verifier_id = ANY(v_driver_ids) AND created_at::date = CURRENT_DATE), 0),
    'thisWeekKg',        COALESCE((SELECT sum(weight_kg) FROM public.assets WHERE verifier_id = ANY(v_driver_ids) AND created_at::date >= v_week_start), 0),
    
    -- Weekly Chart Data (Mon to Sun)
    'weeklyData',        (
                           SELECT json_agg(d) FROM (
                             SELECT 
                               TO_CHAR(days.day, 'Dy') as day,
                               COALESCE(sum(a.weight_kg), 0) as weight
                             FROM generate_series(v_week_start, v_week_start + 6, '1 day'::interval) as days(day)
                             LEFT JOIN public.assets a ON a.created_at::date = days.day AND a.verifier_id = ANY(v_driver_ids)
                             GROUP BY days.day
                             ORDER BY days.day
                           ) d
                         )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
