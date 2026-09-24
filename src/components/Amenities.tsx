import { Waves, UtensilsCrossed, Flower2, Dumbbell, Briefcase, Sofa, ArrowRight } from 'lucide-react';
import type { AmenityType } from '@/data/hotelData';
import { useReveal } from '@/hooks/useReveal';
import { useApp } from '@/context/AppContext';
import { useSiteContent } from '@/hooks/useSiteContent';

const iconMap: Record<string, typeof Waves> = {
  Waves,
  UtensilsCrossed,
  Flower2,
  Dumbbell,
  Briefcase,
  Sofa,
};

export default function Amenities() {
  const { t, lang } = useApp();
  const { ref, visible } = useReveal<HTMLDivElement>();
  const { amenities } = useSiteContent(lang);

  return (
    <section id="amenities" className="py-20 lg:py-28 bg-secondary-800 dark:bg-secondary-950 bg-grain">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={ref} className={`text-center mb-14 reveal ${visible ? 'visible' : ''}`}>
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-primary-300 mb-4">
            {t('amenitiesLabel')}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            {t('amenitiesTitle')}
          </h2>
          <p className="text-secondary-300 text-lg max-w-2xl mx-auto">
            {t('amenitiesSubtitle')}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {amenities.map((amenity, idx) => {
            const Icon = iconMap[amenity.icon] || Waves;
            return (
              <AmenityCard key={amenity.id} amenity={amenity} Icon={Icon} index={idx} />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function AmenityCard({
  amenity,
  Icon,
  index,
}: {
  amenity: AmenityType;
  Icon: typeof Waves;
  index: number;
}) {
  const { t, lang } = useApp();
  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`group relative overflow-hidden rounded-2xl shadow-xl reveal ${visible ? 'visible' : ''}`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <img
        src={amenity.image}
        alt={amenity.name[lang]}
        className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-secondary-950 via-secondary-900/60 to-transparent" />

      <div className="absolute inset-0 p-6 flex flex-col justify-end">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary-500/90 backdrop-blur text-white shadow-lg">
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="font-display text-xl font-bold text-white">{amenity.name[lang]}</h3>
        </div>
        <p className="text-sm text-white/80 leading-relaxed max-h-0 opacity-0 group-hover:max-h-32 group-hover:opacity-100 transition-all duration-500 overflow-hidden">
          {amenity.description[lang]}
        </p>
        <div className="flex items-center gap-1.5 text-primary-300 text-sm font-medium mt-2 max-h-0 opacity-0 group-hover:max-h-10 group-hover:opacity-100 transition-all duration-500 overflow-hidden">
          {t('learnMore')} <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
