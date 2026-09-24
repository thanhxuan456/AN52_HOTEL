/*
# Add role and is_active columns to profiles

Adds staff role management and account activation/deactivation support.

Columns added:
- role (text, default 'guest'): User role - 'admin', 'staff', 'guest'
- is_active (boolean, default true): Whether the account is active
- updated_at (timestamptz): When the profile was last modified

Security:
- No RLS changes needed - existing policies on profiles remain.
- The admin panel already runs as authenticated user with admin checks.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
    ALTER TABLE profiles ADD COLUMN role text NOT NULL DEFAULT 'guest';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_active') THEN
    ALTER TABLE profiles ADD COLUMN is_active boolean NOT NULL DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
    ALTER TABLE profiles ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Backfill role for existing admins
UPDATE profiles SET role = 'admin' WHERE is_admin = true AND role = 'guest';
