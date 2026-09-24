import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, Facebook, Instagram, Youtube, ArrowUpRight } from 'lucide-react';
import Logo from './Logo';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';
import { useReveal } from '@/hooks/useReveal';
import { useApp } from '@/context/AppContext';
import type { TranslationKey } from '@/data/translations';

type FooterProps = {
  onBookClick: () => void;
};

export default function Footer({ onBookClick }: FooterProps) {
  const { t, settings } = useApp();
  const { ref, visible } = useReveal<HTMLDivElement>();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  const quickLinks: { key: TranslationKey; href: string }[] = [
    { key: 'about', href: '#about' },
    { key: 'rooms', href: '#rooms' },
    { key: 'amenities', href: '#amenities' },
    { key: 'gallery', href: '#gallery' },
  ];

  const socials = [
    { icon: Facebook, href: settings.socialFacebook || '#', label: 'Facebook' },
    { icon: Instagram, href: settings.socialInstagram || '#', label: 'Instagram' },
    { icon: Youtube, href: settings.socialYoutube || '#', label: 'Youtube' },
  ];

  return (
    <footer id="contact" className="bg-secondary-950 text-secondary-300 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/10 via-transparent to-secondary-950/30 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={ref} className={`reveal ${visible ? 'visible' : ''}`}>
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 pt-16 lg:pt-20 pb-12">
            <div className="lg:col-span-4">
              <div className="mb-5">
                <Logo
                  textClassName="text-white"
                  subClassName="text-primary-300"
                  iconClassName="bg-primary-500"
                />
              </div>
              <p className="text-sm leading-relaxed mb-6 max-w-sm">
                {t('aboutP1')}
              </p>
              <div className="flex items-center gap-3 mb-6">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-secondary-800 hover:bg-primary-600 text-secondary-300 hover:text-white transition-all duration-300 hover:scale-110"
                  >
                    <s.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
              <button
                onClick={onBookClick}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 transition-all hover:shadow-lg hover:shadow-primary-600/30"
              >
                {t('bookNow')}
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            <div className="lg:col-span-3">
              <h4 className="font-display text-lg font-bold text-white mb-5 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-primary-500" />
                {t('contactTitle')}
              </h4>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3 group">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-secondary-800 group-hover:bg-primary-600 text-primary-400 group-hover:text-white transition-colors shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span className="leading-relaxed pt-1.5">{settings.contactAddress}</span>
                </li>
                <li className="flex items-center gap-3 group">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-secondary-800 group-hover:bg-primary-600 text-primary-400 group-hover:text-white transition-colors shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <a href={`tel:${settings.contactPhone.replace(/\s/g, '')}`} className="hover:text-white transition-colors pt-2">{settings.contactPhone}</a>
                </li>
                <li className="flex items-center gap-3 group">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-secondary-800 group-hover:bg-primary-600 text-primary-400 group-hover:text-white transition-colors shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <a href={`mailto:${settings.contactEmail}`} className="hover:text-white transition-colors pt-2">{settings.contactEmail}</a>
                </li>
                <li className="flex items-start gap-3 group">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-secondary-800 group-hover:bg-primary-600 text-primary-400 group-hover:text-white transition-colors shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <span className="leading-relaxed pt-1.5">{settings.receptionHours}</span>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-2">
              <h4 className="font-display text-lg font-bold text-white mb-5 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-primary-500" />
                {t('quickLinks')}
              </h4>
              <ul className="space-y-3 text-sm">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="inline-flex items-center gap-1.5 hover:text-white transition-colors group"
                    >
                      <span className="w-0 group-hover:w-3 h-px bg-primary-500 transition-all duration-300" />
                      {t(link.key)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-3">
              <h4 className="font-display text-lg font-bold text-white mb-5 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-primary-500" />
                {t('newsletter')}
              </h4>
              <p className="text-sm mb-4 leading-relaxed">{t('newsletterText')}</p>
              <form onSubmit={handleSubscribe} className="space-y-3 mb-6">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('emailPlaceholder')}
                  className="w-full px-4 py-2.5 rounded-lg bg-secondary-800 border border-secondary-700 text-white text-sm placeholder:text-secondary-500 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
                />
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  {subscribed ? t('subscribed') : t('subscribe')}
                </button>
              </form>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary-800/50 border border-secondary-700/50">
                <span className="text-xs text-secondary-400 font-medium">VN · EN · KR</span>
                <div className="flex items-center gap-1 ml-auto">
                  <LanguageSwitcher variant="footer" />
                  <ThemeToggle variant="footer" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-secondary-700/50 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <p>{t('rights')}</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">{t('terms')}</a>
            <a href="#" className="hover:text-white transition-colors">{t('privacy')}</a>
            <a href="#" className="hover:text-white transition-colors">{t('faq')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
