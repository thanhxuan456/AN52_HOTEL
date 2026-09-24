import { useEffect, useState } from 'react';
import { Menu, X, LogIn } from 'lucide-react';
import Logo from './Logo';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';
import UserMenu from './UserMenu';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import type { TranslationKey } from '@/data/translations';

type NavbarProps = {
  onBookClick: () => void;
  onAuthClick: (mode: 'signin' | 'signup') => void;
  onDashboardClick: () => void;
};

export default function Navbar({ onBookClick, onAuthClick, onDashboardClick }: NavbarProps) {
  const { t } = useApp();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks: { label: TranslationKey; href: string }[] = [
    { label: 'navHome', href: '#home' },
    { label: 'navAbout', href: '#about' },
    { label: 'navRooms', href: '#rooms' },
    { label: 'navAmenities', href: '#amenities' },
    { label: 'navGallery', href: '#gallery' },
    { label: 'navContact', href: '#contact' },
  ];

  const handleLinkClick = () => setMenuOpen(false);
  const isLight = scrolled;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
              ? 'bg-white/95 dark:bg-secondary-900/95 backdrop-blur-md shadow-lg py-3'
              : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        <a href="#home" className="shrink-0">
          <Logo
            textClassName={isLight ? 'text-primary-800 dark:text-white' : 'text-white'}
            subClassName={isLight ? 'text-primary-500 dark:text-primary-300' : 'text-primary-200'}
            iconClassName={isLight ? 'bg-primary-600' : 'bg-white/20 backdrop-blur'}
          />
        </a>

        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isLight
                  ? 'text-secondary-700 dark:text-secondary-200 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-secondary-800'
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              {t(link.label)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="hidden sm:block">
            <LanguageSwitcher variant="navbar" solid={isLight} />
          </div>
          <div className="hidden sm:block">
            <ThemeToggle variant="navbar" solid={isLight} />
          </div>

          {user ? (
            <UserMenu onDashboardClick={onDashboardClick} />
          ) : (
            <button
              onClick={() => onAuthClick('signin')}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isLight
                  ? 'text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-secondary-800 border border-primary-200 dark:border-secondary-600'
                  : 'text-white/90 hover:bg-white/10 border border-white/20'
              }`}
            >
              <LogIn className="w-4 h-4" />
              {t('signIn')}
            </button>
          )}

          <button
            onClick={onBookClick}
            className={`hidden md:inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 ${
              isLight
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-white text-primary-800 hover:bg-primary-50'
            }`}
          >
            {t('bookNow')}
          </button>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`lg:hidden p-2 rounded-md transition-colors ${
              isLight
                ? 'text-secondary-800 dark:text-secondary-100 hover:bg-primary-50 dark:hover:bg-secondary-800'
                : 'text-white hover:bg-white/10'
            }`}
            aria-label="Menu"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ${
          menuOpen ? 'max-h-[32rem] mt-3' : 'max-h-0'
        }`}
      >
        <nav className="bg-white dark:bg-secondary-800 shadow-2xl rounded-2xl mx-4 py-4 flex flex-col">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={handleLinkClick}
              className="px-5 py-3 text-sm font-medium text-secondary-700 dark:text-secondary-200 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-secondary-700 transition-colors"
            >
              {t(link.label)}
            </a>
          ))}

          <div className="flex items-center gap-2 px-5 py-3 border-t border-primary-100 dark:border-secondary-700 mt-2">
            <LanguageSwitcher variant="navbar" solid />
            <ThemeToggle variant="navbar" solid />
          </div>

          {user ? (
            <button
              onClick={() => setMenuOpen(false)}
              className="mx-4 mt-2 px-5 py-3 rounded-lg text-sm font-semibold bg-primary-50 dark:bg-secondary-700 text-primary-700 dark:text-primary-300 transition-colors"
            >
              {user.email || user.fullName || t('guestUser')}
            </button>
          ) : (
            <button
              onClick={() => {
                setMenuOpen(false);
                onAuthClick('signin');
              }}
              className="mx-4 mt-2 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold border-2 border-primary-200 dark:border-secondary-600 text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-secondary-700 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              {t('signIn')}
            </button>
          )}

          <button
            onClick={() => {
              setMenuOpen(false);
              onBookClick();
            }}
            className="mx-4 mt-2 px-5 py-3 rounded-lg text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 transition-colors"
          >
            {t('bookNow')}
          </button>
        </nav>
      </div>
    </header>
  );
}
