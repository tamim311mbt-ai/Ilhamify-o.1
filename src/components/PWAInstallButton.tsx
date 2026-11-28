import { Download, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallGuideContent } from './PWAInstallGuideContent';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export function PWAInstallButton({ compact = false }: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, isChrome, browserKind, install } = usePWAInstall();
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
            ? 'px-2.5 py-2 min-h-[40px] text-xs font-semibold text-teal-800 dark:text-teal-100 bg-white dark:bg-[#192828] border border-teal-200 dark:border-teal-700/70 rounded-lg hover:bg-teal-50 dark:hover:bg-[#213333] transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0'
            : 'px-3.5 py-2 text-sm font-medium text-teal-800 dark:text-teal-100 bg-teal-50 dark:bg-teal-900/50 border border-teal-200 dark:border-teal-700/60 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-800/60 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700'
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
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/55 dark:bg-black/70 backdrop-blur-xs p-0 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-install-guide-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#142020] p-5 sm:p-6 shadow-xl border border-slate-200 dark:border-slate-800"
            >
              <div className="sm:hidden flex justify-center mb-3">
                <div className="w-10 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
              </div>

              <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <img
                    src={`${import.meta.env.BASE_URL}apple-touch-icon.png`}
                    alt="Ilhamify"
                    className="w-11 h-11 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0"
                  />
                  <div>
                    <h3
                      id="pwa-install-guide-title"
                      className="text-base font-semibold text-slate-900 dark:text-slate-100"
                    >
                      {isChrome
                        ? 'Chrome-এ Ilhamify অ্যাপ ইনস্টল করুন'
                        : 'Ilhamify অ্যাপ ইনস্টল করুন'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Ilhamify ওয়েব অ্যাপ নির্দেশিকা
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInstallGuide(false)}
                  aria-label="বন্ধ করুন"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4">
                <PWAInstallGuideContent
                  isChrome={isChrome}
                  isIOS={isIOS}
                  browserKind={browserKind}
                />
              </div>

              <button
                type="button"
                onClick={() => setShowInstallGuide(false)}
                className="mt-4 w-full min-h-[44px] rounded-xl bg-teal-700 text-sm font-semibold text-white hover:bg-teal-800 dark:hover:bg-teal-500 transition-colors"
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
