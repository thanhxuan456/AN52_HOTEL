/*
# Create site_settings table

Stores configurable site-wide settings as a single JSON blob in one row.
Admins edit these from the Settings tab in the admin panel.
*/

CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_site_settings" ON site_settings FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "insert_site_settings" ON site_settings FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "update_site_settings" ON site_settings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- Seed default settings
INSERT INTO site_settings (settings)
VALUES ('{
  "hotelName": "AN52 Hotel",
  "hotelNameKr": "AN52 호텔",
  "tagline": "Khách sạn sang trọng tại trung tâm Sài Gòn",
  "heroImage": "https://images.pexels.com/photos/10047588/pexels-photo-10047588.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1920",
  "contactAddress": "123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
  "contactAddressKr": "123 응우엔 후에, 1구, 호치민시",
  "contactPhone": "+84 28 1234 5678",
  "contactEmail": "info@an52hotel.vn",
  "receptionHours": "Tiếp tân 24/7",
  "socialFacebook": "https://facebook.com/an52hotel",
  "socialInstagram": "https://instagram.com/an52hotel",
  "socialYoutube": "https://youtube.com/@an52hotel",
  "primaryColor": "#a68b45",
  "accentColor": "#e76f1a",
  "notifEmailAdmin": "admin@an52hotel.vn",
  "notifEmailEnabled": true
}'::jsonb)
ON CONFLICT DO NOTHING;
