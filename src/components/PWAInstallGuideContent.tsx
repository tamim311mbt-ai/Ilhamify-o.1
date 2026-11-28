import { Check, Chrome, Copy, MoreVertical, Share } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import type { BrowserInstallKind } from '../hooks/usePWAInstall';
import { copyTextToClipboard } from '../utils/appEnvironment';

interface PWAInstallGuideContentProps {
  isChrome: boolean;
  isIOS: boolean;
  browserKind: BrowserInstallKind;
}

function getNonChromeBrowserLabel(browserKind: BrowserInstallKind): string {
  switch (browserKind) {
    case 'brave':
      return 'Brave ব্রাউজারে';
    case 'firefox':
      return 'Firefox ব্রাউজারে';
    case 'ios':
      return 'iPhone / iPad ব্রাউজারে';
    default:
      return 'এই ব্রাউজারে';
  }
}

export function PWAInstallGuideContent({
  isChrome,
  isIOS,
  browserKind,
}: PWAInstallGuideContentProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2400);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopyLink = async () => {
    const targetUrl =
      typeof window !== 'undefined'
        ? window.location.href
        : 'https://tamim311mbt-ai.github.io/Ilhamify-o.1/';
    const ok = await copyTextToClipboard(targetUrl);
    if (ok) {
      setCopied(true);
    }
  };

  const browserLabel = getNonChromeBrowserLabel(browserKind);

  return (
    <div className="space-y-3">
      {isChrome ? (
        <>
          {/* Google Chrome ব্যবহারকারীর জন্য ⋮ (তিন ডট) মেনু ধাপসমূহ */}
          <div className="p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/70 space-y-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-teal-900 dark:text-teal-200">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-teal-700 text-white shrink-0">
                <MoreVertical className="w-3.5 h-3.5" />
              </span>
              <span>Chrome-এর ⋮ (তিন ডট) মেনু দিয়ে ইনস্টল করুন</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200">
              <li>
                উপরে ডান কোণায়{' '}
                <strong className="font-semibold text-teal-900 dark:text-teal-200">
                  ⋮ (তিন ডট)
                </strong>{' '}
                মেনুতে ট্যাপ করুন।
              </li>
              <li>
                তালিকা থেকে{' '}
                <strong className="font-semibold text-teal-900 dark:text-teal-200">
                  Install app
                </strong>{' '}
                অথবা{' '}
                <strong className="font-semibold text-teal-900 dark:text-teal-200">
                  Add to Home screen
                </strong>{' '}
                / <strong className="font-semibold text-teal-900 dark:text-teal-200">Create shortcut</strong>{' '}
                বেছে নিন।
              </li>
              <li>
                নিশ্চিত করতে{' '}
                <strong className="font-semibold text-teal-900 dark:text-teal-200">
                  Install
                </strong>{' '}
                চাপলেই অ্যাপটি হোম স্ক্রিনে যুক্ত হয়ে যাবে।
              </li>
            </ol>
          </div>

          {/* অন্য ব্রাউজার থেকে আসলে Chrome-এ সরাসরি ওপেন করার সংক্ষিপ্ত নোট */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1A2828] border border-slate-200 dark:border-slate-700 flex items-start gap-2.5">
            <Chrome className="w-4 h-4 text-teal-700 dark:text-teal-300 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              আপনি যদি অন্য কোনো ব্রাউজার বা ইন-অ্যাপ লিংক (যেমন Facebook/Messenger) থেকে এসে থাকেন, তবে লিংকটি কপি করে সরাসরি{' '}
              <strong className="font-semibold text-slate-900 dark:text-slate-100">
                Google Chrome
              </strong>{' '}
              অ্যাপে ওপেন করেও সহজে ইনস্টল করতে পারবেন।
            </p>
          </div>
        </>
      ) : (
        <>
          {/* Brave / Firefox / ইন-অ্যাপ / নন-Chrome ব্রাউজার: Chrome-এ ওপেন + ⋮ মেনু নির্দেশনা */}
          <div className="p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/70 flex items-start gap-2.5">
            <Chrome className="w-5 h-5 text-teal-700 dark:text-teal-300 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-semibold text-teal-900 dark:text-teal-200">
                Google Chrome-এ ওপেন করে ইনস্টল করুন
              </p>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                {browserLabel} স্বয়ংক্রিয় ইনস্টল পপআপ না এলে নিচের লিংকটি কপি করে{' '}
                <strong className="font-semibold text-teal-900 dark:text-teal-200">
                  Google Chrome
                </strong>{' '}
                ব্রাউজারে ওপেন করুন এবং{' '}
                <strong className="font-semibold text-teal-900 dark:text-teal-200">
                  &lsquo;অ্যাপ ইনস্টল করুন&rsquo;
                </strong>{' '}
                বাটনে চাপ দিন।
              </p>
            </div>
          </div>

          {/* সাথে সাথেই ⋮ (তিন ডট) মেনু ধাপসমূহ */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1A2828] border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-teal-700/15 dark:bg-teal-400/20 text-teal-800 dark:text-teal-200 shrink-0">
                <MoreVertical className="w-3.5 h-3.5" />
              </span>
              <span>অথবা ব্রাউজারের ⋮ (তিন ডট) মেনু ব্যবহার করুন</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <li>
                আপনার ব্রাউজারের উপরের বা নিচের{' '}
                <strong className="text-slate-900 dark:text-slate-100">⋮ (তিন ডট)</strong>{' '}
                মেনু খুলুন।
              </li>
              <li>
                সেখান থেকে{' '}
                <strong className="text-slate-900 dark:text-slate-100">Install app</strong>,{' '}
                <strong className="text-slate-900 dark:text-slate-100">
                  Add to Home screen
                </strong>{' '}
                অথবা{' '}
                <strong className="text-slate-900 dark:text-slate-100">
                  Create shortcut
                </strong>{' '}
                অপশনে ট্যাপ করুন।
              </li>
            </ol>
          </div>
        </>
      )}

      {isIOS && (
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1A2828] border border-slate-200 dark:border-slate-700 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
          iPhone/iPad-এ Safari ব্যবহার করলে নিচের{' '}
          <strong className="inline-flex items-center gap-0.5 text-slate-900 dark:text-slate-100">
            <Share className="w-3 h-3" /> Share
          </strong>{' '}
          মেনু থেকে{' '}
          <strong className="text-slate-900 dark:text-slate-100">
            Add to Home Screen
          </strong>{' '}
          নির্বাচন করেও যুক্ত করতে পারবেন।
        </div>
      )}

      {/* লিংক কপি করুন */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        type="button"
        onClick={handleCopyLink}
        className="w-full min-h-[46px] px-4 py-2.5 text-sm font-semibold text-teal-800 dark:text-teal-100 bg-teal-50 dark:bg-teal-900/45 hover:bg-teal-100 dark:hover:bg-teal-800/55 border border-teal-300 dark:border-teal-700/70 rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span className="text-emerald-800 dark:text-emerald-300">
              লিংক কপি হয়েছে! Chrome-এ পেস্ট করুন
            </span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 shrink-0" />
            <span>লিংক কপি করুন</span>
          </>
        )}
      </motion.button>
    </div>
  );
}
