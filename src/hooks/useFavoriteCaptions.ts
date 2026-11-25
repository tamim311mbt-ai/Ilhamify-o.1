import { useEffect, useState } from 'react';
import { CaptionItem } from '../types/studio';

const FAVORITE_IDS_KEY = 'captioncraft_favorite_ids_v1';
const CUSTOM_SAVED_KEY = 'captioncraft_custom_saved_v1';

export function useFavoriteCaptions() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(FAVORITE_IDS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage errors
    }
    return [];
  });

  const [customSaved, setCustomSaved] = useState<CaptionItem[]>(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_SAVED_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage errors
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITE_IDS_KEY, JSON.stringify(favoriteIds));
    } catch {
      // Ignore storage errors
    }
  }, [favoriteIds]);

  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_SAVED_KEY, JSON.stringify(customSaved));
    } catch {
      // Ignore storage errors
    }
  }, [customSaved]);

  const toggleFavoriteId = (id: string) => {
    // If it's a custom saved item being unstarred, remove it from customSaved as well
    if (id.startsWith('custom-')) {
      setCustomSaved((prev) => prev.filter((item) => item.id !== id));
      return;
    }
    setFavoriteIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [id, ...prev]
    );
  };

  const isFavorite = (id: string) => {
    if (id.startsWith('custom-')) {
      return customSaved.some((item) => item.id === id);
    }
    return favoriteIds.includes(id);
  };

  const saveCustomCaption = (
    text: string,
    attribution: string,
    category: 'islamic' | 'motivational'
  ) => {
    const clean = text.trim();
    if (!clean) return null;

    const existing = customSaved.find(
      (c) => c.en.trim() === clean || c.bn.trim() === clean
    );
    if (existing) return existing.id;

    const newItem: CaptionItem = {
      id: `custom-${Date.now()}`,
      category,
      mood: 'faith',
      en: clean,
      bn: clean,
      attributionEn: attribution.trim() || 'Custom Caption',
      attributionBn: attribution.trim() || 'নিজস্ব ক্যাপশন',
    };
    setCustomSaved((prev) => [newItem, ...prev]);
    return newItem.id;
  };

  return {
    favoriteIds,
    customSaved,
    toggleFavoriteId,
    isFavorite,
    saveCustomCaption,
  };
}
