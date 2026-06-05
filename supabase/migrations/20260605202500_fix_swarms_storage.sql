-- 1. Ensure the swarms bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('swarms', 'swarms', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop any potentially conflicting policies for this bucket
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to swarms" ON storage.objects;
DROP POLICY IF EXISTS "Users can update/delete own uploads" ON storage.objects;

-- 3. Create fresh, bulletproof policies for the swarms bucket
CREATE POLICY "Public Swarms Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'swarms');

CREATE POLICY "Authenticated users can insert swarms"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'swarms');

CREATE POLICY "Authenticated users can update swarms"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'swarms' AND owner = auth.uid())
WITH CHECK (bucket_id = 'swarms' AND owner = auth.uid());

CREATE POLICY "Authenticated users can delete swarms"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'swarms' AND owner = auth.uid());
