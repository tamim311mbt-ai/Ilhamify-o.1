import { Download, Share, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export function PWAInstallButton({ compact = false }: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <motion.button
        whileTap={{ scale: 0.96 }}
        type="button"
        onClick={install}
        className={
          compact
            ? 'px-2.5 py-2 min-h-[40px] text-xs font-semibold text-teal-800 bg-white border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0'
            : 'px-3.5 py-2 text-sm font-medium text-teal-800 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700'
        }
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>{compact ? 'ইনস্টল' : 'অ্যাপ ইনস্টল করুন'}</span>
      </motion.button>
    );
  }

  if (isIOS) {
    return (
      <>
        <motion.button
          whileTap={{ scale: 0.96 }}
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={
            compact
              ? 'px-2.5 py-2 min-h-[40px] text-xs font-semibold text-teal-800 bg-white border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0'
              : 'px-3.5 py-2 text-sm font-medium text-teal-800 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0'
          }
        >
          <Download className="w-4 h-4 shrink-0" />
          <span>{compact ? 'ইনস্টল' : 'অ্যাপ ইনস্টল করুন'}</span>
        </motion.button>

        <AnimatePresence>
          {showIOSGuide && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="ios-install-title"
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowIOSGuide(false);
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-slate-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={`${import.meta.env.BASE_URL}apple-touch-icon.png`}
                      alt="Ilhamify"
                      className="w-11 h-11 rounded-xl border border-slate-200 shrink-0"
                    />
                    <div>
                      <h3 id="ios-install-title" className="text-base font-semibold text-slate-900">
                        হোম স্ক্রিনে Ilhamify যুক্ত করুন
                      </h3>
                      <p className="text-xs text-slate-500">iPhone ও iPad-এ সহজেই ব্যবহার করুন</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowIOSGuide(false)}
                    aria-label="বন্ধ করুন"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

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

                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
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

  return null;
}
