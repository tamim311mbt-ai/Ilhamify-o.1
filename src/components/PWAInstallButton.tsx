import { Chrome, Compass, Download, MoreVertical, Share, Shield, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export function PWAInstallButton({ compact = false }: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, browserKind, install } = usePWAInstall();
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  // অ্যাপ ইতিমধ্যে standalone মোডে বা WebView-তে চললে ইনস্টল বাটন দেখাবেন না
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const result = await install();
      if (result === 'unavailable') {
        setShowInstallGuide(true);
      }
      return;
    }
    setShowInstallGuide(true);
  };

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.96 }}
        type="button"
        onClick={handleInstallClick}
        className={
          compact
            ? 'px-2.5 py-2 min-h-[40px] text-xs font-semibold text-teal-800 bg-white border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0'
            : 'px-3.5 py-2 text-sm font-medium text-teal-800 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700'
        }
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>{compact ? 'ইনস্টল' : 'অ্যাপ ইনস্টল করুন'}</span>
      </motion.button>

      <AnimatePresence>
        {showInstallGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 p-0 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-install-guide-title"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowInstallGuide(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white p-5 sm:p-6 shadow-xl border border-slate-200"
            >
              <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <img
                    src={`${import.meta.env.BASE_URL}apple-touch-icon.png`}
                    alt="Ilhamify"
                    className="w-11 h-11 rounded-xl border border-slate-200 shrink-0"
                  />
                  <div>
                    <h3
                      id="pwa-install-guide-title"
                      className="text-base font-semibold text-slate-900"
                    >
                      হোম স্ক্রিনে Ilhamify ইনস্টল করুন
                    </h3>
                    <p className="text-xs text-slate-500">
                      {isIOS
                        ? 'iPhone ও iPad-এ সহজেই ব্যবহার করুন'
                        : 'স্বয়ংক্রিয় পপআপ না এলে নিচের ধাপগুলো অনুসরণ করুন'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInstallGuide(false)}
                  aria-label="বন্ধ করুন"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {isIOS ? (
                <ol className="mt-4 space-y-2.5 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-teal-800">১.</span>
                    <span>
                      Safari ব্রাউজারের নিচে বা উপরে থাকা{' '}
                      <strong className="inline-flex items-center gap-1 text-slate-900">
                        <Share className="w-3.5 h-3.5" /> Share
                      </strong>{' '}
                      বাটনে ট্যাপ করুন।
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-teal-800">২.</span>
                    <span>
                      নিচে স্ক্রল করে <strong className="text-slate-900">Add to Home Screen</strong> নির্বাচন করুন।
                    </span>
                  </li>
                </ol>
              ) : (
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  {/* Brave নির্দেশনা */}
                  <div
                    className={`p-3.5 rounded-xl border space-y-1.5 ${
                      browserKind === 'brave'
                        ? 'bg-teal-50/80 border-teal-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                      <Shield className="w-4 h-4 text-teal-700 shrink-0" />
                      <span>Brave ব্রাউজারে ইনস্টল করতে:</span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-600">
                      Brave Shields চালু থাকলে স্বয়ংক্রিয় ইনস্টল প্রম্পট বন্ধ থাকতে পারে। ব্রাউজারের{' '}
                      <strong className="text-slate-900">Shields</strong> আইকন অথবা উপরে/নিচে থাকা তিন-ডট মেনু (
                      <strong className="inline-flex items-center text-slate-900">
                        <MoreVertical className="w-3 h-3" />
                      </strong>
                      ) থেকে{' '}
                      <strong className="text-slate-900">Install app</strong> বা{' '}
                      <strong className="text-slate-900">Add to Home screen</strong> বেছে নিন।
                    </p>
                  </div>

                  {/* Firefox নির্দেশনা */}
                  <div
                    className={`p-3.5 rounded-xl border space-y-1.5 ${
                      browserKind === 'firefox'
                        ? 'bg-teal-50/80 border-teal-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                      <Compass className="w-4 h-4 text-teal-700 shrink-0" />
                      <span>Firefox ব্রাউজারে ইনস্টল করতে:</span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-600">
                      Firefox-এর ব্রাউজার মেনু (<strong className="text-slate-900">⋮</strong>) খুলে{' '}
                      <strong className="text-slate-900">Install</strong> অথবা{' '}
                      <strong className="text-slate-900">Add to Home screen</strong> অপশনে ট্যাপ করুন।
                    </p>
                  </div>

                  {/* Chrome সুপারিশ */}
                  <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 flex items-start gap-2.5">
                    <Chrome className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed text-teal-900">
                      <strong className="font-semibold">পরামর্শ:</strong> সবচেয়ে মসৃণ ও এক-ক্লিক অ্যাপ ইনস্টল অভিজ্ঞতার জন্য সাইটটি{' '}
                      <strong className="font-semibold">Google Chrome</strong> ব্রাউজারে খুলে ব্যবহার করুন।
                    </p>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowInstallGuide(false)}
                className="mt-5 w-full min-h-[44px] rounded-xl bg-teal-700 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
              >
                বুঝেছি
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
