/*
# Set Admin User & Create CMS Tables

## Summary
1. Set tthanhxuan456@gmail.com as the website admin by updating the profiles table.
   Also handles the case where the profile doesn't exist yet by upserting.
2. Create `site_content` table for CMS-driven website content (rooms, amenities, testimonials, gallery, hotel info).
3. Create `payments` table for tracking payment integrations and transactions.
4. Enable RLS on new tables with anon+authenticated access (shared admin-managed data).

## Tables
- `site_content`: key/value CMS storage with JSONB content, category grouping, multilingual support
- `payments`: payment transaction records linked to bookings, with provider, amount, status

## Security
- RLS enabled on all new tables
- Policies allow anon+authenticated CRUD (admin manages via frontend, data is public-facing)
- profiles table: update is_admin for the specified email
*/

-- Step 1: Set admin user
-- First try to update existing profile
UPDATE profiles SET is_admin = true WHERE email = 'tthanhxuan456@gmail.com';

-- If no profile exists yet, insert one (will be merged when user signs in)
INSERT INTO profiles (id, email, full_name, is_admin)
SELECT 'admin_pending_tthanhxuan456', 'tthanhxuan456@gmail.com', 'Admin', true
WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'tthanhxuan456@gmail.com');

-- Step 2: Create site_content table for CMS
CREATE TABLE IF NOT EXISTS site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT 'general',
  key text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(category, key)
);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_site_content" ON site_content;
CREATE POLICY "anon_select_site_content"
ON site_content FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_site_content" ON site_content;
CREATE POLICY "anon_insert_site_content"
ON site_content FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_site_content" ON site_content;
CREATE POLICY "anon_update_site_content"
ON site_content FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_site_content" ON site_content;
CREATE POLICY "anon_delete_site_content"
ON site_content FOR DELETE
TO anon, authenticated USING (true);

-- Step 3: Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  clerk_user_id text,
  user_email text,
  amount bigint NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'VND',
  provider text NOT NULL DEFAULT 'manual',
  provider_payment_id text,
  status text NOT NULL DEFAULT 'pending',
  method text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_payments" ON payments;
CREATE POLICY "anon_select_payments"
ON payments FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_payments" ON payments;
CREATE POLICY "anon_insert_payments"
ON payments FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_payments" ON payments;
CREATE POLICY "anon_update_payments"
ON payments FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_payments" ON payments;
CREATE POLICY "anon_delete_payments"
ON payments FOR DELETE
TO anon, authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_site_content_category ON site_content(category);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);