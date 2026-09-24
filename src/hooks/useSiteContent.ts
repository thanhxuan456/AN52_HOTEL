import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  rooms as staticRooms,
  amenities as staticAmenities,
  testimonials as staticTestimonials,
  galleryImages as staticGallery,
  stats as staticStats,
} from '@/data/hotelData';
import type { Language, RoomType, AmenityType, TestimonialType, GalleryImageType, StatType } from '@/data/hotelData';

type ContentRow = {
  id: string;
  category: string;
  key: string;
  content: Record<string, unknown>;
  is_published: boolean;
  sort_order: number;
};

const langs: Language[] = ['vi', 'en', 'kr'];

/* Convert a CMS content object's multilingual field to Record<Language, string> */
function toMl(raw: unknown): Record<Language, string> {
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, string>;
    return { vi: obj.vi ?? '', en: obj.en ?? '', kr: obj.kr ?? '' };
  }
  const s = typeof raw === 'string' ? raw : '';
  return { vi: s, en: s, kr: s };
}

function toMlList(raw: unknown): Record<Language, string[]> {
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const result = {} as Record<Language, string[]>;
    for (const l of langs) {
      const arr = obj[l];
      result[l] = Array.isArray(arr) ? arr.map(String) : [];
    }
    return result;
  }
  return { vi: [], en: [], kr: [] };
}

function rowsToRooms(rows: ContentRow[]): RoomType[] {
  return rows
    .filter((r) => r.is_published)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((r) => {
      const c = r.content;
      return {
        id: r.key,
        name: toMl(c.name),
        description: toMl(c.description),
        price: Number(c.price ?? 0),
        size: String(c.size ?? ''),
        capacity: Number(c.capacity ?? 0),
        beds: toMl(c.beds),
        image: String(c.image ?? ''),
        features: toMlList(c.features),
      } as RoomType;
    });
}

function rowsToAmenities(rows: ContentRow[]): AmenityType[] {
  return rows
    .filter((r) => r.is_published)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((r) => {
      const c = r.content;
      return {
        id: r.key,
        name: toMl(c.name),
        description: toMl(c.description),
        image: String(c.image ?? ''),
        icon: String(c.icon ?? 'Waves'),
      } as AmenityType;
    });
}

function rowsToTestimonials(rows: ContentRow[]): TestimonialType[] {
  return rows
    .filter((r) => r.is_published)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((r) => {
      const c = r.content;
      return {
        id: r.key,
        name: String(c.name ?? ''),
        avatar: String(c.avatar ?? ''),
        location: toMl(c.location),
        rating: Number(c.rating ?? 0),
        text: toMl(c.text),
      } as TestimonialType;
    });
}

function rowsToGallery(rows: ContentRow[]): GalleryImageType[] {
  return rows
    .filter((r) => r.is_published)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((r) => {
      const c = r.content;
      return {
        url: String(c.url ?? ''),
        caption: toMl(c.caption),
        category: String(c.category ?? 'rooms'),
      } as GalleryImageType;
    });
}

function rowsToStats(rows: ContentRow[]): StatType[] {
  return rows
    .filter((r) => r.is_published)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((r) => {
      const c = r.content;
      return {
        label: toMl(c.label),
        value: String(c.value ?? ''),
      } as StatType;
    });
}

/* Get a single text value from CMS section_text category (for headers, contact info, etc.) */
function rowsToTextMap(rows: ContentRow[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const r of rows) {
    if (!r.is_published) continue;
    const c = r.content;
    const title = c.title ?? c.value;
    if (title && typeof title === 'object') {
      const obj = title as Record<string, string>;
      map[r.key] = obj.vi ?? obj.en ?? obj.kr ?? '';
    } else if (typeof title === 'string') {
      map[r.key] = title;
    }
  }
  return map;
}

export type SiteContentData = {
  rooms: RoomType[];
  amenities: AmenityType[];
  testimonials: TestimonialType[];
  galleryImages: GalleryImageType[];
  stats: StatType[];
  texts: Record<string, string>;
  loading: boolean;
  reload: () => void;
};

export function useSiteContent(lang: Language): SiteContentData {
  const [rows, setRows] = useState<ContentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('site_content')
      .select('*')
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true });
    if (error) {
      console.error(error);
      setRows([]);
    } else {
      setRows((data as ContentRow[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const byCat = (cat: string) => rows.filter((r) => r.category === cat);

  const cmsRooms = byCat('room');
  const cmsAmenities = byCat('amenity');
  const cmsTestimonials = byCat('testimonial');
  const cmsGallery = byCat('gallery');
  const cmsStats = byCat('stat');

  /* Use CMS content if any published rows exist, otherwise fall back to static data */
  const rooms = cmsRooms.some((r) => r.is_published) ? rowsToRooms(cmsRooms) : staticRooms;
  const amenities = cmsAmenities.some((r) => r.is_published) ? rowsToAmenities(cmsAmenities) : staticAmenities;
  const testimonials = cmsTestimonials.some((r) => r.is_published) ? rowsToTestimonials(cmsTestimonials) : staticTestimonials;
  const galleryImages = cmsGallery.some((r) => r.is_published) ? rowsToGallery(cmsGallery) : staticGallery;
  const stats = cmsStats.some((r) => r.is_published) ? rowsToStats(cmsStats) : staticStats;

  /* For texts: build a map with the current language, falling back to vi */
  const textRows = byCat('section_text');
  const allTexts: Record<string, Record<Language, string>> = {};
  for (const r of textRows) {
    if (!r.is_published) continue;
    const c = r.content;
    const raw = c.title ?? c.value;
    allTexts[r.key] = toMl(raw);
  }
  const texts: Record<string, string> = {};
  for (const [key, ml] of Object.entries(allTexts)) {
    texts[key] = ml[lang] || ml.vi || ml.en || ml.kr || '';
  }

  return {
    rooms,
    amenities,
    testimonials,
    galleryImages,
    stats,
    texts,
    loading,
    reload: load,
  };
}
