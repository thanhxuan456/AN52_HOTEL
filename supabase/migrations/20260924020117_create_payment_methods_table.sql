/*
# Create payment_methods table

1. New Tables
- `payment_methods`: Stores configurable payment methods that guests can choose at checkout.
  - `id` (uuid, primary key)
  - `label` (jsonb, multilingual: {vi, en, kr} — display name shown to guests)
  - `description` (jsonb, multilingual: short instructions, e.g. "Transfer to bank account 123456789")
  - `icon` (text, lucide icon name, e.g. "CreditCard", "Wallet", "Landmark", "Smartphone")
  - `type` (text, payment type: "cash", "bank_transfer", "credit_card", "e_wallet", "qr_code", "other")
  - `is_published` (boolean, whether this method is shown to guests)
  - `sort_order` (integer, display ordering)
  - `created_at` (timestamptz)

2. Modified Tables
- `bookings`: add `payment_method_id` (uuid, nullable, references payment_methods) and `payment_method_label` (text, nullable, snapshot of the label at booking time).

3. Security
- Enable RLS on `payment_methods`.
- Allow anon + authenticated SELECT (guests need to see available payment methods).
- Allow anon + authenticated INSERT/UPDATE/DELETE (admin panel manages methods; app has no auth-gated admin role in RLS yet, so anon access is consistent with the existing payments/bookings pattern).

4. Important Notes
- The table is single-tenant (no user_id) — payment methods are shared/global configuration.
- `bookings` table gets a nullable `payment_method_id` FK so existing bookings are unaffected.
*/

CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label jsonb NOT NULL DEFAULT '{"vi":"","en":"","kr":""}',
  description jsonb NOT NULL DEFAULT '{"vi":"","en":"","kr":""}',
  icon text NOT NULL DEFAULT 'CreditCard',
  type text NOT NULL DEFAULT 'other',
  is_published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_payment_methods" ON payment_methods;
CREATE POLICY "anon_select_payment_methods"
ON payment_methods FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_payment_methods" ON payment_methods;
CREATE POLICY "anon_insert_payment_methods"
ON payment_methods FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_payment_methods" ON payment_methods;
CREATE POLICY "anon_update_payment_methods"
ON payment_methods FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_payment_methods" ON payment_methods;
CREATE POLICY "anon_delete_payment_methods"
ON payment_methods FOR DELETE
TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_payment_methods_sort ON payment_methods(sort_order);

-- Add payment method reference to bookings (nullable, no data loss)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'payment_method_id') THEN
    ALTER TABLE bookings ADD COLUMN payment_method_id uuid REFERENCES payment_methods(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'payment_method_label') THEN
    ALTER TABLE bookings ADD COLUMN payment_method_label text;
  END IF;
END $$;
