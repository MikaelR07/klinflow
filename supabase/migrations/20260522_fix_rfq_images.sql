-- Ensure bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('rfq-images', 'rfq-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop previous policies if any exist
DROP POLICY IF EXISTS "Allow public read on rfq-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to rfq-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own rfq-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own rfq-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow ALL rfq-images" ON storage.objects;

-- Create an overly permissive policy to guarantee it works (for development)
CREATE POLICY "Allow ALL rfq-images" 
ON storage.objects FOR ALL 
USING (bucket_id = 'rfq-images') 
WITH CHECK (bucket_id = 'rfq-images');
