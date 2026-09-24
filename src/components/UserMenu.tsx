import { useState, useRef, useEffect } from 'react';
import { ChevronDown, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';

type UserMenuProps = {
  onDashboardClick: () => void;
};

export default function UserMenu({ onDashboardClick }: UserMenuProps) {
  const { t } = useApp();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors hover:bg-primary-50 dark:hover:bg-secondary-800"
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-600 text-white text-sm font-bold overflow-hidden shrink-0">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.fullName || 'Avatar'} className="w-full h-full object-cover" />
          ) : (
            user.initials
          )}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-secondary-600 dark:text-secondary-300 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-secondary-800 rounded-xl shadow-2xl border border-primary-100 dark:border-secondary-700 py-2 z-50 animate-slide-in">
          <div className="px-4 py-3 border-b border-primary-100 dark:border-secondary-700">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-600 text-white text-base font-bold shrink-0 overflow-hidden">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName || 'Avatar'} className="w-full h-full object-cover" />
                ) : (
                  user.initials
                )}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-secondary-900 dark:text-white truncate">
                  {user.fullName || t('guestUser')}
                </div>
                {user.email && (
                  <div className="text-xs text-secondary-500 dark:text-secondary-400 truncate">{user.email}</div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-1">
            <button
              onClick={() => { setOpen(false); onDashboardClick(); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-secondary-700 dark:text-secondary-200 hover:bg-primary-50 dark:hover:bg-secondary-700 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              {t('dashboard')}
            </button>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-secondary-700 dark:text-secondary-200 hover:bg-primary-50 dark:hover:bg-secondary-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {t('signOut')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
