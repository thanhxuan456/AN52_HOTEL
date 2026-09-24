import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useReveal } from '@/hooks/useReveal';
import { useApp } from '@/context/AppContext';
import { useSiteContent } from '@/hooks/useSiteContent';
import type { TranslationKey } from '@/data/translations';

export default function Gallery() {
  const { t, lang } = useApp();
  const { ref, visible } = useReveal<HTMLDivElement>();
  const { galleryImages } = useSiteContent(lang);
  const [activeCategory, setActiveCategory] = useState('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const categories: { id: string; key: TranslationKey }[] = [
    { id: 'all', key: 'galleryAll' },
    { id: 'rooms', key: 'galleryRooms' },
    { id: 'amenities', key: 'galleryAmenities' },
    { id: 'dining', key: 'galleryDining' },
  ];

  const filteredImages =
    activeCategory === 'all'
      ? galleryImages
      : galleryImages.filter((img) => img.category === activeCategory);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prevImage = () =>
    setLightboxIndex((prev) => (prev === null ? null : (prev - 1 + filteredImages.length) % filteredImages.length));
  const nextImage = () =>
    setLightboxIndex((prev) => (prev === null ? null : (prev + 1) % filteredImages.length));

  return (
    <section id="gallery" className="py-20 lg:py-28 bg-primary-50/50 dark:bg-secondary-800/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={ref} className={`text-center mb-10 reveal ${visible ? 'visible' : ''}`}>
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-primary-500 mb-4">
            {t('galleryLabel')}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-secondary-900 dark:text-white mb-4">
            {t('galleryTitle')}
          </h2>
          <p className="text-secondary-600 dark:text-secondary-300 text-lg max-w-2xl mx-auto mb-8">
            {t('gallerySubtitle')}
          </p>

          <div className="inline-flex flex-wrap justify-center gap-2 p-1.5 bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-primary-100 dark:border-secondary-700">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeCategory === cat.id
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-secondary-600 dark:text-secondary-300 hover:bg-primary-50 dark:hover:bg-secondary-700'
                }`}
              >
                {t(cat.key)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filteredImages.map((image, idx) => (
            <button
              key={`${image.url}-${idx}`}
              onClick={() => openLightbox(idx)}
              className="group relative overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-shadow aspect-[4/3]"
            >
              <img
                src={image.url}
                alt={image.caption[lang]}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-secondary-900/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                <span className="text-white text-sm font-medium">{image.caption[lang]}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[100] bg-secondary-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-5 right-5 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); prevImage(); }}
            className="absolute left-4 sm:left-8 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={filteredImages[lightboxIndex].url}
              alt={filteredImages[lightboxIndex].caption[lang]}
              className="w-full max-h-[80vh] object-contain rounded-xl"
            />
            <p className="text-center text-white mt-4 font-medium">{filteredImages[lightboxIndex].caption[lang]}</p>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); nextImage(); }}
            className="absolute right-4 sm:right-8 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </section>
  );
}
