import { AnimatePresence, motion, useAnimate } from 'motion/react';
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  Check,
  Download,
  Film,
  Music,
  Palette,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Stamp,
  Trash2,
  Type,
  Upload,
  X,
} from 'lucide-react';
import { BACKGROUND_THEMES, TYPOGRAPHY_PRESETS } from '../data/themes';
import { useLoadedImage } from '../hooks/useLoadedImage';
import {
  BrandKitState,
  ReelDuration,
  ReelMotionStyle,
  ReelSettings,
} from '../types/studio';
import { formatBanglaSeconds, toBanglaNumber } from '../utils/banglaDigits';
import { renderReelFrame } from '../utils/canvasRenderer';

interface ReelMakerViewProps {
  caption: string;
  attribution: string;
  onChangeCaption: (text: string) => void;
  onChangeAttribution: (text: string) => void;
  brandKit: BrandKitState;
  onUpdateBrandKit: (patch: Partial<BrandKitState>) => void;
  onOpenBrandKit: () => void;
  onDownloadComplete?: () => void;
}

const MOTION_STYLES: { id: ReelMotionStyle; label: string; desc: string }[] = [
  { id: 'drift', label: 'মৃদু প্রবাহ', desc: 'ধীর গতির আলোর প্রবাহ' },
  { id: 'breathing', label: 'স্পন্দন জুম', desc: 'হালকা ছন্দময় বিস্তার' },
  { id: 'kinetic', label: 'কাইনেটিক ফেড', desc: 'লাইনের পর লাইন প্রকাশ' },
  { id: 'horizon', label: 'শান্ত দিগন্ত', desc: 'কোমল আলোর ঝলক' },
];

const DURATIONS: ReelDuration[] = [5, 10, 15];

function pickSupportedVideoMime(): { mimeType: string; ext: 'mp4' | 'webm' } | null {
  if (typeof MediaRecorder === 'undefined') return null;
  const candidates: { mimeType: string; ext: 'mp4' | 'webm' }[] = [
    { mimeType: 'video/mp4;codecs=avc1.42E01E', ext: 'mp4' },
    { mimeType: 'video/mp4', ext: 'mp4' },
    { mimeType: 'video/webm;codecs=vp9', ext: 'webm' },
    { mimeType: 'video/webm;codecs=vp8', ext: 'webm' },
    { mimeType: 'video/webm', ext: 'webm' },
  ];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c.mimeType)) {
      return c;
    }
  }
  return null;
}

export function ReelMakerView({
  caption,
  attribution,
  onChangeCaption,
  onChangeAttribution,
  brandKit,
  onUpdateBrandKit,
  onOpenBrandKit,
  onDownloadComplete,
}: ReelMakerViewProps) {
  const [settings, setSettings] = useState<ReelSettings>({
    themeId: 'emerald-night',
    typographyId: 'serif',
    motionStyle: 'kinetic',
    duration: 10,
    fontSize: 54,
    textAlign: 'center',
    showParticles: true,
    resolution: '720p',
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);

  const [exportState, setExportState] = useState<
    'idle' | 'recording' | 'ready' | 'unsupported' | 'error'
  >('idle');
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  const [exportedExt, setExportExt] = useState<'mp4' | 'webm'>('webm');
  const [exportStatusMessage, setExportStatusMessage] = useState<string>('');

  const [audioFileUrl, setAudioFileUrl] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string>('');
  const [audioFileSize, setAudioFileSize] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const audioElementRef = useRef<HTMLAudioElement>(null);
  const [stageScope, animateStage] = useAnimate();
  const isFirstRenderRef = useRef(true);
  const exportCancelRef = useRef<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const logoImage = useLoadedImage(brandKit.logoDataUrl);

  // মোশন, থিম বা ফন্ট বদলালে মসৃণ প্রিভিউ ট্রানজিশন
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    if (!stageScope.current) return;
    animateStage(
      stageScope.current,
      { opacity: [0.78, 1], scale: [0.975, 1] },
      { duration: 0.18, ease: [0.16, 1, 0.3, 1] }
    );
  }, [
    settings.motionStyle,
    settings.themeId,
    settings.typographyId,
    settings.duration,
    settings.textAlign,
    animateStage,
    stageScope,
  ]);

  const theme = useMemo(
    () => BACKGROUND_THEMES.find((t) => t.id === settings.themeId) ?? BACKGROUND_THEMES[0],
    [settings.themeId]
  );

  const typography = useMemo(
    () => TYPOGRAPHY_PRESETS.find((t) => t.id === settings.typographyId) ?? TYPOGRAPHY_PRESETS[0],
    [settings.typographyId]
  );

  useEffect(() => {
    return () => {
      if (exportedVideoUrl) {
        URL.revokeObjectURL(exportedVideoUrl);
      }
    };
  }, [exportedVideoUrl]);

  useEffect(() => {
    return () => {
      if (audioFileUrl) {
        URL.revokeObjectURL(audioFileUrl);
      }
    };
  }, [audioFileUrl]);

  const MAX_AUDIO_SIZE_BYTES = 15 * 1024 * 1024;

  const formatAudioTime = (seconds: number) => {
    const safe = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
    const mins = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${toBanglaNumber(String(mins).padStart(2, '0'))}:${toBanglaNumber(String(secs).padStart(2, '0'))}`;
  };

  const formatFileSizeMb = (bytes: number) => {
    const mb = (bytes / (1024 * 1024)).toFixed(1).replace('.', '.');
    return `${toBanglaNumber(mb)} মেগাবাইট`;
  };

  const handleAudioFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAudioError(null);
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const hasAudioMime = file.type.startsWith('audio/');
    const hasAudioExt = /\.(mp3|wav|m4a|ogg|aac|flac|opus|webm)$/i.test(file.name);
    if (!hasAudioMime && !hasAudioExt) {
      setAudioError('অসমর্থিত ফাইল ফরম্যাট। অনুগ্রহ করে MP3, WAV, M4A বা OGG অডিও ফাইল নির্বাচন করুন।');
      return;
    }

    if (file.size > MAX_AUDIO_SIZE_BYTES) {
      setAudioError('অডিও ফাইলটি ১৫ মেগাবাইটের বেশি বড়। অনুগ্রহ করে ছোট আকারের অডিও দিন।');
      return;
    }

    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
    if (audioFileUrl) {
      URL.revokeObjectURL(audioFileUrl);
    }

    const nextUrl = URL.createObjectURL(file);
    setAudioFileUrl(nextUrl);
    setAudioFileName(file.name);
    setAudioFileSize(file.size);
    setAudioDuration(0);
    setAudioCurrentTime(0);
    setIsAudioPlaying(false);
  };

  const handleToggleAudioPlay = async () => {
    const el = audioElementRef.current;
    if (!el) return;
    if (isAudioPlaying) {
      el.pause();
      setIsAudioPlaying(false);
    } else {
      try {
        await el.play();
        setIsAudioPlaying(true);
      } catch {
        setAudioError('এই অডিও ফাইলটি ব্রাউজারে চালানো সম্ভব হচ্ছে না। অন্য ফাইল দিয়ে চেষ্টা করুন।');
        setIsAudioPlaying(false);
      }
    }
  };

  const handleRemoveAudio = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
    if (audioFileUrl) {
      URL.revokeObjectURL(audioFileUrl);
    }
    setAudioFileUrl(null);
    setAudioFileName('');
    setAudioFileSize(0);
    setAudioDuration(0);
    setAudioCurrentTime(0);
    setIsAudioPlaying(false);
    setAudioError(null);
  };

  useEffect(() => {
    let rafId = 0;
    let lastTimestamp = performance.now();

    const drawFrame = (p: number) => {
      const canvas = previewCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (canvas.width !== 540 || canvas.height !== 960) {
        canvas.width = 540;
        canvas.height = 960;
      }

      renderReelFrame({
        ctx,
        width: 540,
        height: 960,
        caption,
        attribution,
        theme,
        typography,
        settings,
        brandKit,
        logoImage,
        progress: p,
      });
    };

    if (!isPlaying) {
      drawFrame(progress);
      return;
    }

    let currentP = progress;
    const tick = (now: number) => {
      const dt = (now - lastTimestamp) / 1000;
      lastTimestamp = now;
      currentP = (currentP + dt / settings.duration) % 1;
      setProgress(currentP);
      drawFrame(currentP);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, settings, caption, attribution, theme, typography, brandKit, logoImage]);

  useEffect(() => {
    if (isPlaying) return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (canvas.width !== 540 || canvas.height !== 960) {
      canvas.width = 540;
      canvas.height = 960;
    }
    renderReelFrame({
      ctx,
      width: 540,
      height: 960,
      caption,
      attribution,
      theme,
      typography,
      settings,
      brandKit,
      logoImage,
      progress,
    });
  }, [isPlaying, progress, settings, caption, attribution, theme, typography, brandKit, logoImage]);

  const handleRestart = () => {
    setProgress(0);
    setIsPlaying(true);
  };

  const handleExportVideo = async () => {
    const supported = pickSupportedVideoMime();
    const testCanvas = document.createElement('canvas');
    if (!supported || typeof testCanvas.captureStream !== 'function') {
      setExportState('unsupported');
      setExportStatusMessage(
        'আপনার বর্তমান ব্রাউজারে সরাসরি ভিডিও রেকর্ডিং সমর্থিত নয়। চাইলে ৯:১৬ ছবি হিসেবে ডাউনলোড করতে পারেন।'
      );
      return;
    }

    if (exportedVideoUrl) {
      URL.revokeObjectURL(exportedVideoUrl);
      setExportedVideoUrl(null);
    }

    exportCancelRef.current = false;
    setExportState('recording');
    setExportProgress(0);
    setExportExt(supported.ext);
    setExportStatusMessage(
      `${toBanglaNumber(settings.duration)} সেকেন্ডের রিল ভিডিও তৈরি হচ্ছে...`
    );

    const width = settings.resolution === '1080p' ? 1080 : 720;
    const height = settings.resolution === '1080p' ? 1920 : 1280;

    const recordCanvas = document.createElement('canvas');
    recordCanvas.width = width;
    recordCanvas.height = height;
    const ctx = recordCanvas.getContext('2d');
    if (!ctx) {
      setExportState('error');
      setExportStatusMessage('ভিডিও ক্যানভাস চালু করা যায়নি।');
      return;
    }

    renderReelFrame({
      ctx,
      width,
      height,
      caption,
      attribution,
      theme,
      typography,
      settings,
      brandKit,
      logoImage,
      progress: 0,
    });

    const stream = recordCanvas.captureStream(30);
    const chunks: BlobPart[] = [];

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, {
        mimeType: supported.mimeType,
        videoBitsPerSecond: settings.resolution === '1080p' ? 6_000_000 : 3_800_000,
      });
    } catch {
      setExportState('error');
      setExportStatusMessage('এই ফরম্যাটে ভিডিও রেকর্ডিং শুরু করা যায়নি।');
      return;
    }

    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) {
        chunks.push(ev.data);
      }
    };

    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      if (exportCancelRef.current) {
        setExportState('idle');
        setExportProgress(0);
        setExportStatusMessage('');
        return;
      }

      const blob = new Blob(chunks, { type: supported.mimeType });
      const url = URL.createObjectURL(blob);
      setExportedVideoUrl(url);
      setExportState('ready');
      setExportProgress(100);
      setExportStatusMessage(
        `ভিডিও প্রস্তুত (${settings.resolution === '1080p' ? '১০৮০পি ফুল এইচডি' : '৭২০পি এইচডি'})`
      );

      const a = document.createElement('a');
      a.href = url;
      a.download = `ilhamify-reel-${settings.duration}s-${Date.now()}.${supported.ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => onDownloadComplete?.(), 500);
    };

    recorder.onerror = () => {
      stream.getTracks().forEach((t) => t.stop());
      setExportState('error');
      setExportStatusMessage('ভিডিও রেকর্ডিংয়ের সময় একটি ত্রুটি ঘটেছে।');
    };

    recorder.start(250);

    const startTime = performance.now();
    const totalMs = settings.duration * 1000;

    const renderLoop = (now: number) => {
      if (exportCancelRef.current) {
        if (recorder.state !== 'inactive') recorder.stop();
        return;
      }

      const elapsed = now - startTime;
      const p = Math.min(1, elapsed / totalMs);

      renderReelFrame({
        ctx,
        width,
        height,
        caption,
        attribution,
        theme,
        typography,
        settings,
        brandKit,
        logoImage,
        progress: p,
      });

      setExportProgress(Math.round(p * 100));

      if (elapsed < totalMs) {
        requestAnimationFrame(renderLoop);
      } else {
        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
      }
    };

    requestAnimationFrame(renderLoop);
  };

  const handleCancelExport = () => {
    exportCancelRef.current = true;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleDownloadFallbackFrame = () => {
    const offscreen = document.createElement('canvas');
    offscreen.width = 1080;
    offscreen.height = 1920;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    renderReelFrame({
      ctx,
      width: 1080,
      height: 1920,
      caption,
      attribution,
      theme,
      typography,
      settings,
      brandKit,
      logoImage,
      progress: 0.5,
    });

    offscreen.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ilhamify-reel-frame-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setTimeout(() => onDownloadComplete?.(), 500);
    }, 'image/png');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ডান/উপর স্টেজ: ৯:১৬ রিল প্রিভিউ ও ভিডিও ডাউনলোড */}
        <div className="lg:col-span-6 lg:order-2 lg:sticky lg:top-6 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-6 space-y-4">
            <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100">
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <span className="font-semibold text-slate-900">৯:১৬ রিল প্রিভিউ</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  {toBanglaNumber(settings.duration)} সেকেন্ড ·{' '}
                  {settings.resolution === '1080p' ? '১০৮০পি' : '৭২০পি'}
                </span>
              </div>
              <span className="text-xs tabular-nums text-slate-500">
                {formatBanglaSeconds(progress * settings.duration)} /{' '}
                {formatBanglaSeconds(settings.duration)}
              </span>
            </div>

            <div className="py-4 px-4 bg-slate-100/80 rounded-xl flex justify-center overflow-hidden">
              <div ref={stageScope} className="w-full flex justify-center">
                <canvas
                  ref={previewCanvasRef}
                  className="w-full max-w-[280px] sm:max-w-[300px] aspect-[9/16] rounded-2xl shadow-lg border border-slate-300/70"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPlaying((p) => !p)}
                aria-label={isPlaying ? 'প্রিভিউ থামান' : 'প্রিভিউ চালান'}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors shrink-0"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={handleRestart}
                aria-label="শুরু থেকে চালান"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <input
                type="range"
                aria-label="রিল টাইমলাইন"
                min={0}
                max={0.999}
                step={0.005}
                value={progress}
                onChange={(e) => {
                  setIsPlaying(false);
                  setProgress(parseFloat(e.target.value));
                }}
                className="flex-1 accent-teal-700 cursor-pointer"
              />
            </div>

            {/* ভিডিও ডাউনলোড ও স্ট্যাটাস */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <AnimatePresence mode="wait" initial={false}>
                {exportState === 'recording' ? (
                  <motion.div
                    key="recording"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
                  >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-900">{exportStatusMessage}</span>
                    <span className="tabular-nums font-semibold text-teal-700">
                      {toBanglaNumber(exportProgress)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-700 transition-all duration-150"
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500">
                      ভিডিও তৈরি শেষ না হওয়া পর্যন্ত এই ট্যাবটি খোলা রাখুন
                    </span>
                    <button
                      type="button"
                      onClick={handleCancelExport}
                      className="min-h-[36px] px-3 py-1 text-xs font-medium text-rose-700 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      বাতিল
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="idle-or-ready"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
                >
                  <div className="text-xs text-slate-500">
                    {exportState === 'ready' ? (
                      <span className="text-emerald-700 font-medium flex items-center gap-1.5">
                        <Check className="w-4 h-4 shrink-0" />
                        {exportStatusMessage}
                      </span>
                    ) : exportState === 'unsupported' || exportState === 'error' ? (
                      <span className="text-amber-700 font-medium">{exportStatusMessage}</span>
                    ) : (
                      <span>সরাসরি ব্রাউজার থেকেই ৯:১৬ রিল ভিডিও রেন্ডার ও ডাউনলোড হবে।</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {exportState === 'ready' && exportedVideoUrl && (
                      <a
                        href={exportedVideoUrl}
                        download={`ilhamify-reel-${settings.duration}s.${exportedExt}`}
                        className="min-h-[46px] px-4 py-2.5 text-sm font-semibold text-teal-800 bg-teal-50 border border-teal-200 rounded-xl hover:bg-teal-100 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                      >
                        <Download className="w-4 h-4" />
                        ফাইল সেভ করুন
                      </a>
                    )}

                    {exportState === 'unsupported' && (
                      <button
                        type="button"
                        onClick={handleDownloadFallbackFrame}
                        className="min-h-[46px] px-4 py-2.5 text-sm font-semibold text-slate-900 bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                      >
                        <Download className="w-4 h-4" />
                        ছবি ডাউনলোড করুন
                      </button>
                    )}

                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      onClick={handleExportVideo}
                      className="min-h-[46px] px-5 py-2.5 text-sm font-semibold text-white bg-teal-700 rounded-xl hover:bg-teal-800 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <Film className="w-4 h-4" />
                      ভিডিও ডাউনলোড করুন
                    </motion.button>
                  </div>
                </motion.div>
              )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* বাম কন্ট্রোল কলাম */}
        <div className="lg:col-span-6 lg:order-1 space-y-5">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">রিল মেকার</h1>
            <p className="text-sm text-slate-600">
              হালকা মোশন, বাংলা ক্যাপশন এবং কাস্টম নাম ও লোগো দিয়ে ৯:১৬ শর্ট ভিডিও তৈরি করুন।
            </p>
          </div>

          {/* রিলের লেখা */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3.5">
            <h2 className="text-sm font-semibold text-slate-900">রিলের ক্যাপশন</h2>
            <textarea
              rows={3}
              value={caption}
              onChange={(e) => onChangeCaption(e.target.value)}
              placeholder="রিল ভিডিওর জন্য বাংলা ক্যাপশন লিখুন..."
              className="w-full p-3 text-sm leading-relaxed text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-teal-700 resize-y"
            />
            <input
              type="text"
              value={attribution}
              onChange={(e) => onChangeAttribution(e.target.value)}
              placeholder="ঐচ্ছিক ছোট শিরোনাম বা সূত্র"
              className="w-full h-10 px-3 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-teal-700"
            />
          </section>

          {/* মোশন ও সময়কাল */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-slate-500" />
              মোশন ও সময়কাল
            </h2>

            <div className="grid grid-cols-2 gap-2.5">
              {MOTION_STYLES.map((m) => {
                const active = settings.motionStyle === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setSettings((s) => ({ ...s, motionStyle: m.id }));
                      handleRestart();
                    }}
                    className={`min-h-[56px] px-3.5 py-2.5 rounded-xl border text-left transition-colors ${
                      active
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-semibold">{m.label}</div>
                    <div
                      className={`text-[11px] mt-0.5 ${
                        active ? 'text-teal-100' : 'text-slate-500'
                      }`}
                    >
                      {m.desc}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <span className="block text-xs font-medium text-slate-700 mb-1.5">
                  ভিডিওর দৈর্ঘ্য
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {DURATIONS.map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => {
                        setSettings((s) => ({ ...s, duration: dur }));
                        setProgress(0);
                      }}
                      className={`min-h-[40px] rounded-lg border text-xs font-semibold tabular-nums transition-colors ${
                        settings.duration === dur
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {toBanglaNumber(dur)} সেকেন্ড
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-xs font-medium text-slate-700 mb-1.5">
                  ভিডিওর মান
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, resolution: '720p' }))}
                    className={`min-h-[40px] rounded-lg border text-xs font-semibold tabular-nums transition-colors ${
                      settings.resolution === '720p'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    ৭২০পি এইচডি
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, resolution: '1080p' }))}
                    className={`min-h-[40px] rounded-lg border text-xs font-semibold tabular-nums transition-colors ${
                      settings.resolution === '1080p'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    ১০৮০পি ফুল এইচডি
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-medium text-slate-700">
                ভাসমান আলোর কণা দেখান
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={settings.showParticles}
                aria-label="ভাসমান আলোর কণা চালু বা বন্ধ করুন"
                onClick={() =>
                  setSettings((s) => ({ ...s, showParticles: !s.showParticles }))
                }
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
                  settings.showParticles ? 'bg-teal-700' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    settings.showParticles ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </section>

          {/* অডিও আপলোড ও প্রিভিউ */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Music className="w-4 h-4 text-teal-700" />
                রিলের অডিও (ঐচ্ছিক)
              </h2>
              <span className="text-[11px] text-slate-500">MP3, WAV, M4A, OGG · সর্বোচ্চ ১৫ মেগাবাইট</span>
            </div>

            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              onChange={handleAudioFileChange}
              className="hidden"
            />

            {audioFileUrl ? (
              <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl space-y-3">
                <audio
                  ref={audioElementRef}
                  src={audioFileUrl}
                  preload="metadata"
                  onLoadedMetadata={(e) => {
                    const dur = e.currentTarget.duration;
                    if (Number.isFinite(dur)) setAudioDuration(dur);
                  }}
                  onTimeUpdate={(e) => setAudioCurrentTime(e.currentTarget.currentTime)}
                  onEnded={() => {
                    setIsAudioPlaying(false);
                    setAudioCurrentTime(0);
                  }}
                  onError={() => {
                    setIsAudioPlaying(false);
                    setAudioError('নির্বাচিত অডিও ফাইলটি পড়া বা চালানো সম্ভব হয়নি।');
                  }}
                  className="hidden"
                />

                <div className="flex items-center gap-3 min-w-0">
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    type="button"
                    onClick={handleToggleAudioPlay}
                    aria-label={isAudioPlaying ? 'অডিও থামান' : 'অডিও চালান'}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-teal-700 text-white hover:bg-teal-800 transition-colors shrink-0"
                  >
                    {isAudioPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </motion.button>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                        {audioFileName}
                      </p>
                      <span className="text-[11px] tabular-nums text-slate-500 shrink-0">
                        {formatFileSizeMb(audioFileSize)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        aria-label="অডিও টাইমলাইন"
                        min={0}
                        max={audioDuration > 0 ? audioDuration : 1}
                        step={0.1}
                        value={Math.min(audioCurrentTime, audioDuration || 1)}
                        onChange={(e) => {
                          const nextTime = parseFloat(e.target.value);
                          setAudioCurrentTime(nextTime);
                          if (audioElementRef.current) {
                            audioElementRef.current.currentTime = nextTime;
                          }
                        }}
                        className="flex-1 min-w-0 accent-teal-700 cursor-pointer"
                      />
                      <span className="text-[11px] tabular-nums text-slate-600 shrink-0">
                        {formatAudioTime(audioCurrentTime)} / {formatAudioTime(audioDuration)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-teal-200/70">
                  <span className="text-[11px] text-slate-600">
                    আপলোড করা অডিও কেবল এই ব্রাউজার সেশনে লোকালি প্রিভিউ হবে।
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => audioInputRef.current?.click()}
                      className="min-h-[36px] px-3 py-1.5 text-xs font-medium text-teal-800 bg-white border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors whitespace-nowrap"
                    >
                      পরিবর্তন করুন
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveAudio}
                      aria-label="অডিও মুছুন"
                      className="min-h-[36px] px-3 py-1.5 text-xs font-medium text-rose-700 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors flex items-center gap-1 whitespace-nowrap"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      মুছুন
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <motion.button
                  whileTap={{ scale: 0.99 }}
                  type="button"
                  onClick={() => audioInputRef.current?.click()}
                  className="w-full py-4 px-4 border border-dashed border-teal-300 rounded-xl bg-teal-50/70 hover:bg-teal-100/70 hover:border-teal-700 transition-colors flex flex-col sm:flex-row items-center justify-center gap-3 text-center sm:text-left"
                >
                  <span className="min-h-[40px] px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-teal-700 rounded-lg inline-flex items-center gap-2 shrink-0">
                    <Upload className="w-4 h-4" />
                    ডিভাইস থেকে অডিও যুক্ত করুন
                  </span>
                  <span className="text-xs text-slate-600">
                    MP3, WAV, M4A বা OGG ফাইল নির্বাচন করে রিলের সাথে শুনুন
                  </span>
                </motion.button>
                <p className="text-[11px] text-slate-500">
                  নোট: আপলোড করা অডিও কেবল আপনার ব্রাউজারেই লোকাল প্রিভিউর জন্য ব্যবহৃত হয় এবং সার্ভারে সংরক্ষণ করা হয় না।
                </p>
              </div>
            )}

            {audioError && (
              <p role="alert" className="text-xs font-medium text-rose-600">
                {audioError}
              </p>
            )}
          </section>

          {/* ব্যাকগ্রাউন্ড থিম */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Palette className="w-4 h-4 text-slate-500" />
                ব্যাকগ্রাউন্ড থিম
              </h2>
              <span className="text-xs text-slate-500">{theme.name}</span>
            </div>
            <div className="grid grid-cols-5 gap-2.5">
              {BACKGROUND_THEMES.map((t) => {
                const active = settings.themeId === t.id;
                const bgStyle =
                  t.kind === 'solid' || t.colors.length === 1
                    ? t.colors[0]
                    : `linear-gradient(${t.angle ?? 145}deg, ${t.colors.join(', ')})`;

                return (
                  <button
                    key={t.id}
                    type="button"
                    title={t.name}
                    aria-label={t.name}
                    onClick={() => setSettings((s) => ({ ...s, themeId: t.id }))}
                    className={`h-11 rounded-xl border transition-transform active:scale-95 flex items-center justify-center ${
                      active
                        ? 'ring-2 ring-teal-700 ring-offset-2 border-slate-300'
                        : 'border-slate-200 hover:scale-[1.03]'
                    }`}
                    style={{ background: bgStyle }}
                  >
                    {active && (
                      <Check
                        className={`w-4 h-4 ${t.isDark ? 'text-white' : 'text-slate-900'}`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* বাংলা ফন্ট ও আকার */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Type className="w-4 h-4 text-slate-500" />
              বাংলা ফন্ট
            </h2>

            <div className="grid grid-cols-2 gap-2">
              {TYPOGRAPHY_PRESETS.map((preset) => {
                const active = settings.typographyId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, typographyId: preset.id }))}
                    className={`min-h-[42px] px-3 py-2 text-xs font-medium rounded-xl border transition-colors text-left ${
                      active
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {preset.name}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-4 items-center">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-700">ফন্টের আকার</span>
                  <span className="tabular-nums text-slate-500">
                    {toBanglaNumber(settings.fontSize)}
                  </span>
                </div>
                <input
                  type="range"
                  min={36}
                  max={74}
                  step={2}
                  value={settings.fontSize}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, fontSize: parseInt(e.target.value, 10) }))
                  }
                  className="w-full accent-teal-700 cursor-pointer"
                />
              </div>

              <div>
                <span className="block text-xs font-medium text-slate-700 mb-1.5">সাজানো</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, textAlign: 'center' }))}
                    className={`min-h-[38px] rounded-lg border flex items-center justify-center gap-1.5 text-xs font-medium transition-colors ${
                      settings.textAlign === 'center'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                    মাঝে
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, textAlign: 'left' }))}
                    className={`min-h-[38px] rounded-lg border flex items-center justify-center gap-1.5 text-xs font-medium transition-colors ${
                      settings.textAlign === 'left'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                    বামে
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* কাস্টম নাম ও লোগো */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Stamp className="w-4 h-4 text-slate-500" />
                কাস্টম নাম ও লোগো
              </h2>
              <button
                type="button"
                onClick={onOpenBrandKit}
                className="text-xs font-semibold text-teal-700 hover:text-teal-800 transition-colors whitespace-nowrap"
              >
                পরিবর্তন করুন
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onUpdateBrandKit({ showHandle: !brandKit.showHandle })}
                className={`min-h-[38px] px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  brandKit.showHandle
                    ? 'bg-teal-50 text-teal-800 border-teal-200'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                {brandKit.showHandle ? 'নাম: চালু' : 'নাম: বন্ধ'}
              </button>

              <button
                type="button"
                onClick={() => onUpdateBrandKit({ showLogo: !brandKit.showLogo })}
                className={`min-h-[38px] px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  brandKit.showLogo && brandKit.logoDataUrl
                    ? 'bg-teal-50 text-teal-800 border-teal-200'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                {brandKit.logoDataUrl
                  ? brandKit.showLogo
                    ? 'পিএনজি লোগো: চালু'
                    : 'পিএনজি লোগো: বন্ধ'
                  : 'কোনো লোগো নেই'}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
