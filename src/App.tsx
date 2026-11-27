import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useRef, useState } from 'react';
import { BrandKitDrawer } from './components/BrandKitDrawer';
import { CaptionGeneratorView } from './components/CaptionGeneratorView';
import { CardStudioView } from './components/CardStudioView';
import { FloatingCaptionsBackdrop } from './components/FloatingCaptionsBackdrop';
import { Header } from './components/Header';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ReelMakerView } from './components/ReelMakerView';
import { SiteFooter } from './components/SiteFooter';
import { WelcomeModal } from './components/WelcomeModal';
import { CAPTIONS_LIBRARY } from './data/captions';
import { useBrandKit } from './hooks/useBrandKit';
import { usePWAInstall } from './hooks/usePWAInstall';
import { useTheme } from './hooks/useTheme';
import { StudioTab } from './types/studio';
import { isRunningInInstalledAppOrWebView } from './utils/appEnvironment';

const VIEW_TRANSITION = {
  duration: 0.18,
  ease: [0.16, 1, 0.3, 1] as const,
};

const DOWNLOAD_COUNT_KEY = 'ilhamify_download_count_v1';

export default function App() {
  const { isInstalled } = usePWAInstall();
  const isInApp = isInstalled || isRunningInInstalledAppOrWebView();
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
  const { isDark, toggleTheme } = useTheme();

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
      <div className="relative min-h-screen flex flex-col pt-14 md:pt-16 bg-slate-50 dark:bg-[#0D1515] text-slate-900 dark:text-slate-100 transition-colors duration-200 overflow-x-clip">
        <FloatingCaptionsBackdrop />
        <Header
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenBrandKit={() => setBrandDrawerOpen(true)}
          brandKit={brandKit}
          isDark={isDark}
          onToggleTheme={toggleTheme}
        />

        <main className="relative z-10 flex-1 pb-4 md:pb-8">
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
