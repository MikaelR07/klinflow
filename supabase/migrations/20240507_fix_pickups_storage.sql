-- Migration: 20240507_fix_pickups_storage_v2.sql
-- Description: Refines the 'pickups' storage policies using a more reliable path-matching logic.

-- 1. Ensure bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('pickups', 'pickups', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Public Read
DROP POLICY IF EXISTS "Public View Pickups" ON storage.objects;
CREATE POLICY "Public View Pickups" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'pickups' );

-- 3. Authenticated Insert (Strict Folder Matching)
DROP POLICY IF EXISTS "Users can upload pickup photos" ON storage.objects;
CREATE POLICY "Users can upload pickup photos" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (
    bucket_id = 'pickups' 
    AND (name LIKE (auth.uid()::text || '/%'))
);

-- 4. Authenticated Delete/Update (Strict Folder Matching)
DROP POLICY IF EXISTS "Users can manage own pickup photos" ON storage.objects;
CREATE POLICY "Users can manage own pickup photos" 
ON storage.objects FOR ALL 
TO authenticated 
USING (
    bucket_id = 'pickups' 
    AND (name LIKE (auth.uid()::text || '/%'))
);
