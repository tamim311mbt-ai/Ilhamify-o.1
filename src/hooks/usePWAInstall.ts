import { useEffect, useState } from 'react';
import { isRunningInInstalledAppOrWebView } from '../utils/appEnvironment';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export type BrowserInstallKind = 'ios' | 'firefox' | 'brave' | 'chromium' | 'other';

interface PwaStoreState {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstalled: boolean;
  browserKind: BrowserInstallKind;
  isChrome: boolean;
}

interface NavigatorUADataLike {
  brands?: Array<{ brand: string; version: string }>;
}

const NON_CHROME_UA_RE =
  /edg|opr|opera|samsungbrowser|ucbrowser|duckduckgo|yabrowser|miuibrowser|vivaldi|fban|fbav|fb_iab|instagram|line\/|micromessenger|twitter|linkedinapp|snapchat|bytedancewebview/i;

const listeners = new Set<() => void>();
let initialized = false;

function detectInitialBrowserInfo(): {
  browserKind: BrowserInstallKind;
  isChrome: boolean;
} {
  if (typeof window === 'undefined') {
    return { browserKind: 'other', isChrome: false };
  }
  const ua = window.navigator.userAgent || '';
  if (/iphone|ipad|ipod/i.test(ua)) {
    return { browserKind: 'ios', isChrome: false };
  }
  if (/firefox|fxios/i.test(ua)) {
    return { browserKind: 'firefox', isChrome: false };
  }

  const uaData = (window.navigator as Navigator & { userAgentData?: NavigatorUADataLike })
    .userAgentData;
  const brands = uaData?.brands ?? [];
  if (brands.some((b) => /brave/i.test(b.brand))) {
    return { browserKind: 'brave', isChrome: false };
  }

  const hasGoogleChromeBrand = brands.some((b) => /google chrome/i.test(b.brand));
  const hasChromeUA = /chrome/i.test(ua) && !NON_CHROME_UA_RE.test(ua);

  if (hasGoogleChromeBrand || hasChromeUA) {
    return { browserKind: 'chromium', isChrome: true };
  }
  if (/edg|opr|opera|samsungbrowser|crios/i.test(ua)) {
    return { browserKind: 'chromium', isChrome: false };
  }
  return { browserKind: 'other', isChrome: false };
}

const initialBrowserInfo = detectInitialBrowserInfo();

let state: PwaStoreState = {
  deferredPrompt: null,
  isInstalled: isRunningInInstalledAppOrWebView(),
  browserKind: initialBrowserInfo.browserKind,
  isChrome: initialBrowserInfo.isChrome,
};

function emitChange() {
  listeners.forEach((listener) => listener());
}

function setState(patch: Partial<PwaStoreState>) {
  state = { ...state, ...patch };
  emitChange();
}

function initPwaListeners() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  const ua = window.navigator.userAgent || '';
  const isIOSDevice = /iphone|ipad|ipod/i.test(ua);
  const isFirefox = /firefox|fxios/i.test(ua);

  const navWithBrave = window.navigator as Navigator & {
    brave?: { isBrave?: () => Promise<boolean> };
  };
  if (!isIOSDevice && !isFirefox && typeof navWithBrave.brave?.isBrave === 'function') {
    navWithBrave.brave
      .isBrave()
      .then((isBraveBrowser) => {
        if (isBraveBrowser) {
          setState({ browserKind: 'brave', isChrome: false });
        }
      })
      .catch(() => {});
  }

  const standaloneQuery = window.matchMedia('(display-mode: standalone)');
  standaloneQuery.addEventListener?.('change', () => {
    if (isRunningInInstalledAppOrWebView()) {
      setState({ isInstalled: true, deferredPrompt: null });
    }
  });

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    setState({ deferredPrompt: e as BeforeInstallPromptEvent });
  });

  window.addEventListener('appinstalled', () => {
    setState({ isInstalled: true, deferredPrompt: null });
  });
}

if (typeof window !== 'undefined') {
  initPwaListeners();
}

export function usePWAInstall() {
  const [snapshot, setSnapshot] = useState<PwaStoreState>(state);

  useEffect(() => {
    initPwaListeners();
    setSnapshot(state);
    const onStoreChange = () => setSnapshot(state);
    listeners.add(onStoreChange);
    return () => {
      listeners.delete(onStoreChange);
    };
  }, []);

  const install = async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    const promptEvent = state.deferredPrompt;
    if (!promptEvent) return 'unavailable';
    try {
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      setState({ deferredPrompt: null });
      if (outcome === 'accepted') {
        setState({ isInstalled: true });
        return 'accepted';
      }
      return 'dismissed';
    } catch {
      setState({ deferredPrompt: null });
      return 'unavailable';
    }
  };

  return {
    isInstallable: Boolean(snapshot.deferredPrompt),
    isInstalled: snapshot.isInstalled,
    isIOS: snapshot.browserKind === 'ios',
    isChrome: snapshot.isChrome,
    browserKind: snapshot.browserKind,
    install,
  };
}
