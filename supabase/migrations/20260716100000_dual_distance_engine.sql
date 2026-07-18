-- Migration: Dual Distance Engine for Pickups vs Hubs
-- This updates get_nearby_agents_dynamic to calculate pickup_distance_km and hub_distance_km independently.
-- It also adds a p_weight parameter to filter out agents whose capacity does not support the trade weight.

CREATE OR REPLACE FUNCTION get_nearby_agents_dynamic(
    p_lat numeric, 
    p_lng numeric, 
    p_weight numeric DEFAULT 0,
    p_max_results int DEFAULT 50, 
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
            -- Calculate distance from personal profile location (for standard pickups)
            get_distance_km(
                p_lat, 
                p_lng, 
                (location->>'latitude')::numeric, 
                (location->>'longitude')::numeric
            ) as pickup_distance_km,
            
            -- Calculate distance from hub location (for self drop-offs)
            get_distance_km(
                p_lat, 
                p_lng, 
                (hub_location->>'latitude')::numeric, 
                (hub_location->>'longitude')::numeric
            ) as hub_distance_km
        FROM profiles
        WHERE role = 'agent' 
          AND is_online = true
          
          -- Weight / Capacity Filtering
          AND (
            p_weight = 0 OR (
              p_weight >= COALESCE((service_profile->>'min_weight')::numeric, (service_profile->>'minWeight')::numeric, 0)
              AND 
              p_weight <= COALESCE((service_profile->>'max_weight')::numeric, (service_profile->>'maxWeight')::numeric, 999999)
            )
          )

          -- Distance Filtering: Must be within radius for EITHER pickup OR hub
          AND (
            (
              location->>'latitude' IS NOT NULL 
              AND location->>'longitude' IS NOT NULL
              AND get_distance_km(p_lat, p_lng, (location->>'latitude')::numeric, (location->>'longitude')::numeric) <= p_max_radius_km
            )
            OR
            (
              is_hub_active = true
              AND hub_location->>'latitude' IS NOT NULL
              AND hub_location->>'longitude' IS NOT NULL
              AND get_distance_km(p_lat, p_lng, (hub_location->>'latitude')::numeric, (hub_location->>'longitude')::numeric) <= p_max_radius_km
            )
          )
          
        -- Order by the closest distance available
        ORDER BY LEAST(
            COALESCE(get_distance_km(p_lat, p_lng, (location->>'latitude')::numeric, (location->>'longitude')::numeric), 999),
            COALESCE(get_distance_km(p_lat, p_lng, (hub_location->>'latitude')::numeric, (hub_location->>'longitude')::numeric), 999)
        ) ASC
        LIMIT p_max_results
    ) t;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;
