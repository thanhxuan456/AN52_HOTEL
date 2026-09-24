import { Moon, Sun } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function ThemeToggle({
  variant = 'navbar',
  solid = false,
}: {
  variant?: 'navbar' | 'footer';
  solid?: boolean;
}) {
  const { isDark, toggleTheme } = useApp();
  const isFooter = variant === 'footer';

  const colors = isFooter
    ? 'text-secondary-300 hover:bg-secondary-800'
    : solid
      ? isDark
        ? 'text-primary-300 hover:bg-secondary-800'
        : 'text-secondary-700 hover:bg-primary-50'
      : 'text-white/90 hover:bg-white/15';

  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all hover:scale-110 ${colors}`}
      aria-label={isDark ? 'Light mode' : 'Dark mode'}
    >
      {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
    </button>
  );
}
