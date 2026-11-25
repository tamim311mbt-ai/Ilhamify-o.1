import { useEffect, useState } from 'react';
import { BrandKitState } from '../types/studio';

const STORAGE_KEY = 'captioncraft_brand_kit_v1';

const DEFAULT_BRAND_KIT: BrandKitState = {
  handleText: '@captioncraft',
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
        return { ...DEFAULT_BRAND_KIT, ...JSON.parse(saved) };
      }
    } catch {
      // Ignore storage errors in restricted environments
    }
    return DEFAULT_BRAND_KIT;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(brandKit));
    } catch {
      // Ignore storage quota errors
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
