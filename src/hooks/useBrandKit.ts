import { useEffect, useState } from 'react';
import { BrandKitState } from '../types/studio';

const STORAGE_KEY = 'captioncraft_brand_kit_bn_v1';

const DEFAULT_BRAND_KIT: BrandKitState = {
  handleText: '@Ilhamify',
  showHandle: true,
  handlePosition: 'bottom-center',
  handleOpacity: 0.85,
  logoDataUrl: null,
  showLogo: true,
  logoPosition: 'top-center',
  logoSize: 84,
  logoOpacity: 0.92,
};

export function useBrandKit() {
  const [brandKit, setBrandKit] = useState<BrandKitState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<BrandKitState>;
        if (parsed.handleText === '@ক্যাপশনক্রাফট') {
          parsed.handleText = '@Ilhamify';
        }
        return { ...DEFAULT_BRAND_KIT, ...parsed };
      }
    } catch {
      // স্টোরেজ ত্রুটি উপেক্ষা করুন
    }
    return DEFAULT_BRAND_KIT;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(brandKit));
    } catch {
      // স্টোরেজ কোটা ত্রুটি উপেক্ষা করুন
    }
  }, [brandKit]);

  const updateBrandKit = (patch: Partial<BrandKitState>) => {
    setBrandKit((prev) => ({ ...prev, ...patch }));
  };

  const resetBrandKit = () => {
    setBrandKit(DEFAULT_BRAND_KIT);
  };

  return { brandKit, updateBrandKit, resetBrandKit };
}
