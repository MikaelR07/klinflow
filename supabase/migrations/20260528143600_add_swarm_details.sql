-- Add description and images to swarms table
ALTER TABLE public.swarms
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Create swarms storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('swarms', 'swarms', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to swarms bucket
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'swarms');

-- Allow authenticated users to upload to swarms bucket
CREATE POLICY "Authenticated users can upload to swarms"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'swarms' 
    AND auth.role() = 'authenticated'
);

-- Allow users to delete their own uploads
CREATE POLICY "Users can update/delete own uploads"
ON storage.objects FOR ALL
USING (
    bucket_id = 'swarms'
    AND auth.uid() = owner
);
