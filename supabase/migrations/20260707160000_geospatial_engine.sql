-- Migration: Geospatial Engine using pure PostgreSQL Haversine calculation
-- This avoids requiring PostGIS while still being 1000x faster than downloading to the client.

-- 1. Create the Haversine Distance Function
CREATE OR REPLACE FUNCTION get_distance_km(lat1 numeric, lon1 numeric, lat2 numeric, lon2 numeric)
RETURNS numeric AS $$
DECLARE
    R numeric := 6371; -- Earth radius in kilometers
    dLat numeric := radians(lat2 - lat1);
    dLon numeric := radians(lon2 - lon1);
    a numeric := sin(dLat / 2) * sin(dLat / 2) +
                 cos(radians(lat1)) * cos(radians(lat2)) *
                 sin(dLon / 2) * sin(dLon / 2);
    c numeric := 2 * atan2(sqrt(a), sqrt(1 - a));
BEGIN
    RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Create the RPC to find nearby agents and return as JSON
CREATE OR REPLACE FUNCTION get_nearby_agents_dynamic(
    p_lat numeric, 
    p_lng numeric, 
    p_max_results int DEFAULT 15, 
    p_max_radius_km numeric DEFAULT 50
)
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    SELECT COALESCE(json_agg(t), '[]'::json) INTO result
    FROM (
        SELECT 
            *, 
            get_distance_km(
                p_lat, 
                p_lng, 
                (location->>'latitude')::numeric, 
                (location->>'longitude')::numeric
            ) as distance_km
        FROM profiles
        WHERE role = 'agent' 
          AND is_online = true
          AND location IS NOT NULL
          AND location->>'latitude' IS NOT NULL
          AND location->>'longitude' IS NOT NULL
          AND get_distance_km(
                p_lat, 
                p_lng, 
                (location->>'latitude')::numeric, 
                (location->>'longitude')::numeric
              ) <= p_max_radius_km
        ORDER BY distance_km ASC
        LIMIT p_max_results
    ) t;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;
