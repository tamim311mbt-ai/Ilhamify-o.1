import { BrandKitState, StudioTab } from '../types/studio';
import { Clapperboard, Image as ImageIcon, Sparkles } from 'lucide-react';

interface HeaderProps {
  activeTab: StudioTab;
  onSelectTab: (tab: StudioTab) => void;
  onOpenBrandKit: () => void;
  brandKit: BrandKitState;
}

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
      {/* Desktop Top Bar: Strict 3-zone contract */}
      <header className="hidden md:block bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <button
            type="button"
            onClick={() => onSelectTab('captions')}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700"
          >
            CaptionCraft Studio
          </button>

          {/* Zone 2: Clean single-line text navigation links */}
          <nav aria-label="Studio workspace" className="flex items-center gap-8">
            <button
              type="button"
              onClick={() => onSelectTab('captions')}
              className={`py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 border-b-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700 ${
                activeTab === 'captions'
                  ? 'text-teal-800 border-teal-700'
                  : 'text-slate-600 border-transparent hover:text-slate-900'
              }`}
            >
              Caption Generator
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('card')}
              className={`py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 border-b-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700 ${
                activeTab === 'card'
                  ? 'text-teal-800 border-teal-700'
                  : 'text-slate-600 border-transparent hover:text-slate-900'
              }`}
            >
              Card Studio
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('reel')}
              className={`py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 border-b-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700 ${
                activeTab === 'reel'
                  ? 'text-teal-800 border-teal-700'
                  : 'text-slate-600 border-transparent hover:text-slate-900'
              }`}
            >
              Reel Maker
            </button>
          </nav>

          {/* Zone 3: 1 primary action button */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={onOpenBrandKit}
              className="px-4 py-2 text-sm font-medium text-white bg-teal-700 rounded-lg hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              {hasBrandSetup ? 'Watermark & Logo' : 'Add Logo & Name'}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Compact Header (non-sticky so fixed bottom nav stays well under 15% cap) */}
      <header className="md:hidden bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between gap-4">
        <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
          CaptionCraft Studio
        </span>
        <button
          type="button"
          onClick={onOpenBrandKit}
          className="px-3.5 py-2 min-h-[40px] text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 rounded-lg whitespace-nowrap shrink-0 active:scale-[0.98] transition-transform"
        >
          Brand Logo
        </button>
      </header>

      {/* Mobile Fixed Bottom Tab Bar (< 9% viewport height, >= 44px touch targets) */}
      <nav
        aria-label="Mobile workspace tabs"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe"
      >
        <div className="grid grid-cols-3 h-16">
          <button
            type="button"
            onClick={() => onSelectTab('captions')}
            className={`flex flex-col items-center justify-center gap-1 min-h-[44px] transition-colors ${
              activeTab === 'captions' ? 'text-teal-700' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-5 h-5" strokeWidth={activeTab === 'captions' ? 2.25 : 1.75} />
            <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">
              Captions
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('card')}
            className={`flex flex-col items-center justify-center gap-1 min-h-[44px] transition-colors ${
              activeTab === 'card' ? 'text-teal-700' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-5 h-5" strokeWidth={activeTab === 'card' ? 2.25 : 1.75} />
            <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">
              Card Studio
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('reel')}
            className={`flex flex-col items-center justify-center gap-1 min-h-[44px] transition-colors ${
              activeTab === 'reel' ? 'text-teal-700' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Clapperboard className="w-5 h-5" strokeWidth={activeTab === 'reel' ? 2.25 : 1.75} />
            <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">
              Reel Maker
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
