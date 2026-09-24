import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Language, ThemeMode } from '@/data/hotelData';
import { translations, type TranslationKey } from '@/data/translations';
import { useSiteSettings, type SiteSettings } from '@/hooks/useSiteSettings';

type AppContextValue = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  theme: ThemeMode;
  toggleTheme: () => void;
  isDark: boolean;
  settings: SiteSettings;
  reloadSettings: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { settings, reload: reloadSettings } = useSiteSettings();
  const [lang, setLang] = useState<Language>(() => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('an52-lang') : null;
    if (saved === 'vi' || saved === 'en' || saved === 'kr') return saved;
    return 'vi';
  });

  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('an52-theme') : null;
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  });

  useEffect(() => {
    localStorage.setItem('an52-lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('an52-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Apply dynamic primary/accent colors from site settings
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary-500', settings.primaryColor);
    root.style.setProperty('--color-accent-500', settings.accentColor);
  }, [settings.primaryColor, settings.accentColor]);

  const t = (key: TranslationKey): string => translations[lang][key] ?? key;

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  const value: AppContextValue = {
    lang,
    setLang,
    t,
    theme,
    toggleTheme,
    isDark: theme === 'dark',
    settings,
    reloadSettings,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
