import { Wifi, Car, ShieldCheck, Clock } from 'lucide-react';
import { useReveal } from '@/hooks/useReveal';
import { useApp } from '@/context/AppContext';
import { useSiteContent } from '@/hooks/useSiteContent';
import type { TranslationKey } from '@/data/translations';

export default function About() {
  const { t, lang } = useApp();
  const { ref, visible } = useReveal<HTMLDivElement>();
  const { stats } = useSiteContent(lang);

  const highlights: { icon: typeof Wifi; key: TranslationKey }[] = [
    { icon: Wifi, key: 'wifiFree' },
    { icon: Car, key: 'parking' },
    { icon: ShieldCheck, key: 'security' },
    { icon: Clock, key: 'reception247' },
  ];

  return (
    <section id="about" className="py-20 lg:py-28 bg-primary-50/50 dark:bg-secondary-800/40">
      <div ref={ref} className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 reveal ${visible ? 'visible' : ''}`}>
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-primary-500 mb-4">
              {t('aboutLabel')}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-secondary-900 dark:text-white leading-tight mb-6">
              {t('aboutTitle')}
            </h2>
            <p className="text-secondary-600 dark:text-secondary-300 text-lg leading-relaxed mb-5">
              {t('aboutP1')}
            </p>
            <p className="text-secondary-600 dark:text-secondary-300 leading-relaxed mb-8">
              {t('aboutP2')}
            </p>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {highlights.map((item) => (
                <div key={item.key} className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-secondary-800 shadow-sm border border-primary-100 dark:border-secondary-700">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-100 dark:bg-secondary-700 text-primary-600 dark:text-primary-400 shrink-0">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-secondary-700 dark:text-secondary-200">{t(item.key)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <img
                  src="https://images.pexels.com/photos/2736384/pexels-photo-2736384.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                  alt="Room"
                  className="w-full h-56 object-cover rounded-2xl shadow-lg"
                />
                <img
                  src="https://images.pexels.com/photos/7821349/pexels-photo-7821349.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                  alt="Lobby"
                  className="w-full h-40 object-cover rounded-2xl shadow-lg"
                />
              </div>
              <div className="space-y-4 pt-8">
                <img
                  src="https://images.pexels.com/photos/2259226/pexels-photo-2259226.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                  alt="Pool"
                  className="w-full h-40 object-cover rounded-2xl shadow-lg"
                />
                <img
                  src="https://images.pexels.com/photos/12387869/pexels-photo-12387869.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                  alt="Restaurant"
                  className="w-full h-56 object-cover rounded-2xl shadow-lg"
                />
              </div>
            </div>

            <div className="absolute -bottom-6 -left-4 sm:-left-6 bg-white dark:bg-secondary-800 rounded-2xl shadow-2xl p-5 border border-primary-100 dark:border-secondary-700">
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {stats.map((stat) => (
                  <div key={stat.value} className="text-center">
                    <div className="font-display text-2xl sm:text-3xl font-bold text-primary-600 dark:text-primary-400">{stat.value}</div>
                    <div className="text-xs text-secondary-500 dark:text-secondary-400 mt-0.5">{stat.label[lang]}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
