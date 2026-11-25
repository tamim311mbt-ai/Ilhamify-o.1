import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  Check,
  Download,
  Film,
  Palette,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Stamp,
  Type,
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
import { renderReelFrame } from '../utils/canvasRenderer';

interface ReelMakerViewProps {
  caption: string;
  attribution: string;
  onChangeCaption: (text: string) => void;
  onChangeAttribution: (text: string) => void;
  brandKit: BrandKitState;
  onUpdateBrandKit: (patch: Partial<BrandKitState>) => void;
  onOpenBrandKit: () => void;
}

const MOTION_STYLES: { id: ReelMotionStyle; label: string; desc: string }[] = [
  { id: 'drift', label: 'Gentle Drift', desc: 'Slow ambient glow movement' },
  { id: 'breathing', label: 'Breathing Zoom', desc: 'Subtle rhythmic pulse' },
  { id: 'kinetic', label: 'Kinetic Fade', desc: 'Staggered line reveal' },
  { id: 'horizon', label: 'Calm Horizon', desc: 'Soft light sweep' },
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

function formatSeconds(sec: number): string {
  const whole = Math.max(0, Math.floor(sec));
  const m = Math.floor(whole / 60);
  const s = whole % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function ReelMakerView({
  caption,
  attribution,
  onChangeCaption,
  onChangeAttribution,
  brandKit,
  onUpdateBrandKit,
  onOpenBrandKit,
}: ReelMakerViewProps) {
  const [settings, setSettings] = useState<ReelSettings>({
    themeId: 'emerald-night',
    typographyId: 'editorial',
    motionStyle: 'kinetic',
    duration: 10,
    fontSize: 56,
    textAlign: 'center',
    showParticles: true,
    resolution: '720p',
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);

  // Export state
  const [exportState, setExportState] = useState<
    'idle' | 'recording' | 'ready' | 'unsupported' | 'error'
  >('idle');
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  const [exportedExt, setExportExt] = useState<'mp4' | 'webm'>('webm');
  const [exportStatusMessage, setExportStatusMessage] = useState<string>('');

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const exportCancelRef = useRef<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const logoImage = useLoadedImage(brandKit.logoDataUrl);

  const theme = useMemo(
    () => BACKGROUND_THEMES.find((t) => t.id === settings.themeId) ?? BACKGROUND_THEMES[0],
    [settings.themeId]
  );

  const typography = useMemo(
    () => TYPOGRAPHY_PRESETS.find((t) => t.id === settings.typographyId) ?? TYPOGRAPHY_PRESETS[0],
    [settings.typographyId]
  );

  // Clean up object URL on unmount or re-export
  useEffect(() => {
    return () => {
      if (exportedVideoUrl) {
        URL.revokeObjectURL(exportedVideoUrl);
      }
    };
  }, [exportedVideoUrl]);

  // Playback loop for preview canvas
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
    // Intentionally keeping progress out of dependency array while playing to avoid restarting rAF every frame
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, settings, caption, attribution, theme, typography, brandKit, logoImage]);

  // Redraw immediately when paused and user scrubs or changes controls
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
        'In-browser video recording is not supported in this browser. You can save a high-resolution 9:16 PNG frame instead.'
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
    setExportStatusMessage(`Rendering ${settings.duration}s vertical reel (${supported.ext.toUpperCase()})...`);

    const width = settings.resolution === '1080p' ? 1080 : 720;
    const height = settings.resolution === '1080p' ? 1920 : 1280;

    const recordCanvas = document.createElement('canvas');
    recordCanvas.width = width;
    recordCanvas.height = height;
    const ctx = recordCanvas.getContext('2d');
    if (!ctx) {
      setExportState('error');
      setExportStatusMessage('Could not initialize video canvas.');
      return;
    }

    // Draw initial frame before starting captureStream
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
      setExportStatusMessage('Could not start MediaRecorder with this video format.');
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
      setExportStatusMessage(`Ready to save (${supported.ext.toUpperCase()} · ${settings.resolution})`);

      // Trigger automatic download
      const a = document.createElement('a');
      a.href = url;
      a.download = `captioncraft-reel-${settings.duration}s-${Date.now()}.${supported.ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };

    recorder.onerror = () => {
      stream.getTracks().forEach((t) => t.stop());
      setExportState('error');
      setExportStatusMessage('Video recording encountered an unexpected error.');
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
      a.download = `captioncraft-reel-frame-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Right/Top Stage: 9:16 Vertical Reel Preview & Export */}
        <div className="lg:col-span-6 lg:order-2 lg:sticky lg:top-6 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-6 space-y-4">
            <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100">
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <span className="font-semibold text-slate-900">9:16 Reel Preview</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular">
                  {settings.duration}s · {settings.resolution}
                </span>
              </div>
              <span className="text-xs font-mono-tabular text-slate-500">
                {formatSeconds(progress * settings.duration)} / {formatSeconds(settings.duration)}
              </span>
            </div>

            {/* Vertical 9:16 Canvas Frame */}
            <div className="py-4 px-4 bg-slate-100/80 rounded-xl flex justify-center">
              <canvas
                ref={previewCanvasRef}
                className="w-full max-w-[280px] sm:max-w-[300px] aspect-[9/16] rounded-2xl shadow-lg border border-slate-300/70"
              />
            </div>

            {/* Playback Transport Bar */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPlaying((p) => !p)}
                aria-label={isPlaying ? 'Pause reel preview' : 'Play reel preview'}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors shrink-0"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={handleRestart}
                aria-label="Restart reel preview"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <input
                type="range"
                aria-label="Seek reel timeline"
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

            {/* Export Controls & Status */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              {exportState === 'recording' ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-900">{exportStatusMessage}</span>
                    <span className="font-mono-tabular font-semibold text-teal-700">
                      {exportProgress}%
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
                      Keep this tab active while frames encode in real time
                    </span>
                    <button
                      type="button"
                      onClick={handleCancelExport}
                      className="min-h-[36px] px-3 py-1 text-xs font-medium text-rose-700 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="text-xs text-slate-500">
                    {exportState === 'ready' ? (
                      <span className="text-emerald-700 font-medium flex items-center gap-1.5">
                        <Check className="w-4 h-4 shrink-0" />
                        {exportStatusMessage}
                      </span>
                    ) : exportState === 'unsupported' || exportState === 'error' ? (
                      <span className="text-amber-700 font-medium">{exportStatusMessage}</span>
                    ) : (
                      <span>
                        Exports directly in your browser using HTML5 Canvas video recording.
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {exportState === 'ready' && exportedVideoUrl && (
                      <a
                        href={exportedVideoUrl}
                        download={`captioncraft-reel-${settings.duration}s.${exportedExt}`}
                        className="min-h-[46px] px-4 py-2.5 text-sm font-semibold text-teal-800 bg-teal-50 border border-teal-200 rounded-xl hover:bg-teal-100 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                      >
                        <Download className="w-4 h-4" />
                        Save .{exportedExt.toUpperCase()}
                      </a>
                    )}

                    {exportState === 'unsupported' && (
                      <button
                        type="button"
                        onClick={handleDownloadFallbackFrame}
                        className="min-h-[46px] px-4 py-2.5 text-sm font-semibold text-slate-900 bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                      >
                        <Download className="w-4 h-4" />
                        Save 9:16 PNG
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleExportVideo}
                      className="min-h-[46px] px-5 py-2.5 text-sm font-semibold text-white bg-teal-700 rounded-xl hover:bg-teal-800 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <Film className="w-4 h-4" />
                      Export Video
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Left Controls Column */}
        <div className="lg:col-span-6 lg:order-1 space-y-5">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reel Maker</h1>
            <p className="text-sm text-slate-600">
              Build vertical 9:16 animated caption reels with subtle motion, custom handle, and PNG logo.
            </p>
          </div>

          {/* Caption Content */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3.5">
            <h2 className="text-sm font-semibold text-slate-900">Reel Caption</h2>
            <textarea
              rows={3}
              value={caption}
              onChange={(e) => onChangeCaption(e.target.value)}
              placeholder="Enter caption for your vertical reel..."
              className="w-full p-3 text-sm leading-relaxed text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-teal-700 resize-y"
            />
            <input
              type="text"
              value={attribution}
              onChange={(e) => onChangeAttribution(e.target.value)}
              placeholder="Optional subtitle or source"
              className="w-full h-10 px-3 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-teal-700"
            />
          </section>

          {/* Motion Style & Duration */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-slate-500" />
              Motion & Duration
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
                  Reel Duration
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
                      className={`min-h-[40px] rounded-lg border text-xs font-semibold font-mono-tabular transition-colors ${
                        settings.duration === dur
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {dur}s
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-xs font-medium text-slate-700 mb-1.5">
                  Export Resolution
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, resolution: '720p' }))}
                    className={`min-h-[40px] rounded-lg border text-xs font-semibold font-mono-tabular transition-colors ${
                      settings.resolution === '720p'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    720p HD
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, resolution: '1080p' }))}
                    className={`min-h-[40px] rounded-lg border text-xs font-semibold font-mono-tabular transition-colors ${
                      settings.resolution === '1080p'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    1080p FHD
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-medium text-slate-700">
                Subtle floating light particles
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={settings.showParticles}
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

          {/* Background Palette */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Palette className="w-4 h-4 text-slate-500" />
                Background Theme
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

          {/* Typography & Watermark */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Type className="w-4 h-4 text-slate-500" />
              Typography
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
                  <span className="font-medium text-slate-700">Text Size</span>
                  <span className="font-mono-tabular text-slate-500">{settings.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min={38}
                  max={78}
                  step={2}
                  value={settings.fontSize}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, fontSize: parseInt(e.target.value, 10) }))
                  }
                  className="w-full accent-teal-700 cursor-pointer"
                />
              </div>

              <div>
                <span className="block text-xs font-medium text-slate-700 mb-1.5">Alignment</span>
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
                    Center
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
                    Left
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Brand Watermark Summary */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Stamp className="w-4 h-4 text-slate-500" />
                Name & PNG Logo Watermark
              </h2>
              <button
                type="button"
                onClick={onOpenBrandKit}
                className="text-xs font-semibold text-teal-700 hover:text-teal-800 transition-colors whitespace-nowrap"
              >
                Configure
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
                {brandKit.showHandle ? 'Handle: On' : 'Handle: Off'}
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
                    ? 'PNG Logo: On'
                    : 'PNG Logo: Off'
                  : 'No PNG Logo'}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
