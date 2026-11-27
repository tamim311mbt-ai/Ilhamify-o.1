import { AnimatePresence, motion, useAnimate } from 'motion/react';
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  Check,
  Download,
  Film,
  Music,
  Pause,
  Play,
  RotateCcw,
  Share2,
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
import { fixWebmDuration } from '../utils/fixWebmDuration';
import { exportReelMp4 } from '../utils/mp4Exporter';
import { ScrollReveal } from './ScrollReveal';
import { ThemeSelectorGrid } from './ThemeSelectorGrid';

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

interface VideoMimeCandidate {
  mimeType: string;
  ext: 'mp4' | 'webm';
}

function getSupportedVideoMimeCandidates(hasAudio: boolean): VideoMimeCandidate[] {
  if (typeof MediaRecorder === 'undefined') return [];

  // Chrome/Android-এ MediaRecorder-এর video/mp4 ফ্র্যাগমেন্টেড MP4 তৈরি করে যা Facebook কেটে দেয়;
  // তাই WebM (যার Duration ও Segment মেটাডেটা ঠিক করা যায়) আগে রাখুন এবং Safari-তে MP4 ফ্যালব্যাক থাকবে।
  const candidates: VideoMimeCandidate[] = hasAudio
    ? [
        { mimeType: 'video/webm;codecs=vp9,opus', ext: 'webm' },
        { mimeType: 'video/webm;codecs=vp8,opus', ext: 'webm' },
        { mimeType: 'video/webm;codecs=vp9', ext: 'webm' },
        { mimeType: 'video/webm;codecs=vp8', ext: 'webm' },
        { mimeType: 'video/webm', ext: 'webm' },
        { mimeType: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', ext: 'mp4' },
        { mimeType: 'video/mp4;codecs=avc1,mp4a', ext: 'mp4' },
        { mimeType: 'video/mp4', ext: 'mp4' },
      ]
    : [
        { mimeType: 'video/webm;codecs=vp9', ext: 'webm' },
        { mimeType: 'video/webm;codecs=vp8', ext: 'webm' },
        { mimeType: 'video/webm', ext: 'webm' },
        { mimeType: 'video/mp4;codecs=avc1.42E01E', ext: 'mp4' },
        { mimeType: 'video/mp4', ext: 'mp4' },
      ];

  return candidates.filter((c) => MediaRecorder.isTypeSupported(c.mimeType));
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
  const [exportedVideoBlob, setExportedVideoBlob] = useState<Blob | null>(null);
  const [exportedFileName, setExportedFileName] = useState<string>('');
  const [exportedExt, setExportExt] = useState<'mp4' | 'webm'>('webm');
  const [exportStatusMessage, setExportStatusMessage] = useState<string>('');
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [shareFeedback, setShareFeedback] = useState<{
    type: 'success' | 'info' | 'error';
    message: string;
  } | null>(null);

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
  const exportRafRef = useRef<number | null>(null);
  const exportTimerRef = useRef<number | null>(null);
  const exportStreamRef = useRef<MediaStream | null>(null);
  const exportAudioCtxRef = useRef<AudioContext | null>(null);
  const exportAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
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

  const cleanupExportResources = () => {
    if (exportRafRef.current !== null) {
      window.cancelAnimationFrame(exportRafRef.current);
      exportRafRef.current = null;
    }
    if (exportTimerRef.current !== null) {
      window.clearTimeout(exportTimerRef.current);
      exportTimerRef.current = null;
    }
    if (exportAudioSourceRef.current) {
      try {
        exportAudioSourceRef.current.stop();
      } catch {
        // ইতিমধ্যে বন্ধ থাকলে উপেক্ষা করুন
      }
      try {
        exportAudioSourceRef.current.disconnect();
      } catch {
        // উপেক্ষা করুন
      }
      exportAudioSourceRef.current = null;
    }
    if (exportAudioCtxRef.current) {
      const ctxToClose = exportAudioCtxRef.current;
      exportAudioCtxRef.current = null;
      ctxToClose.close().catch(() => {});
    }
    if (exportStreamRef.current) {
      exportStreamRef.current.getTracks().forEach((t) => t.stop());
      exportStreamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      exportCancelRef.current = true;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // উপেক্ষা করুন
        }
      }
      cleanupExportResources();
    };
  }, []);

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
    const testCanvas = document.createElement('canvas');
    const canWebCodecs =
      typeof VideoEncoder === 'function' && typeof VideoFrame === 'function';
    const initialCandidates = getSupportedVideoMimeCandidates(Boolean(audioFileUrl));
    const canMediaRecorder =
      initialCandidates.length > 0 && typeof testCanvas.captureStream === 'function';

    if (!canWebCodecs && !canMediaRecorder) {
      setExportState('unsupported');
      setExportStatusMessage(
        'আপনার বর্তমান ব্রাউজারে সরাসরি ভিডিও রেকর্ডিং সমর্থিত নয়। চাইলে ৯:১৬ ছবি হিসেবে ডাউনলোড করতে পারেন।'
      );
      return;
    }

    if (audioElementRef.current && isAudioPlaying) {
      audioElementRef.current.pause();
      setIsAudioPlaying(false);
    }

    if (exportedVideoUrl) {
      URL.revokeObjectURL(exportedVideoUrl);
      setExportedVideoUrl(null);
    }
    setExportedVideoBlob(null);
    setExportedFileName('');
    setShareFeedback(null);

    cleanupExportResources();
    exportCancelRef.current = false;
    setExportState('recording');
    setExportProgress(0);
    setExportStatusMessage(
      `${toBanglaNumber(settings.duration)} সেকেন্ডের রিল ভিডিও তৈরি হচ্ছে...`
    );

    try {
      await document.fonts?.ready;
    } catch {
      // ফন্ট রেডি চেক ব্যর্থ হলেও রেকর্ডিং চালিয়ে যান
    }

    if (exportCancelRef.current) {
      setExportState('idle');
      setExportStatusMessage('');
      return;
    }

    const width = settings.resolution === '1080p' ? 1080 : 720;
    const height = settings.resolution === '1080p' ? 1920 : 1280;
    const videoBitrate = settings.resolution === '1080p' ? 6_000_000 : 3_800_000;

    const triggerReadyDownload = (blob: Blob, ext: 'mp4' | 'webm') => {
      const fileName = `ilhamify-reel-${settings.duration}s-${Date.now()}.${ext}`;
      const url = URL.createObjectURL(blob);
      setExportedVideoUrl(url);
      setExportedVideoBlob(blob);
      setExportedFileName(fileName);
      setExportExt(ext);
      setExportState('ready');
      setExportProgress(100);
      setExportStatusMessage(
        `ভিডিও প্রস্তুত (${settings.resolution === '1080p' ? '১০৮০পি ফুল এইচডি' : '৭২০পি এইচডি'})`
      );

      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => onDownloadComplete?.(), 500);
    };

    // অডিও থাকলে একবারই ডিকোড করুন (WebCodecs ও MediaRecorder উভয় পথেই ব্যবহারের জন্য)
    let decodedAudio: AudioBuffer | null = null;
    if (audioFileUrl) {
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          exportAudioCtxRef.current = audioCtx;
          const res = await fetch(audioFileUrl);
          const arrayBuf = await res.arrayBuffer();
          decodedAudio = await audioCtx.decodeAudioData(arrayBuf);

          if (exportCancelRef.current) {
            cleanupExportResources();
            setExportState('idle');
            setExportProgress(0);
            setExportStatusMessage('');
            return;
          }
        }
      } catch {
        if (exportAudioCtxRef.current) {
          exportAudioCtxRef.current.close().catch(() => {});
          exportAudioCtxRef.current = null;
        }
        decodedAudio = null;
      }
    }

    // ধাপ ১ (প্রাথমিক): WebCodecs + mp4-muxer দিয়ে নির্ভুল ৩০fps ও Fast-Start MP4 রপ্তানি
    if (canWebCodecs) {
      try {
        let lastMp4Pct = 0;
        const mp4Blob = await exportReelMp4({
          width,
          height,
          durationSeconds: settings.duration,
          fps: 30,
          videoBitrate,
          audioBuffer: decodedAudio,
          renderFrame: (frameCtx, p) => {
            renderReelFrame({
              ctx: frameCtx,
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
          },
          onProgress: (pct) => {
            if (pct !== lastMp4Pct) {
              lastMp4Pct = pct;
              setExportProgress(pct);
            }
          },
          isCancelled: () => exportCancelRef.current,
        });

        if (exportCancelRef.current) {
          cleanupExportResources();
          setExportState('idle');
          setExportProgress(0);
          setExportStatusMessage('');
          return;
        }

        if (mp4Blob) {
          cleanupExportResources();
          triggerReadyDownload(mp4Blob, 'mp4');
          return;
        }
      } catch {
        if (exportCancelRef.current) {
          cleanupExportResources();
          setExportState('idle');
          setExportProgress(0);
          setExportStatusMessage('');
          return;
        }
        // WebCodecs ব্যর্থ হলে নিচের MediaRecorder ফ্যালব্যাক চলবে
      }
    }

    if (!canMediaRecorder) {
      cleanupExportResources();
      setExportState('unsupported');
      setExportStatusMessage(
        'আপনার বর্তমান ব্রাউজারে সরাসরি ভিডিও রেকর্ডিং সমর্থিত নয়। চাইলে ৯:১৬ ছবি হিসেবে ডাউনলোড করতে পারেন।'
      );
      return;
    }

    // ধাপ ২ (ফ্যালব্যাক): MediaRecorder + প্রতি rAF টিক-এ অবিরাম ফ্রেম ড্রয়িং + WebM মেটাডেটা মেরামত
    const recordCanvas = document.createElement('canvas');
    recordCanvas.width = width;
    recordCanvas.height = height;
    const ctx = recordCanvas.getContext('2d');
    if (!ctx) {
      cleanupExportResources();
      setExportState('error');
      setExportStatusMessage('ভিডিও ক্যানভাস চালু করা যায়নি।');
      return;
    }

    // প্রথম ফ্রেম (progress = 0) আগেই ক্যানভাসে এঁকে নিন
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

    let audioTrack: MediaStreamTrack | null = null;
    let audioSource: AudioBufferSourceNode | null = null;

    if (decodedAudio && exportAudioCtxRef.current) {
      try {
        const audioCtx = exportAudioCtxRef.current;
        const dest = audioCtx.createMediaStreamDestination();
        const source = audioCtx.createBufferSource();
        source.buffer = decodedAudio;
        source.loop = decodedAudio.duration > 0 && decodedAudio.duration < settings.duration + 0.3;
        source.connect(dest);
        await audioCtx.resume();

        audioTrack = dest.stream.getAudioTracks()[0] ?? null;
        audioSource = source;
        exportAudioSourceRef.current = source;
      } catch {
        audioTrack = null;
        audioSource = null;
        exportAudioSourceRef.current = null;
      }
    }

    const TARGET_FPS = 30;
    const canvasStream = recordCanvas.captureStream(TARGET_FPS);
    const rawVideoTrack = canvasStream.getVideoTracks()[0] as
      | (MediaStreamTrack & { requestFrame?: () => void })
      | undefined;

    const pushFrame = () => {
      if (typeof rawVideoTrack?.requestFrame === 'function') {
        try {
          rawVideoTrack.requestFrame();
        } catch {
          // captureStream(30) নিজেই ফ্রেম ক্যাপচার করলে উপেক্ষা করুন
        }
      }
    };

    const streamTracks: MediaStreamTrack[] = [];
    if (rawVideoTrack) streamTracks.push(rawVideoTrack);
    if (audioTrack) streamTracks.push(audioTrack);

    const combinedStream = new MediaStream(streamTracks);
    exportStreamRef.current = combinedStream;

    const hasAudioTrack = Boolean(audioTrack);
    const mimeCandidates = getSupportedVideoMimeCandidates(hasAudioTrack);

    let recorder: MediaRecorder | null = null;
    let selectedMime: VideoMimeCandidate | null = null;

    for (const candidate of mimeCandidates) {
      try {
        const options: MediaRecorderOptions = {
          mimeType: candidate.mimeType,
          videoBitsPerSecond: videoBitrate,
          ...(hasAudioTrack ? { audioBitsPerSecond: 128_000 } : {}),
        };
        recorder = new MediaRecorder(combinedStream, options);
        selectedMime = candidate;
        break;
      } catch {
        // পরবর্তী সমর্থিত কোডেক চেষ্টা করুন
      }
    }

    if (!recorder || !selectedMime) {
      cleanupExportResources();
      setExportState('error');
      setExportStatusMessage('এই ফরম্যাটে ভিডিও রেকর্ডিং শুরু করা যায়নি।');
      return;
    }

    const activeRecorder = recorder;
    const activeMime = selectedMime;
    setExportExt(activeMime.ext);
    mediaRecorderRef.current = activeRecorder;

    const chunks: BlobPart[] = [];
    const totalMs = settings.duration * 1000;
    let recordedDurationMs = totalMs;

    activeRecorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) {
        chunks.push(ev.data);
      }
    };

    activeRecorder.onstop = async () => {
      cleanupExportResources();
      if (mediaRecorderRef.current === activeRecorder) {
        mediaRecorderRef.current = null;
      }

      if (exportCancelRef.current) {
        setExportState('idle');
        setExportProgress(0);
        setExportStatusMessage('');
        return;
      }

      const rawBlob = new Blob(chunks, { type: activeMime.mimeType });
      let finalBlob = rawBlob;

      if (activeMime.ext === 'webm') {
        setExportStatusMessage('ভিডিওর সময়কাল ও মেটাডেটা ঠিক করা হচ্ছে...');
        finalBlob = await fixWebmDuration(rawBlob, recordedDurationMs);
        if (exportCancelRef.current) {
          setExportState('idle');
          setExportProgress(0);
          setExportStatusMessage('');
          return;
        }
      }

      triggerReadyDownload(finalBlob, activeMime.ext);
    };

    activeRecorder.onerror = () => {
      cleanupExportResources();
      if (mediaRecorderRef.current === activeRecorder) {
        mediaRecorderRef.current = null;
      }
      setExportState('error');
      setExportStatusMessage('ভিডিও রেকর্ডিংয়ের সময় একটি ত্রুটি ঘটেছে।');
    };

    const startTime = performance.now();
    let lastReportedPercent = 0;

    activeRecorder.start(250);
    if (audioSource) {
      audioSource.start(0, 0, settings.duration + 0.25);
    }
    pushFrame();

    const renderTick = () => {
      if (exportCancelRef.current) {
        exportRafRef.current = null;
        if (activeRecorder.state !== 'inactive') {
          activeRecorder.stop();
        }
        return;
      }

      const now = performance.now();
      const elapsed = now - startTime;
      const p = Math.min(1, elapsed / totalMs);

      // প্রতিটি rAF টিক-এ অবিরাম ফ্রেম ড্র করে নির্ধারিত সময় শেষ হওয়া পর্যন্ত স্ট্রিম সচল রাখুন
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
      pushFrame();

      const nextPct = Math.min(99, Math.round(p * 100));
      if (nextPct !== lastReportedPercent) {
        lastReportedPercent = nextPct;
        setExportProgress(nextPct);
      }

      if (elapsed < totalMs) {
        exportRafRef.current = window.requestAnimationFrame(renderTick);
      } else {
        exportRafRef.current = null;
        setExportProgress(100);

        // শেষ ফ্রেম এবং অডিও স্ট্রিম কনটেইনারে ফ্লাশ হওয়ার জন্য ২০০ মি.সে. টেইল
        exportTimerRef.current = window.setTimeout(() => {
          if (exportCancelRef.current) {
            if (activeRecorder.state !== 'inactive') {
              activeRecorder.stop();
            }
            return;
          }
          pushFrame();
          recordedDurationMs = Math.max(
            totalMs,
            Math.min(totalMs + 400, Math.round(performance.now() - startTime))
          );
          if (activeRecorder.state !== 'inactive') {
            activeRecorder.stop();
          }
        }, 200);
      }
    };

    exportRafRef.current = window.requestAnimationFrame(renderTick);
  };

  const handleCancelExport = () => {
    exportCancelRef.current = true;
    if (exportRafRef.current !== null) {
      window.cancelAnimationFrame(exportRafRef.current);
      exportRafRef.current = null;
    }
    if (exportTimerRef.current !== null) {
      window.clearTimeout(exportTimerRef.current);
      exportTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      cleanupExportResources();
      setExportState('idle');
      setExportProgress(0);
      setExportStatusMessage('');
    }
  };

  const canShareVideoFile = useMemo(() => {
    if (
      !exportedVideoBlob ||
      typeof navigator === 'undefined' ||
      typeof navigator.share !== 'function' ||
      typeof navigator.canShare !== 'function'
    ) {
      return false;
    }
    try {
      const cleanMime = exportedExt === 'mp4' ? 'video/mp4' : 'video/webm';
      const probeFile = new File(
        [exportedVideoBlob],
        exportedFileName || `ilhamify-reel.${exportedExt}`,
        { type: cleanMime }
      );
      return navigator.canShare({ files: [probeFile] });
    } catch {
      return false;
    }
  }, [exportedVideoBlob, exportedExt, exportedFileName]);

  const handleShareVideo = async () => {
    if (!exportedVideoBlob || isSharing) return;
    setShareFeedback(null);

    if (
      typeof navigator === 'undefined' ||
      typeof navigator.share !== 'function' ||
      !canShareVideoFile
    ) {
      setShareFeedback({
        type: 'info',
        message:
          'আপনার বর্তমান ব্রাউজারে সরাসরি ফাইল শেয়ার সমর্থিত নয়। অনুগ্রহ করে "ফাইল সেভ করুন" থেকে ভিডিওটি সংরক্ষণ করে WhatsApp, Facebook বা Instagram-এ শেয়ার করুন।',
      });
      return;
    }

    const cleanMime = exportedExt === 'mp4' ? 'video/mp4' : 'video/webm';
    const fileName = exportedFileName || `ilhamify-reel-${settings.duration}s.${exportedExt}`;
    const videoFile = new File([exportedVideoBlob], fileName, { type: cleanMime });

    setIsSharing(true);
    try {
      try {
        await navigator.share({
          files: [videoFile],
          title: 'Ilhamify রিল ভিডিও',
        });
      } catch (innerErr) {
        if (innerErr instanceof Error && innerErr.name === 'AbortError') {
          return;
        }
        // কিছু মোবাইল ব্রাউজার title ছাড়া শুধু files গ্রহণ করে
        await navigator.share({ files: [videoFile] });
      }
      setShareFeedback({
        type: 'success',
        message: 'রিল ভিডিওটি সফলভাবে শেয়ার করা হয়েছে।',
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      setShareFeedback({
        type: 'error',
        message:
          'সরাসরি শেয়ার সম্পন্ন করা যায়নি। "ফাইল সেভ করুন" থেকে ভিডিওটি সেভ করে WhatsApp, Facebook বা Instagram-এ আপলোড করুন।',
      });
    } finally {
      setIsSharing(false);
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
        <div className="lg:col-span-6 lg:order-2 lg:sticky lg:top-24 space-y-4">
          <ScrollReveal delayMs={50}>
            <div className="bg-white dark:bg-[#142020] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-6 space-y-4 transition-colors duration-200">
            <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  ৯:১৬ রিল প্রিভিউ
                </span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  {toBanglaNumber(settings.duration)} সেকেন্ড ·{' '}
                  {settings.resolution === '1080p' ? '১০৮০পি' : '৭২০পি'}
                </span>
              </div>
              <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
                {formatBanglaSeconds(progress * settings.duration)} /{' '}
                {formatBanglaSeconds(settings.duration)}
              </span>
            </div>

            <div className="py-4 px-4 bg-slate-100/80 dark:bg-[#0A1111] rounded-xl flex justify-center overflow-hidden">
              <div ref={stageScope} className="w-full flex justify-center">
                <canvas
                  ref={previewCanvasRef}
                  className="w-full max-w-[280px] sm:max-w-[300px] aspect-[9/16] rounded-2xl shadow-lg border border-slate-300/70 dark:border-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPlaying((p) => !p)}
                aria-label={isPlaying ? 'প্রিভিউ থামান' : 'প্রিভিউ চালান'}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-slate-900 dark:bg-teal-700 text-white hover:bg-slate-800 dark:hover:bg-teal-600 transition-colors shrink-0"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={handleRestart}
                aria-label="শুরু থেকে চালান"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-white dark:bg-[#192828] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#213333] transition-colors shrink-0"
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
                className="flex-1 accent-teal-700 dark:accent-teal-400 cursor-pointer"
              />
            </div>

            {/* ভিডিও ডাউনলোড ও স্ট্যাটাস */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <AnimatePresence mode="wait" initial={false}>
                {exportState === 'recording' ? (
                  <motion.div
                    key="recording"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                    className="p-4 bg-slate-50 dark:bg-[#0E1717] border border-slate-200 dark:border-slate-700 rounded-xl space-y-3"
                  >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {exportStatusMessage}
                    </span>
                    <span className="tabular-nums font-semibold text-teal-700 dark:text-teal-300">
                      {toBanglaNumber(exportProgress)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-700 dark:bg-teal-400 transition-all duration-150"
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      ভিডিও তৈরি শেষ না হওয়া পর্যন্ত এই ট্যাবটি খোলা রাখুন
                    </span>
                    <button
                      type="button"
                      onClick={handleCancelExport}
                      className="min-h-[36px] px-3 py-1 text-xs font-medium text-rose-700 dark:text-rose-300 bg-white dark:bg-[#192828] border border-rose-200 dark:border-rose-800/70 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center gap-1"
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
                  className="space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {exportState === 'ready' ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                          <Check className="w-4 h-4 shrink-0" />
                          {exportStatusMessage}
                        </span>
                      ) : exportState === 'unsupported' || exportState === 'error' ? (
                        <span className="text-amber-700 dark:text-amber-300 font-medium">
                          {exportStatusMessage}
                        </span>
                      ) : (
                        <span>সরাসরি ব্রাউজার থেকেই ৯:১৬ রিল ভিডিও রেন্ডার ও ডাউনলোড হবে।</span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                      {exportState === 'ready' && exportedVideoBlob && (
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          type="button"
                          onClick={handleShareVideo}
                          disabled={isSharing}
                          className="flex-1 sm:flex-initial min-h-[46px] px-4 py-2.5 text-sm font-semibold text-teal-800 dark:text-teal-100 bg-teal-50 dark:bg-teal-900/50 border border-teal-300 dark:border-teal-700/70 rounded-xl hover:bg-teal-100 dark:hover:bg-teal-800/60 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                        >
                          <Share2 className="w-4 h-4" />
                          {isSharing ? 'শেয়ার হচ্ছে...' : 'শেয়ার করুন'}
                        </motion.button>
                      )}

                      {exportState === 'ready' && exportedVideoUrl && (
                        <a
                          href={exportedVideoUrl}
                          download={exportedFileName || `ilhamify-reel-${settings.duration}s.${exportedExt}`}
                          className="flex-1 sm:flex-initial min-h-[46px] px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#192828] border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-[#213333] transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                        >
                          <Download className="w-4 h-4" />
                          ফাইল সেভ করুন
                        </a>
                      )}

                      {exportState === 'unsupported' && (
                        <button
                          type="button"
                          onClick={handleDownloadFallbackFrame}
                          className="min-h-[46px] px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-[#1E2E2E] border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-[#273B3B] transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                        >
                          <Download className="w-4 h-4" />
                          ছবি ডাউনলোড করুন
                        </button>
                      )}

                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={handleExportVideo}
                        className="w-full sm:w-auto min-h-[46px] px-5 py-2.5 text-sm font-semibold text-white bg-teal-700 rounded-xl hover:bg-teal-800 dark:hover:bg-teal-500 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                      >
                        <Film className="w-4 h-4" />
                        ভিডিও ডাউনলোড করুন
                      </motion.button>
                    </div>
                  </div>

                  {shareFeedback && (
                    <p
                      role="status"
                      className={`text-xs leading-relaxed px-3 py-2 rounded-lg border ${
                        shareFeedback.type === 'success'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/70'
                          : shareFeedback.type === 'error'
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/70'
                            : 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 border-teal-200 dark:border-teal-800/70'
                      }`}
                    >
                      {shareFeedback.message}
                    </p>
                  )}
                </motion.div>
              )}
              </AnimatePresence>
            </div>
          </div>
          </ScrollReveal>
        </div>

        {/* বাম কন্ট্রোল কলাম */}
        <div className="lg:col-span-6 lg:order-1 space-y-5">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              রিল মেকার
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              হালকা মোশন, বাংলা ক্যাপশন এবং কাস্টম নাম ও লোগো দিয়ে ৯:১৬ শর্ট ভিডিও তৈরি করুন।
            </p>
          </div>

          {/* রিলের লেখা */}
          <ScrollReveal>
            <section className="bg-white dark:bg-[#142020] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3.5 transition-colors duration-200">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                রিলের ক্যাপশন
              </h2>
              <textarea
                rows={3}
                value={caption}
                onChange={(e) => onChangeCaption(e.target.value)}
                placeholder="রিল ভিডিওর জন্য বাংলা ক্যাপশন লিখুন..."
                className="w-full p-3 text-sm leading-relaxed text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-slate-50 dark:bg-[#0E1717] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:bg-white dark:focus:bg-[#121D1D] focus:border-teal-700 dark:focus:border-teal-400 resize-y"
              />
              <input
                type="text"
                value={attribution}
                onChange={(e) => onChangeAttribution(e.target.value)}
                placeholder="ঐচ্ছিক ছোট শিরোনাম বা সূত্র"
                className="w-full h-10 px-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-slate-50 dark:bg-[#0E1717] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:bg-white dark:focus:bg-[#121D1D] focus:border-teal-700 dark:focus:border-teal-400"
              />
            </section>
          </ScrollReveal>

          {/* মোশন ও সময়কাল */}
          <ScrollReveal delayMs={50}>
            <section className="bg-white dark:bg-[#142020] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 transition-colors duration-200">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-slate-500 dark:text-slate-400" />
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
                        : 'bg-white dark:bg-[#192828] text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="text-xs font-semibold">{m.label}</div>
                    <div
                      className={`text-[11px] mt-0.5 ${
                        active ? 'text-teal-100' : 'text-slate-500 dark:text-slate-400'
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
                <span className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
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
                          ? 'bg-slate-900 dark:bg-teal-700 text-white border-slate-900 dark:border-teal-700'
                          : 'bg-white dark:bg-[#192828] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#213333]'
                      }`}
                    >
                      {toBanglaNumber(dur)} সেকেন্ড
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  ভিডিওর মান
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, resolution: '720p' }))}
                    className={`min-h-[40px] rounded-lg border text-xs font-semibold tabular-nums transition-colors ${
                      settings.resolution === '720p'
                        ? 'bg-slate-900 dark:bg-teal-700 text-white border-slate-900 dark:border-teal-700'
                        : 'bg-white dark:bg-[#192828] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#213333]'
                    }`}
                  >
                    ৭২০পি এইচডি
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, resolution: '1080p' }))}
                    className={`min-h-[40px] rounded-lg border text-xs font-semibold tabular-nums transition-colors ${
                      settings.resolution === '1080p'
                        ? 'bg-slate-900 dark:bg-teal-700 text-white border-slate-900 dark:border-teal-700'
                        : 'bg-white dark:bg-[#192828] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#213333]'
                    }`}
                  >
                    ১০৮০পি ফুল এইচডি
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
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
                  settings.showParticles ? 'bg-teal-700' : 'bg-slate-300 dark:bg-slate-700'
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
          </ScrollReveal>

          {/* অডিও আপলোড ও প্রিভিউ */}
          <ScrollReveal delayMs={50}>
            <section className="bg-white dark:bg-[#142020] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3.5 transition-colors duration-200">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Music className="w-4 h-4 text-teal-700 dark:text-teal-300" />
                রিলের অডিও (ঐচ্ছিক)
              </h2>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                MP3, WAV, M4A, OGG · সর্বোচ্চ ১৫ মেগাবাইট
              </span>
            </div>

            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              onChange={handleAudioFileChange}
              className="hidden"
            />

            {audioFileUrl ? (
              <div className="p-3.5 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/70 rounded-xl space-y-3">
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
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-teal-700 text-white hover:bg-teal-800 dark:hover:bg-teal-500 transition-colors shrink-0"
                  >
                    {isAudioPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </motion.button>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {audioFileName}
                      </p>
                      <span className="text-[11px] tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
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
                        className="flex-1 min-w-0 accent-teal-700 dark:accent-teal-400 cursor-pointer"
                      />
                      <span className="text-[11px] tabular-nums text-slate-600 dark:text-slate-300 shrink-0">
                        {formatAudioTime(audioCurrentTime)} / {formatAudioTime(audioDuration)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-teal-200/70 dark:border-teal-800/60">
                  <span className="text-[11px] text-slate-600 dark:text-slate-300">
                    আপলোড করা অডিও কেবল এই ব্রাউজার সেশনে লোকালি প্রিভিউ হবে।
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => audioInputRef.current?.click()}
                      className="min-h-[36px] px-3 py-1.5 text-xs font-medium text-teal-800 dark:text-teal-100 bg-white dark:bg-[#192828] border border-teal-200 dark:border-teal-700/70 rounded-lg hover:bg-teal-100 dark:hover:bg-[#213333] transition-colors whitespace-nowrap"
                    >
                      পরিবর্তন করুন
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveAudio}
                      aria-label="অডিও মুছুন"
                      className="min-h-[36px] px-3 py-1.5 text-xs font-medium text-rose-700 dark:text-rose-300 bg-white dark:bg-[#192828] border border-rose-200 dark:border-rose-800/70 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors flex items-center gap-1 whitespace-nowrap"
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
                  className="w-full py-4 px-4 border border-dashed border-teal-300 dark:border-teal-700/80 rounded-xl bg-teal-50/70 dark:bg-teal-950/35 hover:bg-teal-100/70 dark:hover:bg-teal-900/45 hover:border-teal-700 dark:hover:border-teal-400 transition-colors flex flex-col sm:flex-row items-center justify-center gap-3 text-center sm:text-left"
                >
                  <span className="min-h-[40px] px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-teal-700 rounded-lg inline-flex items-center gap-2 shrink-0">
                    <Upload className="w-4 h-4" />
                    ডিভাইস থেকে অডিও যুক্ত করুন
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    MP3, WAV, M4A বা OGG ফাইল নির্বাচন করে রিলের সাথে শুনুন
                  </span>
                </motion.button>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  নোট: আপলোড করা অডিও কেবল আপনার ব্রাউজারেই লোকাল প্রিভিউর জন্য ব্যবহৃত হয় এবং সার্ভারে সংরক্ষণ করা হয় না।
                </p>
              </div>
            )}

            {audioError && (
              <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
                {audioError}
              </p>
            )}
          </section>
          </ScrollReveal>

          {/* ব্যাকগ্রাউন্ড ও গ্রেডিয়েন্ট */}
          <ScrollReveal delayMs={50}>
            <ThemeSelectorGrid
              selectedThemeId={settings.themeId}
              activeTheme={theme}
              onSelectTheme={(themeId) => setSettings((s) => ({ ...s, themeId }))}
            />
          </ScrollReveal>

          {/* বাংলা ফন্ট ও আকার */}
          <ScrollReveal delayMs={50}>
            <section className="bg-white dark:bg-[#142020] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 transition-colors duration-200">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Type className="w-4 h-4 text-slate-500 dark:text-slate-400" />
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
                        : 'bg-white dark:bg-[#192828] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
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
                  <span className="font-medium text-slate-700 dark:text-slate-300">ফন্টের আকার</span>
                  <span className="tabular-nums text-slate-500 dark:text-slate-400">
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
                  className="w-full accent-teal-700 dark:accent-teal-400 cursor-pointer"
                />
              </div>

              <div>
                <span className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  সাজানো
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, textAlign: 'center' }))}
                    className={`min-h-[38px] rounded-lg border flex items-center justify-center gap-1.5 text-xs font-medium transition-colors ${
                      settings.textAlign === 'center'
                        ? 'bg-slate-900 dark:bg-teal-700 text-white border-slate-900 dark:border-teal-700'
                        : 'bg-white dark:bg-[#192828] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
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
                        ? 'bg-slate-900 dark:bg-teal-700 text-white border-slate-900 dark:border-teal-700'
                        : 'bg-white dark:bg-[#192828] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                    বামে
                  </button>
                </div>
              </div>
            </div>
          </section>
          </ScrollReveal>

          {/* কাস্টম নাম ও লোগো */}
          <ScrollReveal delayMs={50}>
            <section className="bg-white dark:bg-[#142020] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 transition-colors duration-200">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Stamp className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                কাস্টম নাম ও লোগো
              </h2>
              <button
                type="button"
                onClick={onOpenBrandKit}
                className="text-xs font-semibold text-teal-700 dark:text-teal-300 hover:text-teal-800 dark:hover:text-teal-200 transition-colors whitespace-nowrap"
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
                    ? 'bg-teal-50 dark:bg-teal-900/50 text-teal-800 dark:text-teal-100 border-teal-200 dark:border-teal-700/60'
                    : 'bg-white dark:bg-[#192828] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {brandKit.showHandle ? 'নাম: চালু' : 'নাম: বন্ধ'}
              </button>

              <button
                type="button"
                onClick={() => onUpdateBrandKit({ showLogo: !brandKit.showLogo })}
                className={`min-h-[38px] px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  brandKit.showLogo && brandKit.logoDataUrl
                    ? 'bg-teal-50 dark:bg-teal-900/50 text-teal-800 dark:text-teal-100 border-teal-200 dark:border-teal-700/60'
                    : 'bg-white dark:bg-[#192828] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
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
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}
