/*
# Create custom_invoices table

Stores custom invoices created by admin, with multiple service line items.
Each invoice can be for room bookings, services, or any custom items.
*/

CREATE TABLE IF NOT EXISTS custom_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL DEFAULT '',
  customer_name text NOT NULL DEFAULT '',
  customer_email text,
  customer_phone text,
  customer_address text,
  issue_date timestamptz NOT NULL DEFAULT now(),
  due_date timestamptz,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  tax_rate numeric NOT NULL DEFAULT 0,
  tax_amount numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'VND',
  status text NOT NULL DEFAULT 'draft',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE custom_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_custom_invoices" ON custom_invoices FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "insert_custom_invoices" ON custom_invoices FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "update_custom_invoices" ON custom_invoices FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "delete_custom_invoices" ON custom_invoices FOR DELETE
  TO authenticated USING (true);

-- Index for sorting by date
CREATE INDEX IF NOT EXISTS idx_custom_invoices_created_at ON custom_invoices (created_at DESC);
