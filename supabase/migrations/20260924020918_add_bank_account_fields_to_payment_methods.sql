/*
# Add bank account fields to payment_methods

Adds optional bank account fields so the system can auto-generate Vietnamese QR codes (VietQR format) for bank transfer payments.

Columns added:
- bank_bin (text, nullable): Bank BIN code (e.g. 970418 for BIDV, 970407 for Techcombank)
- bank_account_number (text, nullable): Bank account number
- bank_account_name (text, nullable): Account holder name
- amount_fixed (boolean, default false): If true, the QR includes the exact booking amount
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_methods' AND column_name = 'bank_bin') THEN
    ALTER TABLE payment_methods ADD COLUMN bank_bin text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_methods' AND column_name = 'bank_account_number') THEN
    ALTER TABLE payment_methods ADD COLUMN bank_account_number text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_methods' AND column_name = 'bank_account_name') THEN
    ALTER TABLE payment_methods ADD COLUMN bank_account_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_methods' AND column_name = 'amount_fixed') THEN
    ALTER TABLE payment_methods ADD COLUMN amount_fixed boolean NOT NULL DEFAULT false;
  END IF;
END $$;
