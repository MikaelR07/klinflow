-- Migration: Secure Exact Agent Search V2
-- Description: Adds RPC to perform exact matching on independent/fleet agents using 9-digit core phone number.

CREATE OR REPLACE FUNCTION "public"."search_pickup_agent_exact_v2"("p_core_digits" text) 
RETURNS TABLE(
    id uuid,
    full_name text,
    profile_photo text,
    rating numeric,
    completed_pickups integer,
    online boolean,
    agent_type text
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_var1 TEXT;
    v_var2 TEXT;
    v_var3 TEXT;
BEGIN
    -- Protect against short queries just in case (should be exactly 9 digits)
    IF length(p_core_digits) != 9 THEN
        RETURN;
    END IF;

    -- Generate all standard variations for Kenyan numbers
    v_var1 := '0' || p_core_digits;
    v_var2 := '254' || p_core_digits;
    v_var3 := '+254' || p_core_digits;

    RETURN QUERY
    SELECT 
        p.id,
        COALESCE(p.name, 'Agent') as full_name,
        p.avatar_url as profile_photo,
        COALESCE(p.rating, 4.9) as rating,
        (SELECT count(*)::integer FROM bookings b WHERE b.agent_id = p.id AND b.status = 'completed') as completed_pickups,
        COALESCE(p.is_online, false) as online,
        p.agent_account_type as agent_type
    FROM profiles p
    WHERE p.phone IN (v_var1, v_var2, v_var3)
      AND p.role = 'agent'
      AND p.agent_account_type IN ('independent', 'fleet_driver')
    LIMIT 1;
END;
$$;

GRANT ALL ON FUNCTION "public"."search_pickup_agent_exact_v2"("p_core_digits" "text") TO "anon", "authenticated", "service_role";
