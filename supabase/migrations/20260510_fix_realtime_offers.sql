-- Fix Realtime for marketplace_offers
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'marketplace_offers') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'marketplace_offers'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_offers;
    END IF;
  END IF;
END $$;
