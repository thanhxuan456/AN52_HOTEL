import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export type SiteSettings = {
  hotelName: string;
  hotelNameKr: string;
  tagline: string;
  heroImage: string;
  contactAddress: string;
  contactAddressKr: string;
  contactPhone: string;
  contactEmail: string;
  receptionHours: string;
  socialFacebook: string;
  socialInstagram: string;
  socialYoutube: string;
  primaryColor: string;
  accentColor: string;
  notifEmailAdmin: string;
  notifEmailEnabled: boolean;
};

const defaultSettings: SiteSettings = {
  hotelName: 'AN52 Hotel',
  hotelNameKr: 'AN52 호텔',
  tagline: 'Khách sạn sang trọng tại trung tâm Sài Gòn',
  heroImage: 'https://images.pexels.com/photos/10047588/pexels-photo-10047588.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1920',
  contactAddress: '123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
  contactAddressKr: '123 응우엔 후에, 1구, 호치민시',
  contactPhone: '+84 28 1234 5678',
  contactEmail: 'info@an52hotel.vn',
  receptionHours: 'Tiếp tân 24/7',
  socialFacebook: 'https://facebook.com/an52hotel',
  socialInstagram: 'https://instagram.com/an52hotel',
  socialYoutube: 'https://youtube.com/@an52hotel',
  primaryColor: '#a68b45',
  accentColor: '#e76f1a',
  notifEmailAdmin: 'admin@an52hotel.vn',
  notifEmailEnabled: true,
};

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('settings')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data?.settings) {
      setSettings({ ...defaultSettings, ...data.settings as Partial<SiteSettings> });
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { settings, setSettings, loaded, reload: load };
}
