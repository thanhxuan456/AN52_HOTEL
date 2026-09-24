import { Star, Quote } from 'lucide-react';
import type { TestimonialType } from '@/data/hotelData';
import { useReveal } from '@/hooks/useReveal';
import { useApp } from '@/context/AppContext';
import { useSiteContent } from '@/hooks/useSiteContent';

export default function Testimonials() {
  const { t, lang } = useApp();
  const { ref, visible } = useReveal<HTMLDivElement>();
  const { testimonials } = useSiteContent(lang);

  return (
    <section className="py-20 lg:py-28 bg-white dark:bg-secondary-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={ref} className={`text-center mb-14 reveal ${visible ? 'visible' : ''}`}>
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-primary-500 mb-4">
            {t('testimonialsLabel')}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-secondary-900 dark:text-white mb-4">
            {t('testimonialsTitle')}
          </h2>
          <div className="flex items-center justify-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-6 h-6 fill-accent-400 text-accent-400" />
              ))}
            </div>
            <span className="text-secondary-600 dark:text-secondary-300 text-lg font-medium">{t('testimonialsRating')}</span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial, idx) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({
  testimonial,
  index,
}: {
  testimonial: TestimonialType;
  index: number;
}) {
  const { lang } = useApp();
  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`bg-primary-50/60 dark:bg-secondary-800 rounded-2xl p-6 border border-primary-100 dark:border-secondary-700 hover:shadow-lg transition-shadow reveal ${visible ? 'visible' : ''}`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <Quote className="w-8 h-8 text-primary-300 dark:text-primary-600 mb-3" />
      <p className="text-sm text-secondary-700 dark:text-secondary-200 leading-relaxed mb-5">{testimonial.text[lang]}</p>

      <div className="flex mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < testimonial.rating ? 'fill-accent-400 text-accent-400' : 'text-secondary-200 dark:text-secondary-600'}`}
          />
        ))}
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-primary-100 dark:border-secondary-700">
        <img
          src={testimonial.avatar}
          alt={testimonial.name}
          className="w-11 h-11 rounded-full object-cover"
        />
        <div>
          <div className="font-semibold text-secondary-900 dark:text-white text-sm">{testimonial.name}</div>
          <div className="text-xs text-secondary-500 dark:text-secondary-400">{testimonial.location[lang]}</div>
        </div>
      </div>
    </div>
  );
}
