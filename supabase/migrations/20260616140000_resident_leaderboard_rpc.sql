-- Migration: 20260616140000_resident_leaderboard_rpc.sql
-- Description: Creates an RPC to accurately fetch the resident leaderboard based on verified weights from bookings.

CREATE OR REPLACE FUNCTION public.get_resident_leaderboard()
RETURNS TABLE (
  user_id UUID,
  name TEXT,
  avatar_url TEXT,
  total_weight DECIMAL,
  rank BIGINT
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT 
    p.id as user_id,
    p.name,
    p.avatar_url,
    COALESCE(SUM(COALESCE(b.actual_weight_kg, b.weight_kg, 0)), 0) as total_weight,
    RANK() OVER (ORDER BY COALESCE(SUM(COALESCE(b.actual_weight_kg, b.weight_kg, 0)), 0) DESC) as rank
  FROM profiles p
  JOIN bookings b ON b.user_id = p.id
  WHERE p.role IN ('user', 'resident', 'client')
    AND b.status = 'completed'
  GROUP BY p.id, p.name, p.avatar_url
  HAVING COALESCE(SUM(COALESCE(b.actual_weight_kg, b.weight_kg, 0)), 0) > 0
  ORDER BY total_weight DESC
  LIMIT 50;
$$;
