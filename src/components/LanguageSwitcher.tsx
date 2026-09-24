import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { Language } from '@/data/hotelData';

const languages: { code: Language; label: string; flag: string }[] = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'kr', label: '한국어', flag: '🇰🇷' },
];

export default function LanguageSwitcher({
  variant = 'navbar',
  solid = false,
}: {
  variant?: 'navbar' | 'footer';
  solid?: boolean;
}) {
  const { lang, setLang } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = languages.find((l) => l.code === lang)!;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isFooter = variant === 'footer';

  const buttonColors = isFooter
    ? 'text-secondary-300 hover:bg-secondary-800'
    : solid
      ? 'text-secondary-700 dark:text-secondary-200 hover:bg-primary-50 dark:hover:bg-secondary-800'
      : 'text-white/90 hover:bg-white/15';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors ${buttonColors}`}
        aria-label="Language"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{current.flag}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-secondary-800 rounded-xl shadow-2xl border border-primary-100 dark:border-secondary-700 py-2 z-50 animate-slide-in">
          {languages.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                lang === l.code
                  ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-secondary-700'
                  : 'text-secondary-700 dark:text-secondary-200 hover:bg-primary-50 dark:hover:bg-secondary-700'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span className="text-base">{l.flag}</span>
                {l.label}
              </span>
              {lang === l.code && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
