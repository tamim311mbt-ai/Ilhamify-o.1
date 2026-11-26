import { useEffect, useState } from 'react';
import { isRunningInInstalledAppOrWebView } from '../utils/appEnvironment';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export type BrowserInstallKind = 'ios' | 'firefox' | 'brave' | 'chromium' | 'other';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => isRunningInInstalledAppOrWebView());
  const [browserKind, setBrowserKind] = useState<BrowserInstallKind>('other');

  useEffect(() => {
    let active = true;
    setIsInstalled(isRunningInInstalledAppOrWebView());

    const ua = window.navigator.userAgent || '';
    const isIOSDevice = /iphone|ipad|ipod/i.test(ua);
    const isFirefox = /firefox|fxios/i.test(ua);

    if (isIOSDevice) {
      setBrowserKind('ios');
    } else if (isFirefox) {
      setBrowserKind('firefox');
    } else if (/chrome|crios|edg/i.test(ua)) {
      setBrowserKind('chromium');
    }

    // Brave ব্রাউজার শনাক্তকরণ (Brave UA-তে Chrome দেখালেও navigator.brave থাকে)
    const navWithBrave = window.navigator as Navigator & {
      brave?: { isBrave?: () => Promise<boolean> };
    };
    if (!isIOSDevice && !isFirefox && typeof navWithBrave.brave?.isBrave === 'function') {
      navWithBrave.brave
        .isBrave()
        .then((isBraveBrowser) => {
          if (active && isBraveBrowser) {
            setBrowserKind('brave');
          }
        })
        .catch(() => {});
    }

    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => {
      if (isRunningInInstalledAppOrWebView()) {
        setIsInstalled(true);
      }
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    standaloneQuery.addEventListener?.('change', handleDisplayModeChange);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      active = false;
      standaloneQuery.removeEventListener?.('change', handleDisplayModeChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!deferredPrompt) return 'unavailable';
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (outcome === 'accepted') {
        setIsInstalled(true);
        return 'accepted';
      }
      return 'dismissed';
    } catch {
      setDeferredPrompt(null);
      return 'unavailable';
    }
  };

  return {
    isInstallable: Boolean(deferredPrompt),
    isInstalled,
    isIOS: browserKind === 'ios',
    browserKind,
    install,
  };
}
