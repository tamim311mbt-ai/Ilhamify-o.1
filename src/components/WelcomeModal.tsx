import {
  ArrowLeft,
  CheckCircle2,
  Chrome,
  Compass,
  Download,
  ExternalLink,
  Globe,
  MoreVertical,
  Share,
  Shield,
  ShieldCheck,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

const GITHUB_REPO_URL = 'https://github.com/tamim311mbt-ai/Ilhamify-o.1';
const ILHAMIFY_FACEBOOK_PAGE_URL = 'https://www.facebook.com/Ilhamify.com.bd';

interface WelcomeModalProps {
  open: boolean;
  triggerContext?: 'startup' | 'download';
  onClose: () => void;
}

export function WelcomeModal({
  open,
  triggerContext = 'startup',
  onClose,
}: WelcomeModalProps) {
  const [view, setView] = useState<'initial' | 'guide'>('initial');
  const { isInstallable, isInstalled, isIOS, browserKind, install } = usePWAInstall();

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const result = await install();
      if (result === 'accepted') {
        onClose();
        return;
      }
      if (result === 'unavailable') {
        setView('guide');
      }
      return;
    }

    setView('guide');
  };

  return (
    <AnimatePresence
      onExitComplete={() => {
        setView('initial');
      }}
    >
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-xs p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-modal-title"
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full sm:max-w-md max-h-[92vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl p-5 sm:p-6"
          >
            {/* মোবাইল ড্র্যাগ হ্যান্ডেল */}
            <div className="sm:hidden flex justify-center mb-3">
              <div className="w-10 h-1.5 rounded-full bg-slate-200" />
            </div>

            {/* উপরের লোগো */}
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <img
                src={`${import.meta.env.BASE_URL}logo.png`}
                alt="Ilhamify ইলহামিফাই"
                className="h-8 w-auto object-contain"
              />
              {triggerContext === 'download' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-100 text-teal-800 text-[11px] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  ডাউনলোড সম্পন্ন
                </span>
              )}
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {view === 'initial' ? (
                <motion.div
                  key="initial"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  className="pt-5 space-y-5"
                >
                  <div className="space-y-2 text-center sm:text-left">
                    <h2
                      id="welcome-modal-title"
                      className="text-xl font-bold tracking-tight text-slate-900"
                    >
                      {triggerContext === 'download'
                        ? 'আপনার ফাইলটি ডাউনলোড হয়েছে'
                        : 'Ilhamify ইলহামিফাই-তে স্বাগতম'}
                    </h2>
                    <p className="text-sm leading-relaxed text-slate-600">
                      {triggerContext === 'download'
                        ? 'ফোনের হোম স্ক্রিন থেকে আরও দ্রুত ব্যবহার ও অফলাইন সুবিধার জন্য Ilhamify অ্যাপটি ইনস্টল করতে পারেন অথবা ব্রাউজারেই চালিয়ে যেতে পারেন।'
                        : '৬৫০+ ইসলামিক ও মোটিভেশনাল বাংলা ক্যাপশন, কোট কার্ড এবং ৯:১৬ রিল ভিডিও তৈরি করুন সহজেই—অ্যাপ হিসেবে ইনস্টল করে অথবা সরাসরি ব্রাউজারে।'}
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={handleInstallClick}
                      className="w-full min-h-[48px] px-4 py-3 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
                    >
                      <Download className="w-4 h-4 shrink-0" />
                      <span>অ্যাপ ইনস্টল করুন</span>
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={onClose}
                      className="w-full min-h-[48px] px-4 py-3 text-sm font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <Globe className="w-4 h-4 shrink-0" />
                      <span>ব্রাউজারে ব্যবহার করুন</span>
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="guide"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  className="pt-5 space-y-4"
                >
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-100 text-teal-800 text-xs font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>ওপেন সোর্স ওয়েব অ্যাপ (PWA)</span>
                    </div>

                    <h2
                      id="welcome-modal-title"
                      className="text-lg font-bold tracking-tight text-slate-900"
                    >
                      হোম স্ক্রিনে Ilhamify যুক্ত করুন
                    </h2>

                    <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                      {isIOS
                        ? 'iPhone বা iPad-এ Safari ব্রাউজার থেকে সরাসরি হোম স্ক্রিনে অ্যাপটি যুক্ত করতে নিচের ধাপ দুটি অনুসরণ করুন:'
                        : 'আপনার বর্তমান ব্রাউজারটি স্বয়ংক্রিয় ইনস্টল প্রম্পট দেখায়নি। অনুগ্রহ করে ব্রাউজারের মেনু থেকে সহজেই অ্যাপটি যুক্ত করুন:'}
                    </p>
                  </div>

                  {isIOS ? (
                    <ol className="space-y-2.5 text-xs sm:text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
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
                    <div className="space-y-2.5">
                      <div
                        className={`p-3 rounded-xl border space-y-1 ${
                          browserKind === 'brave'
                            ? 'bg-teal-50/80 border-teal-300'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                          <Shield className="w-4 h-4 text-teal-700 shrink-0" />
                          <span>Brave ব্রাউজারের জন্য:</span>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-600">
                          Brave-এর <strong className="text-slate-900">Shields</strong> আইকন অথবা তিন-ডট মেনু (
                          <strong className="inline-flex items-center text-slate-900">
                            <MoreVertical className="w-3 h-3" />
                          </strong>
                          ) থেকে <strong className="text-slate-900">Install app</strong> বা{' '}
                          <strong className="text-slate-900">Add to Home screen</strong> নির্বাচন করুন।
                        </p>
                      </div>

                      <div
                        className={`p-3 rounded-xl border space-y-1 ${
                          browserKind === 'firefox'
                            ? 'bg-teal-50/80 border-teal-300'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                          <Compass className="w-4 h-4 text-teal-700 shrink-0" />
                          <span>Firefox ব্রাউজারের জন্য:</span>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-600">
                          Firefox-এর মেনু (<strong className="text-slate-900">⋮</strong>) খুলে{' '}
                          <strong className="text-slate-900">Install</strong> অথবা{' '}
                          <strong className="text-slate-900">Add to Home screen</strong> বাটনে ট্যাপ করুন।
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 flex items-start gap-2.5">
                        <Chrome className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                        <p className="text-xs leading-relaxed text-teal-900">
                          <strong className="font-semibold">সবচেয়ে সহজ উপায়:</strong> এক-ট্যাপে অ্যাপ ইনস্টল করতে সাইটটি{' '}
                          <strong className="font-semibold">Google Chrome</strong> ব্রাউজারে খুলুন।
                        </p>
                      </div>
                    </div>
                  )}

                  {/* পেছনে যান ও ব্রাউজারে ব্যবহার করুন */}
                  <div className="pt-1 flex flex-col sm:flex-row items-stretch gap-2">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => setView('initial')}
                      className="sm:w-auto min-h-[44px] px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                    >
                      <ArrowLeft className="w-4 h-4 shrink-0" />
                      <span>পেছনে যান</span>
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={onClose}
                      className="flex-1 min-h-[44px] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                    >
                      <Globe className="w-4 h-4 shrink-0" />
                      <span>ব্রাউজারে ব্যবহার করুন</span>
                    </motion.button>
                  </div>

                  {/* সেকেন্ডারি ওপেন-সোর্স GitHub ও ফেসবুক পেজ লিংক */}
                  <div className="pt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
                    <a
                      href={GITHUB_REPO_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-teal-700 hover:text-teal-800 underline underline-offset-4 transition-colors"
                    >
                      <span>GitHub ওপেন সোর্স</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                    <a
                      href={ILHAMIFY_FACEBOOK_PAGE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-teal-700 hover:text-teal-800 underline underline-offset-4 transition-colors"
                    >
                      <span>Ilhamify ফেসবুক পেজ</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
