-- RUN THIS IN YOUR SUPABASE SQL EDITOR

-- 1. Update disputes table
ALTER TABLE public.disputes ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE;
ALTER TABLE public.disputes ALTER COLUMN fulfillment_id DROP NOT NULL;

-- 2. Update get_company_stats_v2 to include yesterday's metrics and payout/revenue in weekly data
CREATE OR REPLACE FUNCTION public.get_company_stats_v2(p_company_id UUID)
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
  WHERE id = p_company_id;

  -- 2. Determine which IDs to aggregate
  IF COALESCE(v_is_owner, false) THEN
    -- If owner, aggregate their own data plus all their fleet drivers
    SELECT COALESCE(array_agg(id), ARRAY[p_company_id]::UUID[]) INTO v_driver_ids 
    FROM public.profiles 
    WHERE company_id = p_company_id OR id = p_company_id;
  ELSE
    -- If individual agent or fleet driver, ONLY aggregate their own data
    v_driver_ids := ARRAY[p_company_id];
  END IF;

  -- 3. Calculate Aggregated Metrics
  SELECT json_build_object(
    -- Financials
    'total',             COALESCE((SELECT sum(total_price) FROM public.bookings WHERE agent_id = ANY(v_driver_ids) AND status = 'completed'), 0),
    'todayPayout',       COALESCE((SELECT sum(total_price) FROM public.bookings WHERE agent_id = ANY(v_driver_ids) AND status = 'completed' AND updated_at::date = CURRENT_DATE), 0),
    'yesterdayPayout',   COALESCE((SELECT sum(total_price) FROM public.bookings WHERE agent_id = ANY(v_driver_ids) AND status = 'completed' AND updated_at::date = CURRENT_DATE - 1), 0),
    'inventoryValue',    COALESCE((SELECT sum(estimated_value) FROM public.assets WHERE verifier_id = ANY(v_driver_ids)), 0),
    
    -- Volume & Counts
    'totalJobs',         (SELECT count(*) FROM public.bookings WHERE agent_id = ANY(v_driver_ids) AND status = 'completed'),
    'completedToday',    (SELECT count(*) FROM public.bookings WHERE agent_id = ANY(v_driver_ids) AND status = 'completed' AND updated_at::date = CURRENT_DATE),
    'yesterdayJobs',     (SELECT count(*) FROM public.bookings WHERE agent_id = ANY(v_driver_ids) AND status = 'completed' AND updated_at::date = CURRENT_DATE - 1),
    
    -- Weight Tracking
    'totalKgRecovered',  COALESCE((SELECT sum(weight_kg) FROM public.assets WHERE verifier_id = ANY(v_driver_ids)), 0),
    'todayKg',           COALESCE((SELECT sum(weight_kg) FROM public.assets WHERE verifier_id = ANY(v_driver_ids) AND created_at::date = CURRENT_DATE), 0),
    'yesterdayKg',       COALESCE((SELECT sum(weight_kg) FROM public.assets WHERE verifier_id = ANY(v_driver_ids) AND created_at::date = CURRENT_DATE - 1), 0),
    'thisWeekKg',        COALESCE((SELECT sum(weight_kg) FROM public.assets WHERE verifier_id = ANY(v_driver_ids) AND created_at::date >= v_week_start), 0),
    
    -- Weekly Chart Data (Mon to Sun)
    'weeklyData',        (
                           SELECT json_agg(d) FROM (
                             SELECT 
                               TO_CHAR(days.day, 'Dy') as day,
                               COALESCE(sum(a.weight_kg), 0) as weight,
                               COALESCE(sum(b.fee), 0) as payout,
                               COALESCE(sum(b.total_price), 0) as revenue
                             FROM generate_series(v_week_start, v_week_start + 6, '1 day'::interval) as days(day)
                             LEFT JOIN public.assets a ON a.created_at::date = days.day AND a.verifier_id = ANY(v_driver_ids)
                             LEFT JOIN public.bookings b ON b.updated_at::date = days.day AND b.agent_id = ANY(v_driver_ids) AND b.status = 'completed'
                             GROUP BY days.day
                             ORDER BY days.day
                           ) d
                         )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Add fields to company_join_requests for the Onboarding Requests dashboard
ALTER TABLE public.company_join_requests 
  ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS application_score INTEGER DEFAULT 0 CHECK (application_score >= 0 AND application_score <= 100),
  ADD COLUMN IF NOT EXISTS documents_complete INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS documents_required INTEGER DEFAULT 6,
  ADD COLUMN IF NOT EXISTS references_verified INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS references_total INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- 4. Dynamic Document Requirements
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS required_documents JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.company_join_requests ADD COLUMN IF NOT EXISTS submitted_documents JSONB DEFAULT '{}'::jsonb;

-- Create Storage Bucket for Agent Documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'agent_documents', 
  'agent_documents', 
  true, -- Using public for easier viewing by admins without signed URLs, but files are obscurely named
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'application/pdf']::text[]
) ON CONFLICT (id) DO UPDATE SET 
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

