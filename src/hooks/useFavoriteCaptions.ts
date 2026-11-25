import { useEffect, useState } from 'react';
import { CaptionCategory, CaptionItem } from '../types/studio';

const FAVORITE_IDS_KEY = 'captioncraft_favorite_ids_bn_v1';
const CUSTOM_SAVED_KEY = 'captioncraft_custom_saved_bn_v1';

export function useFavoriteCaptions() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(FAVORITE_IDS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // স্টোরেজ ত্রুটি উপেক্ষা করুন
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
      // স্টোরেজ ত্রুটি উপেক্ষা করুন
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITE_IDS_KEY, JSON.stringify(favoriteIds));
    } catch {
      // স্টোরেজ ত্রুটি উপেক্ষা করুন
    }
  }, [favoriteIds]);

  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_SAVED_KEY, JSON.stringify(customSaved));
    } catch {
      // স্টোরেজ ত্রুটি উপেক্ষা করুন
    }
  }, [customSaved]);

  const toggleFavoriteId = (id: string) => {
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
    category: CaptionCategory
  ) => {
    const clean = text.trim();
    if (!clean) return null;

    const existing = customSaved.find((c) => c.text.trim() === clean);
    if (existing) return existing.id;

    const newItem: CaptionItem = {
      id: `custom-${Date.now()}`,
      category,
      subTopic: category === 'islamic' ? 'sabr' : 'confidence',
      text: clean,
      attribution: attribution.trim() || 'নিজস্ব ক্যাপশন',
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
