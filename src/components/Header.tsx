import { Clapperboard, Image as ImageIcon, Moon, Sparkles, Sun } from 'lucide-react';
import { motion } from 'motion/react';
import { BrandKitState, StudioTab } from '../types/studio';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  activeTab: StudioTab;
  onSelectTab: (tab: StudioTab) => void;
  onOpenBrandKit: () => void;
  brandKit: BrandKitState;
  isDark: boolean;
  onToggleTheme: () => void;
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
  isDark,
  onToggleTheme,
}: HeaderProps) {
  const hasBrandSetup =
    (brandKit.showHandle && brandKit.handleText.trim().length > 0) ||
    (brandKit.showLogo && Boolean(brandKit.logoDataUrl));

  return (
    <>
      {/* ডেস্কটপ স্থির (Fixed) টপ বার */}
      <header className="fixed top-0 left-0 right-0 z-40 hidden md:block bg-white/92 dark:bg-[#111B1B]/92 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800/90 shadow-[0_1px_12px_rgba(18,27,27,0.04)] dark:shadow-[0_1px_16px_rgba(0,0,0,0.38)] transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4 lg:gap-8">
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
              className="h-9 w-auto object-contain transition-[filter] duration-200 dark:brightness-[1.85] dark:saturate-[0.7]"
            />
            <span className="sr-only">Ilhamify ইলহামিফাই</span>
          </button>

          {/* নেভিগেশন ট্যাব */}
          <nav aria-label="মূল ওয়ার্কস্পেস" className="flex items-center gap-5 lg:gap-8">
            {DESKTOP_TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  className={`relative py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700 ${
                    active
                      ? 'text-teal-800 dark:text-teal-200'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                  {active && (
                    <motion.span
                      layoutId="desktop-nav-underline"
                      transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                      className="absolute left-0 right-0 bottom-0 h-0.5 bg-teal-700 dark:bg-teal-400 rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* থিম সুইচার, অ্যাপ ইনস্টল ও কাস্টম নাম/লোগো অ্যাকশন */}
          <div className="flex items-center gap-2 lg:gap-2.5 shrink-0">
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={onToggleTheme}
              aria-label={isDark ? 'লাইট (হোয়াইট) মোডে পরিবর্তন করুন' : 'ডার্ক মোডে পরিবর্তন করুন'}
              aria-pressed={isDark}
              title={isDark ? 'লাইট মোড চালু করুন' : 'ডার্ক মোড চালু করুন'}
              className="min-h-[38px] px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#192828] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#213333] transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              {isDark ? (
                <>
                  <Sun className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>লাইট</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>ডার্ক</span>
                </>
              )}
            </motion.button>

            <PWAInstallButton />

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={onOpenBrandKit}
              className="px-3.5 lg:px-4 py-2 text-sm font-medium text-white bg-teal-700 rounded-lg hover:bg-teal-800 dark:hover:bg-teal-500 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              {hasBrandSetup ? 'কাস্টম নাম ও লোগো' : 'নাম ও লোগো যোগ করুন'}
            </motion.button>
          </div>
        </div>
      </header>

      {/* মোবাইল স্থির (Fixed) হেডার */}
      <header className="fixed top-0 left-0 right-0 z-40 md:hidden bg-white/92 dark:bg-[#111B1B]/92 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800/90 px-3.5 sm:px-4 h-14 flex items-center justify-between gap-2 shadow-[0_1px_10px_rgba(18,27,27,0.04)] dark:shadow-[0_1px_14px_rgba(0,0,0,0.38)] transition-colors duration-200">
        <button
          type="button"
          onClick={() => onSelectTab('captions')}
          aria-label="Ilhamify ইলহামিফাই"
          className="flex items-center shrink-0"
        >
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt="Ilhamify ইলহামিফাই"
            className="h-7 sm:h-8 w-auto object-contain transition-[filter] duration-200 dark:brightness-[1.85] dark:saturate-[0.7]"
          />
          <span className="sr-only">Ilhamify ইলহামিফাই</span>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <motion.button
            whileTap={{ scale: 0.94 }}
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? 'লাইট (হোয়াইট) মোডে পরিবর্তন করুন' : 'ডার্ক মোডে পরিবর্তন করুন'}
            aria-pressed={isDark}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#192828] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#213333] transition-colors shrink-0"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 text-teal-700" />
            )}
          </motion.button>

          <PWAInstallButton compact />

          <motion.button
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={onOpenBrandKit}
            className="px-3 sm:px-3.5 py-2 min-h-[40px] text-xs font-semibold text-teal-800 dark:text-teal-100 bg-teal-50 dark:bg-teal-900/55 border border-teal-200 dark:border-teal-700/70 rounded-lg whitespace-nowrap shrink-0"
          >
            <span className="hidden sm:inline">কাস্টম </span>নাম ও লোগো
          </motion.button>
        </div>
      </header>

      {/* মোবাইল বটম নেভিগেশন বার */}
      <nav
        aria-label="মোবাইল নেভিগেশন"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#111B1B]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe transition-colors duration-200"
      >
        <div className="grid grid-cols-3 h-16">
          <motion.button
            whileTap={{ scale: 0.94 }}
            type="button"
            onClick={() => onSelectTab('captions')}
            className={`relative flex flex-col items-center justify-center gap-1 min-h-[44px] transition-colors ${
              activeTab === 'captions'
                ? 'text-teal-700 dark:text-teal-300'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            {activeTab === 'captions' && (
              <motion.span
                layoutId="mobile-nav-indicator"
                transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                className="absolute top-0 w-10 h-0.5 bg-teal-700 dark:bg-teal-400 rounded-full"
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
              activeTab === 'card'
                ? 'text-teal-700 dark:text-teal-300'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            {activeTab === 'card' && (
              <motion.span
                layoutId="mobile-nav-indicator"
                transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                className="absolute top-0 w-10 h-0.5 bg-teal-700 dark:bg-teal-400 rounded-full"
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
              activeTab === 'reel'
                ? 'text-teal-700 dark:text-teal-300'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            {activeTab === 'reel' && (
              <motion.span
                layoutId="mobile-nav-indicator"
                transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                className="absolute top-0 w-10 h-0.5 bg-teal-700 dark:bg-teal-400 rounded-full"
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
