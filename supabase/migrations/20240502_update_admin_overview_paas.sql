-- ── UPDATE: Admin Overview for PaaS Model ────────────────
-- This script updates the get_admin_overview RPC to track 
-- Independent Agents separately from Corporate Tenants (Companies).

CREATE OR REPLACE FUNCTION public.get_admin_overview()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'totalUsers',        (SELECT count(*) FROM public.profiles WHERE role = 'user'),
    
    -- Individual (Independent) Agents
    'activeAgents',       (SELECT count(*) FROM public.profiles WHERE role = 'agent' AND agent_account_type = 'independent' AND is_online = true),
    'registeredAgents',   (SELECT count(*) FROM public.profiles WHERE role = 'agent' AND agent_account_type = 'independent'),
    
    -- Corporate Tenants (Companies)
    'totalCompanies',     (SELECT count(*) FROM public.profiles WHERE agent_account_type = 'company_admin'),
    'activeCompanies',    (SELECT count(*) FROM public.profiles WHERE agent_account_type = 'company_admin' AND is_online = true),
    
    'totalBusinesses',    (SELECT count(*) FROM public.profiles WHERE role = 'business'),
    'freeTierMembers',    (SELECT count(*) FROM public.profiles WHERE subscription_tier = 'lite' AND role = 'user'),
    'standardMembers',    (SELECT count(*) FROM public.profiles WHERE subscription_tier = 'standard' AND role = 'user'),
    'premiumMembers',     (SELECT count(*) FROM public.profiles WHERE subscription_tier = 'premium' AND role = 'user'),
    
    -- Total Gross Weight Collected (Global)
    'totalWeight',        COALESCE((SELECT sum(actual_weight_kg) FROM public.bookings WHERE status = 'completed'), 0),
    
    -- Weight by Entity Type
    'indAgentWeight',     COALESCE((
      SELECT sum(b.actual_weight_kg) 
      FROM public.bookings b 
      JOIN public.profiles p ON b.agent_id = p.id 
      WHERE p.agent_account_type = 'independent' AND b.status = 'completed'
    ), 0),
    'companyWeight',      COALESCE((
      SELECT sum(b.actual_weight_kg) 
      FROM public.bookings b 
      JOIN public.profiles p ON b.agent_id = p.id 
      WHERE p.agent_account_type = 'fleet_driver' AND b.status = 'completed'
    ), 0),

    -- NEW: Service Envelope Analytics (PaaS Monitoring)
    'avgMinWeight',       COALESCE((SELECT AVG((service_profile->>'min_weight')::numeric) FROM public.profiles WHERE service_profile IS NOT NULL AND role = 'agent'), 0),
    'avgMaxCapacity',     COALESCE((SELECT AVG((service_profile->>'max_weight')::numeric) FROM public.profiles WHERE service_profile IS NOT NULL AND role = 'agent'), 0),
    
    -- Total Gross Sales
    'totalRevenue',       COALESCE((SELECT sum(fee) FROM public.bookings WHERE status = 'completed'), 0) + 
                          COALESCE((SELECT sum(total_price) FROM public.marketplace_orders WHERE status IN ('completed', 'funds_released')), 0),
    
    -- Subscription Revenue
    'subscriptionRevenue', COALESCE((SELECT sum(CASE 
                                WHEN subscription_tier = 'standard' THEN 500 
                                WHEN subscription_tier = 'premium' THEN 1500 
                                ELSE 0 END) FROM public.profiles), 0),
    
    -- Platform Net Commissions (20%)
    'commissionRevenue',  COALESCE((SELECT sum(fee * 0.20) FROM public.bookings WHERE status = 'completed'), 0) +
                          COALESCE((SELECT sum(total_price * 0.20) FROM public.marketplace_orders WHERE status IN ('completed', 'funds_released')), 0),
    
    -- Total Liabilities (User Wallet Balances)
    'rewardsLiabilities', COALESCE((SELECT sum(wallet_balance) FROM public.profiles), 0),
    
    -- Operations
    'pendingJobs',        (SELECT count(*) FROM public.bookings WHERE status = 'pending')
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
