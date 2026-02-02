-- Create the user-uploads bucket as PUBLIC
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-uploads', 'user-uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Remove existing policies to avoid conflicts if re-running
DROP POLICY IF EXISTS "Authenticated users can upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their own files" ON storage.objects;

-- 1. Allow authenticated users to upload to their own folder: users/{uid}/*
CREATE POLICY "Authenticated users can upload to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = 'users' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- 2. Allow authenticated users to view/download their own files
CREATE POLICY "Authenticated users can view their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = 'users' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- 3. Allow authenticated users to update/overwrite their own files
CREATE POLICY "Authenticated users can update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = 'users' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- 4. Allow authenticated users to delete their own files
CREATE POLICY "Authenticated users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  (storage.foldername(name))[1] = 'users' AND
  (storage.foldername(name))[2] = auth.uid()::text
);
