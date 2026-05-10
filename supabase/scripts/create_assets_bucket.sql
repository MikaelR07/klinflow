-- 1. Create the 'assets-verified' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('assets-verified', 'assets-verified', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public access to read files
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'assets-verified' );

-- 3. Allow authenticated users (agents) to upload files
CREATE POLICY "Agents can upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'assets-verified' AND auth.role() = 'authenticated' );

-- 4. Allow authenticated users to update their own files
CREATE POLICY "Agents can update" 
ON storage.objects FOR UPDATE 
WITH CHECK ( bucket_id = 'assets-verified' AND auth.role() = 'authenticated' );
