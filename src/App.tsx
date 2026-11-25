import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useState } from 'react';
import { BrandKitDrawer } from './components/BrandKitDrawer';
import { CaptionGeneratorView } from './components/CaptionGeneratorView';
import { CardStudioView } from './components/CardStudioView';
import { Header } from './components/Header';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ReelMakerView } from './components/ReelMakerView';
import { CAPTIONS_LIBRARY } from './data/captions';
import { useBrandKit } from './hooks/useBrandKit';
import { StudioTab } from './types/studio';

const VIEW_TRANSITION = {
  duration: 0.18,
  ease: [0.16, 1, 0.3, 1] as const,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<StudioTab>('captions');
  const [activeCaption, setActiveCaption] = useState<string>(CAPTIONS_LIBRARY[0].text);
  const [activeAttribution, setActiveAttribution] = useState<string>(
    CAPTIONS_LIBRARY[0].attribution
  );
  const [brandDrawerOpen, setBrandDrawerOpen] = useState<boolean>(false);

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

        <main className="flex-1 pb-24 md:pb-12">
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
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className="hidden md:block border-t border-slate-200 bg-white py-5">
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2.5">
              <img
                src={`${import.meta.env.BASE_URL}logo.png`}
                alt="Ilhamify ইলহামিফাই"
                className="h-6 w-auto object-contain"
              />
              <span className="font-medium text-slate-700">Ilhamify ইলহামিফাই</span>
            </div>
            <span>৬৫০টি বাংলা ক্যাপশন · কোট কার্ড · ৯:১৬ রিল ভিডিও</span>
          </div>
        </footer>

        <OfflineIndicator />

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
