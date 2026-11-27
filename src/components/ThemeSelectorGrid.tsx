import { Check, Palette } from 'lucide-react';
import { useMemo, useState } from 'react';
import { BACKGROUND_THEMES, getThemeBackgroundCss } from '../data/themes';
import { BackgroundTheme } from '../types/studio';

type ThemeFilter = 'all' | 'premium' | 'dark' | 'light';

interface ThemeSelectorGridProps {
  selectedThemeId: string;
  activeTheme: BackgroundTheme;
  onSelectTheme: (themeId: string) => void;
}

const FILTER_OPTIONS: { id: ThemeFilter; label: string }[] = [
  { id: 'all', label: 'সবগুলো' },
  { id: 'premium', label: 'প্রিমিয়াম' },
  { id: 'dark', label: 'গাঢ় থিম' },
  { id: 'light', label: 'হালকা থিম' },
];

export function ThemeSelectorGrid({
  selectedThemeId,
  activeTheme,
  onSelectTheme,
}: ThemeSelectorGridProps) {
  const [filter, setFilter] = useState<ThemeFilter>('all');

  const filteredThemes = useMemo(() => {
    if (filter === 'premium') return BACKGROUND_THEMES.filter((t) => t.isPremium);
    if (filter === 'dark') return BACKGROUND_THEMES.filter((t) => t.isDark);
    if (filter === 'light') return BACKGROUND_THEMES.filter((t) => !t.isDark);
    return BACKGROUND_THEMES;
  }, [filter]);

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3.5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2 whitespace-nowrap">
          <Palette className="w-4 h-4 text-teal-700 shrink-0" />
          ব্যাকগ্রাউন্ড ও গ্রেডিয়েন্ট
        </h2>
        <span className="text-xs font-medium text-slate-600 truncate">{activeTheme.name}</span>
      </div>

      {/* দ্রুত থিম ফিল্টার */}
      <div
        role="tablist"
        aria-label="ব্যাকগ্রাউন্ড ধরন"
        className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl"
      >
        {FILTER_OPTIONS.map((opt) => {
          const isCurrent = filter === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={isCurrent}
              onClick={() => setFilter(opt.id)}
              className={`min-h-[36px] px-2 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap truncate ${
                isCurrent
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* গ্রেডিয়েন্ট ও কনট্রাস্ট প্রিভিউ গ্রিড */}
      <div className="max-h-[312px] overflow-y-auto p-1 -m-1">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {filteredThemes.map((t) => {
            const active = selectedThemeId === t.id;
            const bgStyle = getThemeBackgroundCss(t);

            return (
              <button
                key={t.id}
                type="button"
                title={t.name}
                aria-label={t.name}
                aria-pressed={active}
                onClick={() => onSelectTheme(t.id)}
                className={`group rounded-xl border overflow-hidden text-left transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 ${
                  active
                    ? 'ring-2 ring-teal-700 ring-offset-2 border-teal-700'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div
                  className="h-12 w-full px-2.5 flex items-center justify-between relative"
                  style={{ background: bgStyle }}
                >
                  <div className="flex flex-col gap-0.5">
                    <span
                      className="text-xs font-semibold leading-none tracking-tight"
                      style={{ color: t.textColor }}
                    >
                      অ আ
                    </span>
                    <span
                      className="block w-4 h-0.5 rounded-full opacity-90"
                      style={{ backgroundColor: t.accentColor }}
                    />
                  </div>
                  {active && (
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        t.isDark ? 'bg-white/20 text-white' : 'bg-slate-900/10 text-slate-900'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
                <div className="px-2 py-1.5 bg-white border-t border-slate-100">
                  <div
                    className={`text-[11px] font-medium truncate leading-snug ${
                      active ? 'text-teal-800 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    {t.name}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
