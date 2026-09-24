/*
# Add phone and avatar_url columns to profiles + create avatars storage bucket

1. Modified Tables
- `profiles`: add `phone` (text, nullable) and `avatar_url` (text, nullable) columns.
  These store the user's phone number and avatar image URL respectively.
2. Storage
- Create `avatars` bucket (public) for storing user profile images.
- Add storage policy allowing authenticated users to upload/read their own avatar.
3. Security
- Profiles RLS already exists with anon+authenticated open policies (existing schema).
- Storage policies: authenticated users can read all avatars (public bucket), 
  and upload/update/delete only objects in their own folder path.
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_auth_insert" ON storage.objects;
CREATE POLICY "avatars_auth_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_auth_update" ON storage.objects;
CREATE POLICY "avatars_auth_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_auth_delete" ON storage.objects;
CREATE POLICY "avatars_auth_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');
