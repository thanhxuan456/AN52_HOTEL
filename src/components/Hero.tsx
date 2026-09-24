import { useState } from 'react';
import { Calendar, Users, Search, Star } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { TranslationKey } from '@/data/translations';

type HeroProps = {
  onBookClick: () => void;
};

export default function Hero({ onBookClick }: HeroProps) {
  const { t, settings } = useApp();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2');

  const today = new Date().toISOString().split('T')[0];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onBookClick();
  };

  const guestOptions: { value: string; key: TranslationKey }[] = [
    { value: '1', key: 'guest1' },
    { value: '2', key: 'guest2' },
    { value: '3', key: 'guest3' },
    { value: '4', key: 'guest4' },
    { value: '5', key: 'guest5' },
  ];

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={settings.heroImage}
          alt={settings.hotelName}
          className="w-full h-full object-cover animate-slow-zoom"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-secondary-950/70 via-secondary-900/40 to-secondary-950/80" />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 mb-6 animate-fade-in">
            <Star className="w-4 h-4 fill-accent-400 text-accent-400" />
            <span className="text-sm text-white font-medium">{t('heroBadge')}</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white text-shadow-lg leading-tight mb-6 animate-fade-up">
            {t('heroTitle')}
          </h1>

          <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto text-shadow-lg animate-fade-up" style={{ animationDelay: '0.15s' }}>
            {t('heroSubtitle')}
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          className="bg-white/95 dark:bg-secondary-800/95 backdrop-blur-md rounded-2xl shadow-2xl p-4 sm:p-6 animate-fade-up"
          style={{ animationDelay: '0.3s' }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-secondary-600 dark:text-secondary-300 uppercase tracking-wide">{t('checkIn')}</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500" />
                <input
                  type="date"
                  min={today}
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-secondary-200 dark:border-secondary-600 text-sm text-secondary-800 dark:text-secondary-100 dark:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-secondary-600 dark:text-secondary-300 uppercase tracking-wide">{t('checkOut')}</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500" />
                <input
                  type="date"
                  min={checkIn || today}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-secondary-200 dark:border-secondary-600 text-sm text-secondary-800 dark:text-secondary-100 dark:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-secondary-600 dark:text-secondary-300 uppercase tracking-wide">{t('guests')}</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500" />
                <select
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-secondary-200 dark:border-secondary-600 text-sm text-secondary-800 dark:text-secondary-100 dark:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all appearance-none"
                >
                  {guestOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{t(opt.key)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.02]"
              >
                <Search className="w-4 h-4" />
                {t('search')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
