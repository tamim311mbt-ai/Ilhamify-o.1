import { Check, Chrome, Copy, Download, Share, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { copyTextToClipboard } from '../utils/appEnvironment';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export function PWAInstallButton({ compact = false }: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2400);
    return () => window.clearTimeout(timer);
  }, [copied]);

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

      <AnimatePresence
        onExitComplete={() => {
          setCopied(false);
        }}
      >
        {showInstallGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-xs p-0 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-install-guide-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white p-5 sm:p-6 shadow-xl border border-slate-200"
            >
              <div className="sm:hidden flex justify-center mb-3">
                <div className="w-10 h-1.5 rounded-full bg-slate-200" />
              </div>

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
                      Google Chrome-এ অ্যাপ ইনস্টল করুন
                    </h3>
                    <p className="text-xs text-slate-500">Ilhamify ওয়েব অ্যাপ নির্দেশিকা</p>
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

              <div className="mt-4 space-y-3">
                <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 flex items-start gap-2.5">
                  <Chrome className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-800">
                    এই ব্রাউজারে সরাসরি অ্যাপ ইনস্টল সাপোর্ট করছে না। ঝামেলা ছাড়া অ্যাপটি ইনস্টল করতে অনুগ্রহ করে{' '}
                    <strong className="font-semibold text-teal-900">Google Chrome</strong>{' '}
                    ব্রাউজারে সাইটটি ওপেন করে{' '}
                    <strong className="font-semibold text-teal-900">
                      &lsquo;অ্যাপ ইনস্টল করুন&rsquo;
                    </strong>{' '}
                    বাটনে চাপ দিন।
                  </p>
                </div>

                {isIOS && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs leading-relaxed text-slate-700">
                    iPhone/iPad-এ Safari ব্যবহার করলে নিচের{' '}
                    <strong className="inline-flex items-center gap-0.5 text-slate-900">
                      <Share className="w-3 h-3" /> Share
                    </strong>{' '}
                    মেনু থেকে <strong className="text-slate-900">Add to Home Screen</strong> নির্বাচন করেও যুক্ত করতে পারবেন।
                  </div>
                )}

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full min-h-[46px] px-4 py-2.5 text-sm font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-300 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="text-emerald-800">লিংক কপি হয়েছে! Chrome-এ পেস্ট করুন</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 shrink-0" />
                      <span>লিংক কপি করুন</span>
                    </>
                  )}
                </motion.button>
              </div>

              <button
                type="button"
                onClick={() => setShowInstallGuide(false)}
                className="mt-4 w-full min-h-[44px] rounded-xl bg-teal-700 text-sm font-semibold text-white hover:bg-teal-800 transition-colors"
              >
                ঠিক আছে
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
