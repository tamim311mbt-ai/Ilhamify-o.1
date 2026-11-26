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
}

const listeners = new Set<() => void>();
let initialized = false;

function detectInitialBrowserKind(): BrowserInstallKind {
  if (typeof window === 'undefined') return 'other';
  const ua = window.navigator.userAgent || '';
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  if (/firefox|fxios/i.test(ua)) return 'firefox';
  if (/chrome|crios|edg/i.test(ua)) return 'chromium';
  return 'other';
}

let state: PwaStoreState = {
  deferredPrompt: null,
  isInstalled: isRunningInInstalledAppOrWebView(),
  browserKind: detectInitialBrowserKind(),
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
          setState({ browserKind: 'brave' });
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
    browserKind: snapshot.browserKind,
    install,
  };
}
