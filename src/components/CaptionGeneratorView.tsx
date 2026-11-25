import { useMemo, useState } from 'react';
import {
  Check,
  Clapperboard,
  Copy,
  Image as ImageIcon,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Star,
} from 'lucide-react';
import { CAPTIONS_LIBRARY } from '../data/captions';
import { MOOD_LABELS } from '../data/themes';
import { useFavoriteCaptions } from '../hooks/useFavoriteCaptions';
import {
  CaptionCategory,
  CaptionItem,
  CaptionLanguage,
  CaptionMood,
} from '../types/studio';

interface CaptionGeneratorViewProps {
  activeCaption: string;
  activeAttribution: string;
  onChangeCaption: (text: string) => void;
  onChangeAttribution: (text: string) => void;
  onSendToCard: (caption: string, attribution: string) => void;
  onSendToReel: (caption: string, attribution: string) => void;
}

const MOODS: CaptionMood[] = [
  'all',
  'patience',
  'gratitude',
  'faith',
  'discipline',
  'success',
  'resilience',
];

function shufflePick(pool: CaptionItem[], count: number, excludeIds: string[]): CaptionItem[] {
  if (pool.length === 0) return [];
  const fresh = pool.filter((item) => !excludeIds.includes(item.id));
  const source = fresh.length >= count ? [...fresh] : [...pool];

  for (let i = source.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [source[i], source[j]] = [source[j], source[i]];
  }
  return source.slice(0, Math.min(count, source.length));
}

type CategoryFilter = CaptionCategory | 'saved';

export function CaptionGeneratorView({
  activeCaption,
  activeAttribution,
  onChangeCaption,
  onChangeAttribution,
  onSendToCard,
  onSendToReel,
}: CaptionGeneratorViewProps) {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('islamic');
  const [language, setLanguage] = useState<CaptionLanguage>('en');
  const [mood, setMood] = useState<CaptionMood>('all');
  const [batchSize, setBatchSize] = useState<number>(5);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedEditor, setCopiedEditor] = useState<boolean>(false);

  const {
    favoriteIds,
    customSaved,
    toggleFavoriteId,
    isFavorite,
    saveCustomCaption,
  } = useFavoriteCaptions();

  const savedPool = useMemo(() => {
    const libraryFavorites = favoriteIds
      .map((id) => CAPTIONS_LIBRARY.find((item) => item.id === id))
      .filter((item): item is CaptionItem => Boolean(item));
    return [...customSaved, ...libraryFavorites];
  }, [favoriteIds, customSaved]);

  const totalSavedCount = savedPool.length;

  const filteredPool = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const source = categoryFilter === 'saved' ? savedPool : CAPTIONS_LIBRARY;

    return source.filter((item) => {
      if (categoryFilter !== 'saved' && item.category !== categoryFilter) return false;
      if (mood !== 'all' && item.mood !== mood) return false;
      if (q) {
        const hay = `${item.en} ${item.bn} ${item.attributionEn ?? ''} ${item.attributionBn ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [categoryFilter, savedPool, mood, searchQuery]);

  const [generatedList, setGeneratedList] = useState<CaptionItem[]>(() =>
    CAPTIONS_LIBRARY.filter((c) => c.category === 'islamic').slice(0, 5)
  );

  const handleCategoryChange = (nextCategory: CategoryFilter) => {
    setCategoryFilter(nextCategory);
    if (nextCategory === 'saved') return;

    const nextPool = CAPTIONS_LIBRARY.filter((item) => {
      if (item.category !== nextCategory) return false;
      if (mood !== 'all' && item.mood !== mood) return false;
      return true;
    });
    setGeneratedList(shufflePick(nextPool, batchSize, []));
  };

  const handleMoodChange = (nextMood: CaptionMood) => {
    setMood(nextMood);
    if (categoryFilter === 'saved') return;

    const nextPool = CAPTIONS_LIBRARY.filter((item) => {
      if (item.category !== categoryFilter) return false;
      if (nextMood !== 'all' && item.mood !== nextMood) return false;
      return true;
    });
    setGeneratedList(shufflePick(nextPool, batchSize, []));
  };

  const handleGenerate = (count: number) => {
    if (categoryFilter === 'saved') return;
    const exclude = generatedList.map((item) => item.id);
    const picked = shufflePick(filteredPool, count, exclude);
    setGeneratedList(picked);
  };

  const visibleCaptions =
    categoryFilter === 'saved' || searchQuery.trim() ? filteredPool : generatedList;

  // Check if current editor text matches an already-saved caption
  const matchingLibraryItem = useMemo(() => {
    const clean = activeCaption.trim();
    if (!clean) return null;
    return (
      CAPTIONS_LIBRARY.find(
        (c) => c.en.trim() === clean || c.bn.trim() === clean
      ) ?? null
    );
  }, [activeCaption]);

  const matchingCustomItem = useMemo(() => {
    const clean = activeCaption.trim();
    if (!clean) return null;
    return customSaved.find((c) => c.en.trim() === clean) ?? null;
  }, [activeCaption, customSaved]);

  const isEditorFavorited = Boolean(
    (matchingLibraryItem && isFavorite(matchingLibraryItem.id)) || matchingCustomItem
  );

  const handleToggleEditorFavorite = () => {
    if (!activeCaption.trim()) return;
    if (matchingLibraryItem) {
      toggleFavoriteId(matchingLibraryItem.id);
      return;
    }
    if (matchingCustomItem) {
      toggleFavoriteId(matchingCustomItem.id);
      return;
    }
    const targetCat: CaptionCategory =
      categoryFilter === 'motivational' ? 'motivational' : 'islamic';
    saveCustomCaption(activeCaption, activeAttribution, targetCat);
  };

  const handleCopyText = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId((curr) => (curr === id ? null : curr));
      }, 2000);
    } catch {
      // Fallback copy via temporary textarea
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId((curr) => (curr === id ? null : curr));
      }, 2000);
    }
  };

  const handleCopyEditor = async () => {
    const combined = activeAttribution.trim()
      ? `${activeCaption.trim()}\n— ${activeAttribution.trim()}`
      : activeCaption.trim();
    if (!combined) return;
    try {
      await navigator.clipboard.writeText(combined);
    } catch {
      // Ignore fallback error
    }
    setCopiedEditor(true);
    setTimeout(() => setCopiedEditor(false), 2000);
  };

  const getCaptionText = (item: CaptionItem) => (language === 'bn' ? item.bn : item.en);
  const getAttributionText = (item: CaptionItem) =>
    language === 'bn' ? item.attributionBn ?? '' : item.attributionEn ?? '';

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Controls & Generated Captions */}
        <div className="lg:col-span-7 space-y-6">
          {/* Page Intro */}
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              Caption Generator
            </h1>
            <p className="text-sm text-slate-600">
              Generate Islamic and motivational captions in English or Bangla, copy in one tap, or refine in the editor.
            </p>
          </div>

          {/* Primary Controls Panel */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 space-y-4">
            {/* Row 1: Category & Language */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Category + Saved Captions Segmented Control */}
              <div className="inline-flex flex-wrap sm:flex-nowrap p-1 bg-slate-100 rounded-xl w-full sm:w-auto gap-1 sm:gap-0">
                <button
                  type="button"
                  onClick={() => handleCategoryChange('islamic')}
                  className={`flex-1 sm:flex-initial min-h-[40px] px-3.5 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                    categoryFilter === 'islamic'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Islamic · ইসলামিক
                </button>
                <button
                  type="button"
                  onClick={() => handleCategoryChange('motivational')}
                  className={`flex-1 sm:flex-initial min-h-[40px] px-3.5 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                    categoryFilter === 'motivational'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Motivational · মোটিভেশনাল
                </button>
                <button
                  type="button"
                  onClick={() => handleCategoryChange('saved')}
                  className={`flex-1 sm:flex-initial min-h-[40px] px-3.5 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center justify-center gap-1.5 ${
                    categoryFilter === 'saved'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Star
                    className={`w-3.5 h-3.5 ${
                      categoryFilter === 'saved' || totalSavedCount > 0
                        ? 'text-amber-500 fill-amber-400'
                        : 'text-slate-400'
                    }`}
                  />
                  <span>Saved Captions</span>
                  <span className="font-mono-tabular text-xs text-slate-500">
                    ({totalSavedCount})
                  </span>
                </button>
              </div>

              {/* Language Segmented Control */}
              <div className="inline-flex p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`min-h-[40px] px-3.5 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                    language === 'en'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('bn')}
                  className={`min-h-[40px] px-3.5 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                    language === 'bn'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  বাংলা
                </button>
              </div>
            </div>

            {/* Row 2: Mood / Sub-topic Filters */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-medium text-slate-700 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Mood & Topic
                </span>
                <span className="tabular-nums">{filteredPool.length} available</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {MOODS.map((m) => {
                  const active = mood === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleMoodChange(m)}
                      className={`min-h-[38px] px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                        active
                          ? 'bg-teal-700 text-white border-teal-700'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {language === 'bn' ? MOOD_LABELS[m].bn : MOOD_LABELS[m].en}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 3: Search + Generate One / Multiple */}
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    language === 'bn' ? 'শব্দ বা বিষয় খুঁজুন...' : 'Filter captions by keyword...'
                  }
                  className="w-full h-11 pl-9 pr-3 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-teal-700"
                />
              </div>

              {categoryFilter === 'saved' ? (
                <div className="text-xs font-medium text-slate-600 px-1 shrink-0 tabular-nums">
                  {filteredPool.length} saved {filteredPool.length === 1 ? 'caption' : 'captions'}
                </div>
              ) : (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleGenerate(1)}
                    className="min-h-[44px] px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors whitespace-nowrap"
                  >
                    Single Caption
                  </button>

                  <div className="inline-flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <select
                      aria-label="Number of captions to generate"
                      value={batchSize}
                      onChange={(e) => {
                        const next = parseInt(e.target.value, 10);
                        setBatchSize(next);
                        handleGenerate(next);
                      }}
                      className="h-[42px] pl-3 pr-1.5 text-xs font-medium text-slate-700 bg-transparent focus:outline-none cursor-pointer tabular-nums"
                    >
                      <option value={3}>3</option>
                      <option value={5}>5</option>
                      <option value={8}>8</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleGenerate(batchSize)}
                      className="min-h-[42px] px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Generate {batchSize}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Generated Captions List */}
          <div className="space-y-3">
            {visibleCaptions.length === 0 ? (
              categoryFilter === 'saved' && totalSavedCount === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto">
                    <Star className="w-5 h-5 text-amber-500" />
                  </div>
                  <p className="text-sm font-medium text-slate-900">
                    No saved captions yet
                  </p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Tap the star icon on any Islamic or motivational caption—or save your own from the editor—to build your personal collection.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleCategoryChange('islamic')}
                    className="px-4 py-2 min-h-[40px] text-xs font-medium text-teal-800 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
                  >
                    Browse Captions
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
                  <p className="text-sm font-medium text-slate-900">
                    No captions match your current filter.
                  </p>
                  <p className="text-xs text-slate-500">
                    Try clearing your keyword search or switching back to All Moods.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      handleMoodChange('all');
                    }}
                    className="px-4 py-2 min-h-[40px] text-xs font-medium text-teal-800 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              )
            ) : (
              visibleCaptions.map((item) => {
                const text = getCaptionText(item);
                const attr = getAttributionText(item);
                const isCopied = copiedId === item.id;
                const isSelected = activeCaption.trim() === text.trim();
                const starred = isFavorite(item.id);

                return (
                  <article
                    key={item.id}
                    className={`bg-white border rounded-2xl p-5 transition-colors ${
                      isSelected ? 'border-teal-700 ring-1 ring-teal-700/15' : 'border-slate-200'
                    }`}
                  >
                    {/* Quiet unboxed metadata line + Favorite star toggle */}
                    <div className="flex items-center justify-between gap-4 text-xs text-slate-500 mb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-slate-700">
                          {item.category === 'islamic'
                            ? language === 'bn'
                              ? 'ইসলামিক'
                              : 'Islamic'
                            : language === 'bn'
                              ? 'মোটিভেশনাল'
                              : 'Motivational'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{MOOD_LABELS[item.mood][language]}</span>
                        {attr && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{attr}</span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono-tabular text-slate-400">
                          {text.length} chars
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleFavoriteId(item.id)}
                          aria-label={starred ? 'Remove from saved captions' : 'Save caption to favorites'}
                          aria-pressed={starred}
                          title={starred ? 'Remove from Saved Captions' : 'Save to Favorites'}
                          className={`min-w-[38px] min-h-[38px] -mr-1.5 flex items-center justify-center rounded-lg transition-colors ${
                            starred
                              ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                              : 'text-slate-400 hover:text-amber-500 hover:bg-slate-50'
                          }`}
                        >
                          <Star
                            className={`w-4 h-4 ${starred ? 'fill-amber-400 text-amber-500' : ''}`}
                          />
                        </button>
                      </div>
                    </div>

                    <p className="text-base md:text-[17px] leading-relaxed text-slate-900 font-medium">
                      {text}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyText(text, item.id)}
                          className={`min-h-[40px] px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                            isCopied
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              Copy Caption
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onChangeCaption(text);
                            onChangeAttribution(attr);
                          }}
                          className="min-h-[40px] px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap"
                        >
                          Edit in Box
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSendToCard(text, attr)}
                          className="min-h-[40px] px-3 py-2 text-xs font-medium text-teal-800 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          Card
                        </button>
                        <button
                          type="button"
                          onClick={() => onSendToReel(text, attr)}
                          className="min-h-[40px] px-3 py-2 text-xs font-medium text-slate-900 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <Clapperboard className="w-3.5 h-3.5" />
                          Reel
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Custom Caption Editor */}
        <aside className="lg:col-span-5 lg:sticky lg:top-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Custom Caption Editor
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tweak a generated caption or write your own before designing
                </p>
              </div>
              <span className="text-xs font-mono-tabular text-slate-500">
                {activeCaption.length} chars
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label
                  htmlFor="custom-caption-textarea"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  Caption Text (English or বাংলা)
                </label>
                <textarea
                  id="custom-caption-textarea"
                  rows={5}
                  value={activeCaption}
                  onChange={(e) => onChangeCaption(e.target.value)}
                  placeholder="Write your custom Islamic or motivational caption here..."
                  className="w-full p-3.5 text-sm leading-relaxed text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15 resize-y"
                />
              </div>

              <div>
                <label
                  htmlFor="custom-attribution-input"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  Subtitle or Reference (Optional)
                </label>
                <input
                  id="custom-attribution-input"
                  type="text"
                  value={activeAttribution}
                  onChange={(e) => onChangeAttribution(e.target.value)}
                  placeholder="e.g., Sabr Reflection or Surah Ash-Sharh"
                  className="w-full h-11 px-3.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-teal-700"
                />
              </div>
            </div>

            {/* Editor Actions */}
            <div className="pt-2 space-y-2.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyEditor}
                  disabled={!activeCaption.trim()}
                  className={`flex-1 min-h-[44px] px-4 py-2.5 text-sm font-medium rounded-xl border transition-colors flex items-center justify-center gap-2 ${
                    copiedEditor
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 disabled:opacity-50'
                  }`}
                >
                  {copiedEditor ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Text
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleToggleEditorFavorite}
                  disabled={!activeCaption.trim()}
                  aria-pressed={isEditorFavorited}
                  className={`min-h-[44px] px-3.5 py-2.5 text-sm font-medium rounded-xl border transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 whitespace-nowrap ${
                    isEditorFavorited
                      ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Star
                    className={`w-4 h-4 ${
                      isEditorFavorited ? 'fill-amber-400 text-amber-500' : 'text-slate-400'
                    }`}
                  />
                  {isEditorFavorited ? 'Saved' : 'Save'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onChangeCaption('');
                    onChangeAttribution('');
                  }}
                  className="min-h-[44px] px-3.5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Clear
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => onSendToCard(activeCaption, activeAttribution)}
                  className="min-h-[46px] px-4 py-2.5 text-sm font-semibold text-white bg-teal-700 rounded-xl hover:bg-teal-800 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <ImageIcon className="w-4 h-4" />
                  Create Card
                </button>

                <button
                  type="button"
                  onClick={() => onSendToReel(activeCaption, activeAttribution)}
                  className="min-h-[46px] px-4 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <Clapperboard className="w-4 h-4" />
                  Create Reel
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
