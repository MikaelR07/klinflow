-- ════════════════════════════════════════════════════════════════
-- CLEANFLOW B2B MARKETPLACE SCHEMA
-- Run this in the Supabase SQL editor to enable the marketplace.
-- ════════════════════════════════════════════════════════════════

-- ── MARKETPLACE LISTINGS TABLE ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Core fields
  material       TEXT NOT NULL,
  quantity       NUMERIC(10, 2) NOT NULL,
  price_per_kg   NUMERIC(10, 2) NOT NULL,
  description    TEXT,
  location       TEXT,

  -- Media
  photo_url      TEXT DEFAULT 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=800',

  -- Engagement
  views          INTEGER DEFAULT 0,
  offers         INTEGER DEFAULT 0,
  ai_match_score INTEGER DEFAULT 90,

  -- Status: active | sold | expired | cancelled
  status         TEXT NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active', 'sold', 'expired', 'cancelled')),

  expires_at     TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read active listings
CREATE POLICY "listings_read_active"
  ON public.marketplace_listings FOR SELECT
  USING (status = 'active' OR seller_id = auth.uid());

-- Only the seller can insert
CREATE POLICY "listings_insert_own"
  ON public.marketplace_listings FOR INSERT
  WITH CHECK (seller_id = auth.uid());

-- Only the seller can update their own listing
CREATE POLICY "listings_update_own"
  ON public.marketplace_listings FOR UPDATE
  USING (seller_id = auth.uid());

-- ── MARKETPLACE ORDERS TABLE ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.marketplace_orders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id   UUID NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  buyer_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Purchase details
  material     TEXT NOT NULL,
  quantity     NUMERIC(10, 2) NOT NULL,
  unit_price   NUMERIC(10, 2) NOT NULL,
  total_price  NUMERIC(12, 2) NOT NULL,

  -- Buyer note to seller
  message      TEXT,

  -- Status: pending | confirmed | completed | cancelled
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),

  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;

-- Buyers see their own orders; sellers see orders for their listings
CREATE POLICY "orders_read_own"
  ON public.marketplace_orders FOR SELECT
  USING (
    buyer_id = auth.uid() OR
    listing_id IN (
      SELECT id FROM public.marketplace_listings WHERE seller_id = auth.uid()
    )
  );

-- Only authenticated users can place orders
CREATE POLICY "orders_insert_authenticated"
  ON public.marketplace_orders FOR INSERT
  WITH CHECK (buyer_id = auth.uid());

-- Buyer can cancel; seller can confirm/complete
CREATE POLICY "orders_update_own"
  ON public.marketplace_orders FOR UPDATE
  USING (
    buyer_id = auth.uid() OR
    listing_id IN (
      SELECT id FROM public.marketplace_listings WHERE seller_id = auth.uid()
    )
  );

-- ── AUTO-UPDATE TIMESTAMPS ───────────────────────────────────────
CREATE OR REPLACE FUNCTION update_marketplace_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER marketplace_listings_updated
  BEFORE UPDATE ON public.marketplace_listings
  FOR EACH ROW EXECUTE FUNCTION update_marketplace_timestamps();

CREATE TRIGGER marketplace_orders_updated
  BEFORE UPDATE ON public.marketplace_orders
  FOR EACH ROW EXECUTE FUNCTION update_marketplace_timestamps();

-- ── ENABLE REALTIME ──────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_listings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_orders;
