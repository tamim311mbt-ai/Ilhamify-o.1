import { Clapperboard, Image as ImageIcon, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { BrandKitState, StudioTab } from '../types/studio';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  activeTab: StudioTab;
  onSelectTab: (tab: StudioTab) => void;
  onOpenBrandKit: () => void;
  brandKit: BrandKitState;
}

const DESKTOP_TABS: { id: StudioTab; label: string }[] = [
  { id: 'captions', label: 'ক্যাপশন জেনারেটর' },
  { id: 'card', label: 'কার্ড মেকার' },
  { id: 'reel', label: 'রিল মেকার' },
];

export function Header({
  activeTab,
  onSelectTab,
  onOpenBrandKit,
  brandKit,
}: HeaderProps) {
  const hasBrandSetup =
    (brandKit.showHandle && brandKit.handleText.trim().length > 0) ||
    (brandKit.showLogo && Boolean(brandKit.logoDataUrl));

  return (
    <>
      {/* ডেস্কটপ টপ বার */}
      <header className="hidden md:block bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          {/* ব্র্যান্ড নাম ও লোগো */}
          <button
            type="button"
            onClick={() => onSelectTab('captions')}
            aria-label="Ilhamify ইলহামিফাই"
            className="flex items-center gap-2.5 shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700"
          >
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="Ilhamify ইলহামিফাই"
              className="h-9 w-auto object-contain"
            />
            <span className="sr-only">Ilhamify ইলহামিফাই</span>
          </button>

          {/* নেভিগেশন ট্যাব */}
          <nav aria-label="মূল ওয়ার্কস্পেস" className="flex items-center gap-8">
            {DESKTOP_TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  className={`relative py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700 ${
                    active ? 'text-teal-800' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                  {active && (
                    <motion.span
                      layoutId="desktop-nav-underline"
                      transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                      className="absolute left-0 right-0 bottom-0 h-0.5 bg-teal-700 rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* কাস্টম নাম, লোগো ও অ্যাপ ইনস্টল অ্যাকশন */}
          <div className="flex items-center gap-2.5 shrink-0">
            <PWAInstallButton />
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={onOpenBrandKit}
              className="px-4 py-2 text-sm font-medium text-white bg-teal-700 rounded-lg hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              {hasBrandSetup ? 'কাস্টম নাম ও লোগো' : 'নাম ও লোগো যোগ করুন'}
            </motion.button>
          </div>
        </div>
      </header>

      {/* মোবাইল হেডার */}
      <header className="md:hidden bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onSelectTab('captions')}
          aria-label="Ilhamify ইলহামিফাই"
          className="flex items-center shrink-0"
        >
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt="Ilhamify ইলহামিফাই"
            className="h-8 w-auto object-contain"
          />
          <span className="sr-only">Ilhamify ইলহামিফাই</span>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <PWAInstallButton compact />
          <motion.button
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={onOpenBrandKit}
            className="px-3.5 py-2 min-h-[40px] text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 rounded-lg whitespace-nowrap shrink-0"
          >
            কাস্টম নাম ও লোগো
          </motion.button>
        </div>
      </header>

      {/* মোবাইল বটম নেভিগেশন বার */}
      <nav
        aria-label="মোবাইল নেভিগেশন"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe"
      >
        <div className="grid grid-cols-3 h-16">
          <motion.button
            whileTap={{ scale: 0.94 }}
            type="button"
            onClick={() => onSelectTab('captions')}
            className={`relative flex flex-col items-center justify-center gap-1 min-h-[44px] transition-colors ${
              activeTab === 'captions' ? 'text-teal-700' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {activeTab === 'captions' && (
              <motion.span
                layoutId="mobile-nav-indicator"
                transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                className="absolute top-0 w-10 h-0.5 bg-teal-700 rounded-full"
              />
            )}
            <Sparkles className="w-5 h-5" strokeWidth={activeTab === 'captions' ? 2.25 : 1.75} />
            <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">
              ক্যাপশন জেনারেটর
            </span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.94 }}
            type="button"
            onClick={() => onSelectTab('card')}
            className={`relative flex flex-col items-center justify-center gap-1 min-h-[44px] transition-colors ${
              activeTab === 'card' ? 'text-teal-700' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {activeTab === 'card' && (
              <motion.span
                layoutId="mobile-nav-indicator"
                transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                className="absolute top-0 w-10 h-0.5 bg-teal-700 rounded-full"
              />
            )}
            <ImageIcon className="w-5 h-5" strokeWidth={activeTab === 'card' ? 2.25 : 1.75} />
            <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">
              কার্ড মেকার
            </span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.94 }}
            type="button"
            onClick={() => onSelectTab('reel')}
            className={`relative flex flex-col items-center justify-center gap-1 min-h-[44px] transition-colors ${
              activeTab === 'reel' ? 'text-teal-700' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {activeTab === 'reel' && (
              <motion.span
                layoutId="mobile-nav-indicator"
                transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                className="absolute top-0 w-10 h-0.5 bg-teal-700 rounded-full"
              />
            )}
            <Clapperboard className="w-5 h-5" strokeWidth={activeTab === 'reel' ? 2.25 : 1.75} />
            <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">
              রিল মেকার
            </span>
          </motion.button>
        </div>
      </nav>
    </>
  );
}
