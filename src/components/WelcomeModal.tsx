import {
  ArrowLeft,
  CheckCircle2,
  Download,
  ExternalLink,
  Globe,
  Info,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

const GITHUB_REPO_URL = 'https://github.com/tamim311mbt-ai/Ilhamify-o.1';
const APK_DOWNLOAD_URL = '[আপনার-APK-লিংক]';
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
  const [view, setView] = useState<'initial' | 'apk'>('initial');

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
                        ? 'মোবাইলে আরও দ্রুত ও সহজ অভিজ্ঞতার জন্য আমাদের Android APK ডাউনলোড করতে পারেন অথবা ব্রাউজারেই কাজ চালিয়ে যেতে পারেন।'
                        : '৬৫০+ ইসলামিক ও মোটিভেশনাল বাংলা ক্যাপশন, কোট কার্ড এবং ৯:১৬ রিল ভিডিও তৈরি করুন সহজেই—অ্যান্ড্রয়েড অ্যাপ হিসেবে অথবা সরাসরি ব্রাউজারে।'}
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => setView('apk')}
                      className="w-full min-h-[48px] px-4 py-3 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
                    >
                      <Smartphone className="w-4 h-4 shrink-0" />
                      <span>APK ডাউনলোড করুন</span>
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
                  key="apk"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  className="pt-5 space-y-4"
                >
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-100 text-teal-800 text-xs font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>ওপেন সোর্স সফটওয়্যার</span>
                    </div>

                    <h2
                      id="welcome-modal-title"
                      className="text-lg font-bold tracking-tight text-slate-900"
                    >
                      Ilhamify Android APK ডাউনলোড
                    </h2>

                    <p className="text-sm leading-relaxed text-slate-600">
                      এটি একটি সম্পূর্ণ <strong className="font-semibold text-slate-900">ওপেন সোর্স সফটওয়্যার</strong>। আপনি চাইলে এর সোর্স কোড যাচাই করতে পারেন অথবা সরাসরি APK ফাইল ডাউনলোড করে ফোনে ইনস্টল করতে পারেন।
                    </p>
                  </div>

                  {/* GitHub রিপোজিটরি লিংক */}
                  <a
                    href={GITHUB_REPO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-teal-700 hover:bg-teal-50/70 transition-colors group"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900">
                        GitHub রিপোজিটরি (সোর্স কোড)
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">
                        {GITHUB_REPO_URL}
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-teal-700 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </a>

                  {/* ডাউনলোড বাটন */}
                  <motion.a
                    whileTap={{ scale: 0.98 }}
                    href={APK_DOWNLOAD_URL}
                    download
                    className="w-full min-h-[48px] px-4 py-3 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Download className="w-4 h-4 shrink-0" />
                    <span>APK ফাইল ডাউনলোড করুন</span>
                  </motion.a>

                  {/* Install unknown apps নোট */}
                  <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 flex items-start gap-2.5 text-xs leading-relaxed text-slate-700">
                    <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                    <span>
                      নোট: ব্রাউজার থেকে সরাসরি APK ইনস্টল করার সময় প্রয়োজনে ফোনের Settings থেকে{' '}
                      <strong className="font-semibold text-slate-900">
                        &ldquo;Install unknown apps&rdquo;
                      </strong>{' '}
                      অনুমতি চালু করে নিন।
                    </span>
                  </div>

                  {/* পেজ ও ব্রাউজার অ্যাকশন */}
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
                      className="flex-1 min-h-[44px] px-4 py-2.5 text-xs sm:text-sm font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                    >
                      <Globe className="w-4 h-4 shrink-0" />
                      <span>ব্রাউজারে ব্যবহার করুন</span>
                    </motion.button>
                  </div>

                  {/* সেকেন্ডারি অফিশিয়াল ফেসবুক পেজ লিংক */}
                  <div className="pt-1 text-center">
                    <a
                      href={ILHAMIFY_FACEBOOK_PAGE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 hover:text-teal-800 underline underline-offset-4 transition-colors"
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
