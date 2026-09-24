/*
# Create media storage bucket for CMS uploads

1. Storage
- Create a public bucket `media` for storing images and videos uploaded via the CMS admin panel.
2. Security
- Allow authenticated users to upload, read, update, and delete files in the `media` bucket.
- Allow public (anon) read access so uploaded media displays on the website.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "media_public_read" ON storage.objects;
CREATE POLICY "media_public_read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'media');

DROP POLICY IF EXISTS "media_auth_upload" ON storage.objects;
CREATE POLICY "media_auth_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "media_auth_update" ON storage.objects;
CREATE POLICY "media_auth_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'media')
WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "media_auth_delete" ON storage.objects;
CREATE POLICY "media_auth_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'media');
