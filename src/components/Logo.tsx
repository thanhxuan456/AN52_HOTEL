import { Building2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';

type LogoProps = {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  subClassName?: string;
};

export default function Logo({ className = '', iconClassName = '', textClassName = '', subClassName = '' }: LogoProps) {
  const { settings, lang } = useApp();
  const name = lang === 'kr' ? settings.hotelNameKr : settings.hotelName;
  const nameParts = name.includes(' ') ? [name.split(' ')[0], name.split(' ').slice(1).join(' ')] : [name, ''];
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className={`flex items-center justify-center w-10 h-10 rounded-lg bg-primary-500 text-white shadow-md ${iconClassName}`}>
        <Building2 className="w-6 h-6" />
      </div>
      <div className="leading-none">
        <div className={`font-display text-xl font-bold tracking-tight ${textClassName}`}>{nameParts[0]}</div>
        {nameParts[1] && <div className={`text-[10px] uppercase tracking-[0.2em] ${subClassName}`}>{nameParts[1]}</div>}
      </div>
    </div>
  );
}
