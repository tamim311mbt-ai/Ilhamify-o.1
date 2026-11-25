import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  Check,
  Clapperboard,
  Download,
  Palette,
  Stamp,
  Type,
} from 'lucide-react';
import { ASPECT_RATIOS, BACKGROUND_THEMES, TYPOGRAPHY_PRESETS } from '../data/themes';
import { useLoadedImage } from '../hooks/useLoadedImage';
import { BrandKitState, CardSettings } from '../types/studio';
import { renderQuoteCard } from '../utils/canvasRenderer';

interface CardStudioViewProps {
  caption: string;
  attribution: string;
  onChangeCaption: (text: string) => void;
  onChangeAttribution: (text: string) => void;
  brandKit: BrandKitState;
  onUpdateBrandKit: (patch: Partial<BrandKitState>) => void;
  onOpenBrandKit: () => void;
  onSendToReel: () => void;
}

export function CardStudioView({
  caption,
  attribution,
  onChangeCaption,
  onChangeAttribution,
  brandKit,
  onUpdateBrandKit,
  onOpenBrandKit,
  onSendToReel,
}: CardStudioViewProps) {
  const [settings, setSettings] = useState<CardSettings>({
    aspectRatio: '1:1',
    themeId: 'emerald-night',
    typographyId: 'editorial',
    fontSize: 54,
    textAlign: 'center',
    showQuoteMark: true,
    showDivider: true,
    customTextColor: null,
  });

  const [downloaded, setDownloaded] = useState(false);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const logoImage = useLoadedImage(brandKit.logoDataUrl);

  const aspectSpec = useMemo(
    () => ASPECT_RATIOS.find((a) => a.id === settings.aspectRatio) ?? ASPECT_RATIOS[0],
    [settings.aspectRatio]
  );

  const theme = useMemo(
    () => BACKGROUND_THEMES.find((t) => t.id === settings.themeId) ?? BACKGROUND_THEMES[0],
    [settings.themeId]
  );

  const typography = useMemo(
    () => TYPOGRAPHY_PRESETS.find((t) => t.id === settings.typographyId) ?? TYPOGRAPHY_PRESETS[0],
    [settings.typographyId]
  );

  // Render crisp preview onto the live Canvas
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Render at full export resolution so font wrapping matches downloaded PNG 1:1
    canvas.width = aspectSpec.width;
    canvas.height = aspectSpec.height;

    const draw = () => {
      renderQuoteCard({
        ctx,
        width: aspectSpec.width,
        height: aspectSpec.height,
        caption,
        attribution,
        theme,
        typography,
        settings,
        brandKit,
        logoImage,
      });
    };

    draw();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(draw);
    }
  }, [aspectSpec, caption, attribution, theme, typography, settings, brandKit, logoImage]);

  const handleDownloadPng = () => {
    const offscreen = document.createElement('canvas');
    offscreen.width = aspectSpec.width;
    offscreen.height = aspectSpec.height;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    renderQuoteCard({
      ctx,
      width: aspectSpec.width,
      height: aspectSpec.height,
      caption,
      attribution,
      theme,
      typography,
      settings,
      brandKit,
      logoImage,
    });

    offscreen.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `captioncraft-card-${aspectSpec.id.replace(':', 'x')}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2200);
    }, 'image/png');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Preview Stage (First on mobile for instant visual feedback, right on desktop) */}
        <div className="lg:col-span-7 lg:order-2 lg:sticky lg:top-6 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-6">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <span className="font-semibold text-slate-900">Card Preview</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular">{aspectSpec.sublabel} px</span>
              </div>
              <button
                type="button"
                onClick={onSendToReel}
                className="min-h-[38px] px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <Clapperboard className="w-3.5 h-3.5" />
                Animate as Reel
              </button>
            </div>

            {/* Canvas Stage */}
            <div className="py-5 flex items-center justify-center bg-slate-100/80 rounded-xl mt-4 px-4">
              <canvas
                ref={previewCanvasRef}
                className="max-w-full w-auto h-auto max-h-[540px] rounded-xl shadow-md border border-slate-200/80"
                style={{
                  aspectRatio: `${aspectSpec.width} / ${aspectSpec.height}`,
                }}
              />
            </div>

            {/* Primary Download CTA */}
            <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Exports as a high-resolution PNG with crisp typography and transparent logo watermark.
              </p>
              <button
                type="button"
                onClick={handleDownloadPng}
                className="min-h-[46px] px-6 py-2.5 text-sm font-semibold text-white bg-teal-700 rounded-xl hover:bg-teal-800 transition-colors flex items-center justify-center gap-2 shrink-0 whitespace-nowrap"
              >
                {downloaded ? (
                  <>
                    <Check className="w-4 h-4" />
                    PNG Saved
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download PNG
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Left Controls Column */}
        <div className="lg:col-span-5 lg:order-1 space-y-5">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Card Studio</h1>
            <p className="text-sm text-slate-600">
              Customize aspect ratio, color gradient, typography, and your personal watermark.
            </p>
          </div>

          {/* Text Content */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3.5">
            <h2 className="text-sm font-semibold text-slate-900">Caption Text</h2>
            <textarea
              rows={3}
              value={caption}
              onChange={(e) => onChangeCaption(e.target.value)}
              placeholder="Enter caption text..."
              className="w-full p-3 text-sm leading-relaxed text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-teal-700 resize-y"
            />
            <input
              type="text"
              value={attribution}
              onChange={(e) => onChangeAttribution(e.target.value)}
              placeholder="Optional subtitle or reference"
              className="w-full h-10 px-3 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-teal-700"
            />
          </section>

          {/* Aspect Ratio */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">Aspect Ratio</h2>
            <div className="grid grid-cols-3 gap-2">
              {ASPECT_RATIOS.map((ratio) => {
                const active = settings.aspectRatio === ratio.id;
                return (
                  <button
                    key={ratio.id}
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, aspectRatio: ratio.id }))}
                    className={`min-h-[52px] px-3 py-2 rounded-xl border text-left transition-colors ${
                      active
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-semibold whitespace-nowrap">{ratio.label}</div>
                    <div
                      className={`text-[11px] font-mono-tabular mt-0.5 ${
                        active ? 'text-teal-100' : 'text-slate-500'
                      }`}
                    >
                      {ratio.sublabel}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Background Palette */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Palette className="w-4 h-4 text-slate-500" />
                Background & Gradient
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
                    onClick={() =>
                      setSettings((s) => ({ ...s, themeId: t.id, customTextColor: null }))
                    }
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

          {/* Typography & Layout */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Type className="w-4 h-4 text-slate-500" />
              Typography & Style
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
                  min={36}
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

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSettings((s) => ({ ...s, showQuoteMark: !s.showQuoteMark }))}
                className={`min-h-[38px] px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  settings.showQuoteMark
                    ? 'bg-teal-50 text-teal-800 border-teal-200'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                Quote Mark
              </button>
              <button
                type="button"
                onClick={() => setSettings((s) => ({ ...s, showDivider: !s.showDivider }))}
                className={`min-h-[38px] px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  settings.showDivider
                    ? 'bg-teal-50 text-teal-800 border-teal-200'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                Accent Line
              </button>
            </div>
          </section>

          {/* Watermark & PNG Logo Quick Summary */}
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
