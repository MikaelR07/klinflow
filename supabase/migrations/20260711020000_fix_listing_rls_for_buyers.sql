-- Drop the problematic policy that causes infinite recursion between
-- marketplace_listings and marketplace_orders RLS policies.
DROP POLICY IF EXISTS "Buyers can view listings they ordered" ON public.marketplace_listings;

-- Instead, create a SECURITY DEFINER function that bypasses RLS to fetch
-- listing photos for a given set of listing IDs. This avoids the circular
-- RLS dependency entirely.
CREATE OR REPLACE FUNCTION public.get_listing_photos(p_listing_ids uuid[])
RETURNS TABLE(id uuid, photo_url text, location text)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT ml.id, ml.photo_url, ml.location
  FROM public.marketplace_listings ml
  WHERE ml.id = ANY(p_listing_ids);
$$;
