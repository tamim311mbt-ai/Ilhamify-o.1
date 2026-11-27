import { Eye } from 'lucide-react';
import { useVisitorCount } from '../hooks/useVisitorCount';
import { toBanglaNumber } from '../utils/banglaDigits';
import { ScrollReveal } from './ScrollReveal';

const CREATOR_NAME = 'Motasim Billah Tamim';
const CREATOR_FACEBOOK_URL = 'https://www.facebook.com/pixelmbt';
const ILHAMIFY_FACEBOOK_PAGE_URL = 'https://www.facebook.com/Ilhamify.com.bd';

export function SiteFooter() {
  const { count, status } = useVisitorCount();

  return (
    <footer className="relative z-10 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111B1B] pb-20 md:pb-5 pt-4 md:pt-5 transition-colors duration-200">
      <ScrollReveal>
        <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-3">
        {/* উপরের লাইন: ব্র্যান্ড ও লাইভ ভিজিটর কাউন্টার */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="Ilhamify ইলহামিফাই"
              className="h-5 md:h-6 w-auto object-contain transition-[filter] duration-200 dark:brightness-[1.85] dark:saturate-[0.7]"
            />
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              Ilhamify ইলহামিফাই
            </span>
            <span aria-hidden="true" className="hidden sm:inline text-slate-300 dark:text-slate-700">
              ·
            </span>
            <span className="hidden sm:inline">
              ৬৫০+ বাংলা ক্যাপশন · কোট কার্ড · ৯:১৬ রিল ভিডিও
            </span>
          </div>

          <div
            aria-live="polite"
            className="inline-flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-900/50 border border-teal-200 dark:border-teal-700/60 text-xs text-teal-800 dark:text-teal-100"
          >
            <span className="relative flex h-2 w-2 shrink-0">
              {status === 'loading' ? (
                <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
              ) : status === 'ready' ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-600 dark:bg-teal-300 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-700 dark:bg-teal-400" />
                </>
              ) : (
                <span className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500" />
              )}
            </span>
            <Eye className="w-3.5 h-3.5 text-teal-700 dark:text-teal-300 shrink-0" />
            {status === 'loading' ? (
              <span className="text-slate-600 dark:text-slate-300">ভিজিটর গণনা হচ্ছে...</span>
            ) : status === 'ready' && count !== null ? (
              <span className="font-medium tabular-nums">
                মোট ভিজিটর:{' '}
                <strong className="font-semibold text-slate-900 dark:text-white">
                  {toBanglaNumber(count)}
                </strong>{' '}
                জন
              </span>
            ) : (
              <span className="text-slate-600 dark:text-slate-300">
                ভিজিটর তথ্য এই মুহূর্তে অনুপলব্ধ
              </span>
            )}
          </div>
        </div>

        {/* নিচের ক্রেডিট ও ফেসবুক বাটনসমূহ */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 text-xs text-slate-500 dark:text-slate-400">
          <p className="leading-snug">
            নির্মাতা:{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              {CREATOR_NAME}
            </span>
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={ILHAMIFY_FACEBOOK_PAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ilhamify-এর অফিশিয়াল ফেসবুক পেজ দেখুন"
              className="inline-flex items-center gap-1.5 min-h-[34px] px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 dark:hover:bg-teal-500 text-white text-xs font-medium transition-colors whitespace-nowrap shadow-2xs"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-3.5 h-3.5 shrink-0"
              >
                <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.5 1.6-1.5h1.6V4.9c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1V11H7.5v3h2.8v8h3.2z" />
              </svg>
              <span>Ilhamify ফেসবুক পেজ</span>
            </a>

            <a
              href={CREATOR_FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Motasim Billah Tamim-এর ফেসবুক প্রোফাইল দেখুন"
              className="inline-flex items-center gap-1.5 min-h-[34px] px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-900/50 hover:bg-teal-100 dark:hover:bg-teal-800/60 border border-teal-200 dark:border-teal-700/60 text-teal-800 dark:text-teal-100 text-xs font-medium transition-colors whitespace-nowrap"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-3.5 h-3.5 shrink-0"
              >
                <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.5 1.6-1.5h1.6V4.9c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1V11H7.5v3h2.8v8h3.2z" />
              </svg>
              <span>নির্মাতার ফেসবুক</span>
            </a>
          </div>
        </div>
      </div>
      </ScrollReveal>
    </footer>
  );
}
