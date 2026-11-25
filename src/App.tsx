import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useRef, useState } from 'react';
import { BrandKitDrawer } from './components/BrandKitDrawer';
import { CaptionGeneratorView } from './components/CaptionGeneratorView';
import { CardStudioView } from './components/CardStudioView';
import { Header } from './components/Header';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ReelMakerView } from './components/ReelMakerView';
import { SiteFooter } from './components/SiteFooter';
import { WelcomeModal } from './components/WelcomeModal';
import { CAPTIONS_LIBRARY } from './data/captions';
import { useBrandKit } from './hooks/useBrandKit';
import { StudioTab } from './types/studio';

const VIEW_TRANSITION = {
  duration: 0.18,
  ease: [0.16, 1, 0.3, 1] as const,
};

const DOWNLOAD_COUNT_KEY = 'ilhamify_download_count_v1';

function isRunningInInstalledAppOrWebView(): boolean {
  if (typeof window === 'undefined') return false;

  // PWA / Standalone / TWA ডিসপ্লে মোড যাচাই
  const isStandaloneDisplay =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;

  if (isStandaloneDisplay) return true;

  // Android TWA / অ্যাপ রেফারার যাচাই
  if (typeof document !== 'undefined' && document.referrer.startsWith('android-app://')) {
    return true;
  }

  // Android WebView ও APK র‍্যাপার User-Agent যাচাই
  const ua = window.navigator.userAgent || '';
  const isWebViewUA =
    /; wv\)/i.test(ua) ||
    /\bwv\b/i.test(ua) ||
    /WebIntoApp/i.test(ua) ||
    /WebViewGold|Appilix|AppsGeyser|AppMySite|Median|GoNative|Capacitor|Cordova|Crosswalk/i.test(
      ua
    ) ||
    (/Android/i.test(ua) && /Version\/[\d.]+.*Chrome\//i.test(ua));

  if (isWebViewUA) return true;

  // নেটিভ WebView ব্রিজ গ্লোবাল যাচাই
  const win = window as unknown as Record<string, unknown>;
  if (
    Boolean(win.ReactNativeWebView) ||
    Boolean(win.Capacitor) ||
    Boolean(win.cordova) ||
    Boolean(win.AndroidInterface) ||
    Boolean(win.WebIntoApp)
  ) {
    return true;
  }

  // ঐচ্ছিক URL প্যারামিটার (যেমন ?app=1 বা ?webview=1)
  try {
    const params = new URLSearchParams(window.location.search);
    if (
      params.get('app') === '1' ||
      params.get('apk') === '1' ||
      params.get('webview') === '1' ||
      params.get('standalone') === '1'
    ) {
      return true;
    }
  } catch {
    // URL পার্সিং ত্রুটি উপেক্ষা করুন
  }

  return false;
}

export default function App() {
  const isInApp = isRunningInInstalledAppOrWebView();
  const [activeTab, setActiveTab] = useState<StudioTab>('captions');
  const [activeCaption, setActiveCaption] = useState<string>(CAPTIONS_LIBRARY[0].text);
  const [activeAttribution, setActiveAttribution] = useState<string>(
    CAPTIONS_LIBRARY[0].attribution
  );
  const [brandDrawerOpen, setBrandDrawerOpen] = useState<boolean>(false);
  const [welcomeOpen, setWelcomeOpen] = useState<boolean>(() => !isInApp);
  const [welcomeContext, setWelcomeContext] = useState<'startup' | 'download'>('startup');
  const downloadCountRef = useRef<number>((() => {
    try {
      const raw = localStorage.getItem(DOWNLOAD_COUNT_KEY);
      const parsed = raw ? parseInt(raw, 10) : 0;
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    } catch {
      return 0;
    }
  })());

  const handleDownloadComplete = () => {
    if (isInApp || isRunningInInstalledAppOrWebView() || welcomeOpen) return;
    const nextCount = downloadCountRef.current + 1;
    downloadCountRef.current = nextCount;
    try {
      localStorage.setItem(DOWNLOAD_COUNT_KEY, String(nextCount));
    } catch {
      // স্টোরেজ ত্রুটি উপেক্ষা করুন
    }

    // প্রথম ডাউনলোডে এবং এরপর প্রতি ৩ বার ডাউনলোডের পর পপআপ দেখান
    if (nextCount === 1 || nextCount % 3 === 0) {
      setWelcomeContext('download');
      setWelcomeOpen(true);
    }
  };

  const { brandKit, updateBrandKit, resetBrandKit } = useBrandKit();

  const handleSendToCard = (caption: string, attribution: string) => {
    setActiveCaption(caption);
    setActiveAttribution(attribution);
    setActiveTab('card');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSendToReel = (caption: string, attribution: string) => {
    setActiveCaption(caption);
    setActiveAttribution(attribution);
    setActiveTab('reel');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Header
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenBrandKit={() => setBrandDrawerOpen(true)}
          brandKit={brandKit}
        />

        <main className="flex-1 pb-4 md:pb-8">
          <AnimatePresence mode="wait" initial={false}>
            {activeTab === 'captions' && (
              <motion.div
                key="captions"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={VIEW_TRANSITION}
              >
                <CaptionGeneratorView
                  activeCaption={activeCaption}
                  activeAttribution={activeAttribution}
                  onChangeCaption={setActiveCaption}
                  onChangeAttribution={setActiveAttribution}
                  onSendToCard={handleSendToCard}
                  onSendToReel={handleSendToReel}
                />
              </motion.div>
            )}

            {activeTab === 'card' && (
              <motion.div
                key="card"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={VIEW_TRANSITION}
              >
                <CardStudioView
                  caption={activeCaption}
                  attribution={activeAttribution}
                  onChangeCaption={setActiveCaption}
                  onChangeAttribution={setActiveAttribution}
                  brandKit={brandKit}
                  onUpdateBrandKit={updateBrandKit}
                  onOpenBrandKit={() => setBrandDrawerOpen(true)}
                  onSendToReel={() => {
                    setActiveTab('reel');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onDownloadComplete={handleDownloadComplete}
                />
              </motion.div>
            )}

            {activeTab === 'reel' && (
              <motion.div
                key="reel"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={VIEW_TRANSITION}
              >
                <ReelMakerView
                  caption={activeCaption}
                  attribution={activeAttribution}
                  onChangeCaption={setActiveCaption}
                  onChangeAttribution={setActiveAttribution}
                  brandKit={brandKit}
                  onUpdateBrandKit={updateBrandKit}
                  onOpenBrandKit={() => setBrandDrawerOpen(true)}
                  onDownloadComplete={handleDownloadComplete}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <SiteFooter />

        <OfflineIndicator />

        {!isInApp && (
          <WelcomeModal
            open={welcomeOpen}
            triggerContext={welcomeContext}
            onClose={() => setWelcomeOpen(false)}
          />
        )}

        <BrandKitDrawer
          open={brandDrawerOpen}
          onClose={() => setBrandDrawerOpen(false)}
          brandKit={brandKit}
          onUpdate={updateBrandKit}
          onReset={resetBrandKit}
        />
      </div>
    </MotionConfig>
  );
}
