-- Migration: fix_admin_overview_revenue.sql
-- Description: Updates the admin overview RPC to correctly calculate total collected revenue (fees + commissions + subscriptions)

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
    
    'totalWeight',        COALESCE((SELECT sum(actual_weight_kg) FROM public.bookings WHERE status = 'completed'), 0),
    'completedJobs',      (SELECT count(*) FROM public.bookings WHERE status = 'completed'),
    
    -- totalRevenue is now GMV (Gross Merchandise Value) = sum(estimated_value) + sum(total_price)
    'totalRevenue',       COALESCE((SELECT sum(actual_weight_kg * 10) FROM public.bookings WHERE status = 'completed'), 0) + 
                          COALESCE((SELECT sum(total_price) FROM public.marketplace_orders WHERE status IN ('completed', 'funds_released')), 0),
    
    'subscriptionRevenue', COALESCE((SELECT sum(CASE 
                                WHEN subscription_tier = 'standard' THEN 500 
                                WHEN subscription_tier = 'premium' THEN 1500 
                                ELSE 0 END) FROM public.profiles), 0),
                                
    -- commissionRevenue is now NET REVENUE = Booking Fees (10%) + Marketplace Commissions (10%)
    'commissionRevenue',  COALESCE((SELECT sum(fee) FROM public.bookings WHERE status = 'completed'), 0) + 
                          COALESCE((SELECT sum(total_price * 0.1) FROM public.marketplace_orders WHERE status IN ('completed', 'funds_released')), 0)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
