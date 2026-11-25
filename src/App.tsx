import { useState } from 'react';
import { BrandKitDrawer } from './components/BrandKitDrawer';
import { CaptionGeneratorView } from './components/CaptionGeneratorView';
import { CardStudioView } from './components/CardStudioView';
import { Header } from './components/Header';
import { ReelMakerView } from './components/ReelMakerView';
import { CAPTIONS_LIBRARY } from './data/captions';
import { useBrandKit } from './hooks/useBrandKit';
import { StudioTab } from './types/studio';

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
        {activeTab === 'captions' && (
          <CaptionGeneratorView
            activeCaption={activeCaption}
            activeAttribution={activeAttribution}
            onChangeCaption={setActiveCaption}
            onChangeAttribution={setActiveAttribution}
            onSendToCard={handleSendToCard}
            onSendToReel={handleSendToReel}
          />
        )}

        {activeTab === 'card' && (
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
        )}

        {activeTab === 'reel' && (
          <ReelMakerView
            caption={activeCaption}
            attribution={activeAttribution}
            onChangeCaption={setActiveCaption}
            onChangeAttribution={setActiveAttribution}
            brandKit={brandKit}
            onUpdateBrandKit={updateBrandKit}
            onOpenBrandKit={() => setBrandDrawerOpen(true)}
          />
        )}
      </main>

      <footer className="hidden md:block border-t border-slate-200 bg-white py-5">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-xs text-slate-500">
          <span>ক্যাপশনক্রাফট স্টুডিও</span>
          <span>৬৫০টি বাংলা ক্যাপশন · কোট কার্ড · ৯:১৬ রিল ভিডিও</span>
        </div>
      </footer>

      <BrandKitDrawer
        open={brandDrawerOpen}
        onClose={() => setBrandDrawerOpen(false)}
        brandKit={brandKit}
        onUpdate={updateBrandKit}
        onReset={resetBrandKit}
      />
    </div>
  );
}
