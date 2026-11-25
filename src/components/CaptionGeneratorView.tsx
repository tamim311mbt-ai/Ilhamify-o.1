import { AnimatePresence, motion } from 'motion/react';
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
import {
  ALL_SUBTOPIC_LABELS,
  ISLAMIC_SUBTOPICS,
  MOTIVATIONAL_SUBTOPICS,
} from '../data/themes';
import { useFavoriteCaptions } from '../hooks/useFavoriteCaptions';
import {
  CaptionCategory,
  CaptionItem,
  CaptionSubTopic,
} from '../types/studio';
import { toBanglaNumber } from '../utils/banglaDigits';

interface CaptionGeneratorViewProps {
  activeCaption: string;
  activeAttribution: string;
  onChangeCaption: (text: string) => void;
  onChangeAttribution: (text: string) => void;
  onSendToCard: (caption: string, attribution: string) => void;
  onSendToReel: (caption: string, attribution: string) => void;
}

type CategoryFilter = CaptionCategory | 'saved';

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

export function CaptionGeneratorView({
  activeCaption,
  activeAttribution,
  onChangeCaption,
  onChangeAttribution,
  onSendToCard,
  onSendToReel,
}: CaptionGeneratorViewProps) {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('islamic');
  const [subTopic, setSubTopic] = useState<CaptionSubTopic>('all');
  const [batchSize, setBatchSize] = useState<number>(5);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedEditor, setCopiedEditor] = useState<boolean>(false);
  const [listCycle, setListCycle] = useState<number>(0);

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

  const availableSubTopics = useMemo(() => {
    if (categoryFilter === 'islamic') {
      return [{ id: 'all' as const, label: 'সবগুলো বিষয়' }, ...ISLAMIC_SUBTOPICS];
    }
    if (categoryFilter === 'motivational') {
      return [{ id: 'all' as const, label: 'সবগুলো বিষয়' }, ...MOTIVATIONAL_SUBTOPICS];
    }
    return [
      { id: 'all' as const, label: 'সবগুলো বিষয়' },
      ...ISLAMIC_SUBTOPICS,
      ...MOTIVATIONAL_SUBTOPICS,
    ];
  }, [categoryFilter]);

  const filteredPool = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const source = categoryFilter === 'saved' ? savedPool : CAPTIONS_LIBRARY;

    return source.filter((item) => {
      if (categoryFilter !== 'saved' && item.category !== categoryFilter) return false;
      if (subTopic !== 'all' && item.subTopic !== subTopic) return false;
      if (q) {
        const hay = `${item.text} ${item.attribution} ${ALL_SUBTOPIC_LABELS[item.subTopic]}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [categoryFilter, savedPool, subTopic, searchQuery]);

  const [generatedList, setGeneratedList] = useState<CaptionItem[]>(() =>
    shufflePick(
      CAPTIONS_LIBRARY.filter((c) => c.category === 'islamic'),
      5,
      []
    )
  );

  const handleCategoryChange = (nextCategory: CategoryFilter) => {
    setCategoryFilter(nextCategory);
    setSubTopic('all');
    setListCycle((c) => c + 1);
    if (nextCategory === 'saved') return;

    const nextPool = CAPTIONS_LIBRARY.filter((item) => item.category === nextCategory);
    setGeneratedList(shufflePick(nextPool, batchSize, []));
  };

  const handleSubTopicChange = (nextSubTopic: CaptionSubTopic) => {
    setSubTopic(nextSubTopic);
    setListCycle((c) => c + 1);
    if (categoryFilter === 'saved') return;

    const nextPool = CAPTIONS_LIBRARY.filter((item) => {
      if (item.category !== categoryFilter) return false;
      if (nextSubTopic !== 'all' && item.subTopic !== nextSubTopic) return false;
      return true;
    });
    setGeneratedList(shufflePick(nextPool, batchSize, []));
  };

  const handleGenerate = (count: number) => {
    if (categoryFilter === 'saved') return;
    const exclude = generatedList.map((item) => item.id);
    const picked = shufflePick(filteredPool, count, exclude);
    setGeneratedList(picked);
    setListCycle((c) => c + 1);
  };

  const visibleCaptions =
    categoryFilter === 'saved' || searchQuery.trim() ? filteredPool : generatedList;

  const matchingLibraryItem = useMemo(() => {
    const clean = activeCaption.trim();
    if (!clean) return null;
    return CAPTIONS_LIBRARY.find((c) => c.text.trim() === clean) ?? null;
  }, [activeCaption]);

  const matchingCustomItem = useMemo(() => {
    const clean = activeCaption.trim();
    if (!clean) return null;
    return customSaved.find((c) => c.text.trim() === clean) ?? null;
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
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
    }
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((curr) => (curr === id ? null : curr));
    }, 2000);
  };

  const handleCopyEditor = async () => {
    const combined = activeAttribution.trim()
      ? `${activeCaption.trim()}\n— ${activeAttribution.trim()}`
      : activeCaption.trim();
    if (!combined) return;
    try {
      await navigator.clipboard.writeText(combined);
    } catch {
      // ফলের ব্যাকআপ এড়িয়ে যাওয়া হয়েছে
    }
    setCopiedEditor(true);
    setTimeout(() => setCopiedEditor(false), 2000);
  };

  const islamicCount = useMemo(
    () => CAPTIONS_LIBRARY.filter((c) => c.category === 'islamic').length,
    []
  );
  const motivationalCount = useMemo(
    () => CAPTIONS_LIBRARY.filter((c) => c.category === 'motivational').length,
    []
  );

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* বাম কলাম: কন্ট্রোল ও জেনারেট করা ক্যাপশন */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              ক্যাপশন জেনারেটর
            </h1>
            <p className="text-sm text-slate-600">
              {toBanglaNumber(islamicCount)}টি ইসলামিক ও {toBanglaNumber(motivationalCount)}টি মোটিভেশনাল বাংলা ক্যাপশন থেকে বাছাই করুন, কপি করুন বা নিজের মতো সম্পাদনা করুন।
            </p>
          </div>

          {/* মূল ফিল্টার প্যানেল */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 space-y-4">
            {/* ক্যাটাগরি ও সেভ করা ক্যাপশন */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex flex-wrap sm:flex-nowrap p-1 bg-slate-100 rounded-xl w-full sm:w-auto gap-1 sm:gap-0">
                <button
                  type="button"
                  onClick={() => handleCategoryChange('islamic')}
                  className={`flex-1 sm:flex-initial min-h-[42px] px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                    categoryFilter === 'islamic'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ইসলামিক ({toBanglaNumber(islamicCount)})
                </button>
                <button
                  type="button"
                  onClick={() => handleCategoryChange('motivational')}
                  className={`flex-1 sm:flex-initial min-h-[42px] px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                    categoryFilter === 'motivational'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  মোটিভেশনাল ({toBanglaNumber(motivationalCount)})
                </button>
                <button
                  type="button"
                  onClick={() => handleCategoryChange('saved')}
                  className={`flex-1 sm:flex-initial min-h-[42px] px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center justify-center gap-1.5 ${
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
                  <span>সেভ করা ক্যাপশন</span>
                  <span className="tabular-nums text-xs text-slate-500">
                    ({toBanglaNumber(totalSavedCount)})
                  </span>
                </button>
              </div>
            </div>

            {/* সাব-টপিক ফিল্টার */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-medium text-slate-700 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  বিষয় নির্বাচন করুন
                </span>
                <span className="tabular-nums">
                  {toBanglaNumber(filteredPool.length)}টি ক্যাপশন পাওয়া গেছে
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {availableSubTopics.map((topic) => {
                  const active = subTopic === topic.id;
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => handleSubTopicChange(topic.id)}
                      className={`min-h-[38px] px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                        active
                          ? 'bg-teal-700 text-white border-teal-700'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {topic.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* সার্চ ও র‍্যান্ডম জেনারেট */}
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="শব্দ বা বিষয় লিখে খুঁজুন..."
                  className="w-full h-11 pl-9 pr-3 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-teal-700"
                />
              </div>

              {categoryFilter === 'saved' ? (
                <div className="text-xs font-medium text-slate-600 px-1 shrink-0 tabular-nums">
                  মোট {toBanglaNumber(filteredPool.length)}টি সেভ করা ক্যাপশন
                </div>
              ) : (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleGenerate(1)}
                    className="min-h-[44px] px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors whitespace-nowrap"
                  >
                    একটি নতুন ক্যাপশন
                  </button>

                  <div className="inline-flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <select
                      aria-label="কতগুলো ক্যাপশন তৈরি হবে"
                      value={batchSize}
                      onChange={(e) => {
                        const next = parseInt(e.target.value, 10);
                        setBatchSize(next);
                        handleGenerate(next);
                      }}
                      className="h-[42px] pl-3 pr-1.5 text-xs font-medium text-slate-700 bg-transparent focus:outline-none cursor-pointer tabular-nums"
                    >
                      <option value={3}>৩টি</option>
                      <option value={5}>৫টি</option>
                      <option value={8}>৮টি</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleGenerate(batchSize)}
                      className="min-h-[42px] px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      নতুন {toBanglaNumber(batchSize)}টি দেখুন
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ক্যাপশন তালিকা */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${categoryFilter}-${subTopic}-${listCycle}-${searchQuery.trim() ? 'q' : 'n'}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-3"
            >
              {visibleCaptions.length === 0 ? (
                categoryFilter === 'saved' && totalSavedCount === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto">
                      <Star className="w-5 h-5 text-amber-500" />
                    </div>
                    <p className="text-sm font-medium text-slate-900">
                      এখনো কোনো ক্যাপশন সেভ করা হয়নি
                    </p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      যেকোনো ইসলামিক বা মোটিভেশনাল ক্যাপশনের তারকা চিহ্নে চাপ দিন অথবা এডিটর থেকে নিজের ক্যাপশন সেভ করুন।
                    </p>
                    <button
                      type="button"
                      onClick={() => handleCategoryChange('islamic')}
                      className="px-4 py-2 min-h-[40px] text-xs font-medium text-teal-800 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
                    >
                      ক্যাপশন দেখুন
                    </button>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
                    <p className="text-sm font-medium text-slate-900">
                      আপনার খোঁজার সাথে মিলে এমন কোনো ক্যাপশন পাওয়া যায়নি।
                    </p>
                    <p className="text-xs text-slate-500">
                      সার্চ বক্স খালি করে অথবা সবগুলো বিষয় নির্বাচন করে আবার চেষ্টা করুন।
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        handleSubTopicChange('all');
                      }}
                      className="px-4 py-2 min-h-[40px] text-xs font-medium text-teal-800 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
                    >
                      ফিল্টার রিসেট করুন
                    </button>
                  </div>
                )
              ) : (
                visibleCaptions.map((item, idx) => {
                  const isCopied = copiedId === item.id;
                  const isSelected = activeCaption.trim() === item.text.trim();
                  const starred = isFavorite(item.id);

                  return (
                    <motion.article
                      key={item.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.18,
                        delay: Math.min(idx * 0.025, 0.12),
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className={`bg-white border rounded-2xl p-5 transition-colors ${
                        isSelected ? 'border-teal-700 ring-1 ring-teal-700/15' : 'border-slate-200'
                      }`}
                    >
                      {/* মেটাডেটা লাইন ও প্রিয় বাটন */}
                      <div className="flex items-center justify-between gap-4 text-xs text-slate-500 mb-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-slate-700">
                            {item.category === 'islamic' ? 'ইসলামিক' : 'মোটিভেশনাল'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{ALL_SUBTOPIC_LABELS[item.subTopic]}</span>
                          {item.attribution && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{item.attribution}</span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="tabular-nums text-slate-400">
                            {toBanglaNumber(item.text.length)} অক্ষর
                          </span>
                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            type="button"
                            onClick={() => toggleFavoriteId(item.id)}
                            aria-label={starred ? 'সেভ তালিকা থেকে সরান' : 'প্রিয় তালিকায় সেভ করুন'}
                            aria-pressed={starred}
                            title={starred ? 'সেভ তালিকা থেকে সরান' : 'সেভ করুন'}
                            className={`min-w-[38px] min-h-[38px] -mr-1.5 flex items-center justify-center rounded-lg transition-colors ${
                              starred
                                ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                                : 'text-slate-400 hover:text-amber-500 hover:bg-slate-50'
                            }`}
                          >
                            <Star
                              className={`w-4 h-4 ${starred ? 'fill-amber-400 text-amber-500' : ''}`}
                            />
                          </motion.button>
                        </div>
                      </div>

                      <p className="text-base md:text-[17px] leading-relaxed text-slate-900 font-medium">
                        {item.text}
                      </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyText(item.text, item.id)}
                          className={`min-h-[40px] px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                            isCopied
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              কপি হয়েছে
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              কপি করুন
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onChangeCaption(item.text);
                            onChangeAttribution(item.attribution);
                          }}
                          className="min-h-[40px] px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap"
                        >
                          সম্পাদনা করুন
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          type="button"
                          onClick={() => onSendToCard(item.text, item.attribution)}
                          className="min-h-[40px] px-3 py-2 text-xs font-medium text-teal-800 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          কার্ড তৈরি
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          type="button"
                          onClick={() => onSendToReel(item.text, item.attribution)}
                          className="min-h-[40px] px-3 py-2 text-xs font-medium text-slate-900 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <Clapperboard className="w-3.5 h-3.5" />
                          রিল তৈরি
                        </motion.button>
                      </div>
                    </div>
                  </motion.article>
                );
              })
            )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ডান কলাম: কাস্টম ক্যাপশন এডিটর */}
        <aside className="lg:col-span-5 lg:sticky lg:top-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  কাস্টম ক্যাপশন এডিটর
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  কার্ড বা রিল বানানোর আগে লেখা পরিবর্তন বা নিজের লেখা যোগ করুন
                </p>
              </div>
              <span className="text-xs tabular-nums text-slate-500">
                {toBanglaNumber(activeCaption.length)} অক্ষর
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label
                  htmlFor="custom-caption-textarea"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  মূল ক্যাপশন (বাংলা)
                </label>
                <textarea
                  id="custom-caption-textarea"
                  rows={5}
                  value={activeCaption}
                  onChange={(e) => onChangeCaption(e.target.value)}
                  placeholder="এখানে আপনার ইসলামিক বা মোটিভেশনাল বাংলা ক্যাপশন লিখুন..."
                  className="w-full p-3.5 text-sm leading-relaxed text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15 resize-y"
                />
              </div>

              <div>
                <label
                  htmlFor="custom-attribution-input"
                  className="block text-xs font-medium text-slate-700 mb-1.5"
                >
                  ছোট শিরোনাম বা সূত্র (ঐচ্ছিক)
                </label>
                <input
                  id="custom-attribution-input"
                  type="text"
                  value={activeAttribution}
                  onChange={(e) => onChangeAttribution(e.target.value)}
                  placeholder="যেমন: সবর ও প্রশান্তি অথবা সূরা আশ-শারহ ভাবনা"
                  className="w-full h-11 px-3.5 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-teal-700"
                />
              </div>
            </div>

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
                      কপি হয়েছে
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      কপি করুন
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
                  {isEditorFavorited ? 'সেভ করা' : 'সেভ'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onChangeCaption('');
                    onChangeAttribution('');
                  }}
                  className="min-h-[44px] px-3.5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  মুছুন
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => onSendToCard(activeCaption, activeAttribution)}
                  className="min-h-[46px] px-4 py-2.5 text-sm font-semibold text-white bg-teal-700 rounded-xl hover:bg-teal-800 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <ImageIcon className="w-4 h-4" />
                  কার্ড মেকার
                </button>

                <button
                  type="button"
                  onClick={() => onSendToReel(activeCaption, activeAttribution)}
                  className="min-h-[46px] px-4 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <Clapperboard className="w-4 h-4" />
                  রিল মেকার
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
