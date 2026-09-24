import { Maximize, Users, BedDouble, Check, ArrowRight } from 'lucide-react';
import { formatPrice } from '@/data/hotelData';
import type { RoomType } from '@/data/hotelData';
import { useReveal } from '@/hooks/useReveal';
import { useApp } from '@/context/AppContext';
import { useSiteContent } from '@/hooks/useSiteContent';

type RoomsProps = {
  onBookClick: (roomId?: string) => void;
};

export default function Rooms({ onBookClick }: RoomsProps) {
  const { t, lang } = useApp();
  const { ref, visible } = useReveal<HTMLDivElement>();
  const { rooms } = useSiteContent(lang);

  return (
    <section id="rooms" className="py-20 lg:py-28 bg-white dark:bg-secondary-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={ref} className={`text-center mb-14 reveal ${visible ? 'visible' : ''}`}>
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-primary-500 mb-4">
            {t('roomsLabel')}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-secondary-900 dark:text-white mb-4">
            {t('roomsTitle')}
          </h2>
          <p className="text-secondary-600 dark:text-secondary-300 text-lg max-w-2xl mx-auto">
            {t('roomsSubtitle')}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 lg:gap-8">
          {rooms.map((room, idx) => (
            <RoomCard key={room.id} room={room} index={idx} onBookClick={() => onBookClick(room.id)} />
          ))}
        </div>
      </div>
    </section>
  );
}

function RoomCard({
  room,
  index,
  onBookClick,
}: {
  room: RoomType;
  index: number;
  onBookClick: () => void;
}) {
  const { t, lang } = useApp();
  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`group flex flex-col sm:flex-row bg-white dark:bg-secondary-800 rounded-2xl shadow-lg overflow-hidden border border-primary-100 dark:border-secondary-700 hover:shadow-2xl transition-all duration-500 reveal ${visible ? 'visible' : ''}`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className="relative sm:w-2/5 overflow-hidden">
        <img
          src={room.image}
          alt={room.name[lang]}
          className="w-full h-56 sm:h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute top-3 right-3 bg-white/95 dark:bg-secondary-800/95 backdrop-blur px-3 py-1.5 rounded-lg shadow-md">
          <span className="font-display text-lg font-bold text-primary-600 dark:text-primary-400">{formatPrice(room.price)}</span>
          <span className="text-xs text-secondary-500 dark:text-secondary-400">{t('perNight')}</span>
        </div>
      </div>

      <div className="flex-1 p-5 sm:p-6 flex flex-col">
        <h3 className="font-display text-xl font-bold text-secondary-900 dark:text-white mb-2">{room.name[lang]}</h3>
        <p className="text-sm text-secondary-600 dark:text-secondary-300 leading-relaxed mb-4 line-clamp-2">{room.description[lang]}</p>

        <div className="flex flex-wrap gap-3 mb-4 text-xs text-secondary-500 dark:text-secondary-400">
          <span className="flex items-center gap-1.5">
            <Maximize className="w-4 h-4 text-primary-400" /> {room.size}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-primary-400" /> {room.capacity} {lang === 'vi' ? 'khách' : lang === 'kr' ? '명' : 'guests'}
          </span>
          <span className="flex items-center gap-1.5">
            <BedDouble className="w-4 h-4 text-primary-400" /> {room.beds[lang]}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mb-5">
          {room.features[lang].slice(0, 4).map((feat) => (
            <span key={feat} className="flex items-center gap-1.5 text-xs text-secondary-600 dark:text-secondary-300">
              <Check className="w-3.5 h-3.5 text-success-500 shrink-0" /> {feat}
            </span>
          ))}
        </div>

        <button
          onClick={onBookClick}
          className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary-50 dark:bg-secondary-700 text-primary-700 dark:text-primary-300 font-semibold text-sm hover:bg-primary-600 hover:text-white transition-all duration-300 group/btn"
        >
          {t('bookThisRoom')}
          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
