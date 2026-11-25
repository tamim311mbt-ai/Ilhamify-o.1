import React, { useRef, useState } from 'react';
import { Trash2, Upload, X } from 'lucide-react';
import { BrandKitState, WatermarkPosition } from '../types/studio';

interface BrandKitDrawerProps {
  open: boolean;
  onClose: () => void;
  brandKit: BrandKitState;
  onUpdate: (patch: Partial<BrandKitState>) => void;
  onReset: () => void;
}

const POSITION_OPTIONS: { id: WatermarkPosition; label: string }[] = [
  { id: 'top-left', label: 'Top Left' },
  { id: 'top-center', label: 'Top Center' },
  { id: 'top-right', label: 'Top Right' },
  { id: 'bottom-left', label: 'Bottom Left' },
  { id: 'bottom-center', label: 'Bottom Center' },
  { id: 'bottom-right', label: 'Bottom Right' },
];

export function BrandKitDrawer({
  open,
  onClose,
  brandKit,
  onUpdate,
  onReset,
}: BrandKitDrawerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid PNG, WebP, or SVG image file.');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setUploadError('Logo file is too large. Please choose an image under 4 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUpdate({ logoDataUrl: reader.result, showLogo: true });
      }
    };
    reader.onerror = () => {
      setUploadError('Could not read the selected image file.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-end bg-slate-950/45 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="brand-kit-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full md:w-[440px] max-h-[90vh] md:h-full md:max-h-none bg-white rounded-t-3xl md:rounded-none border-t md:border-l border-slate-200 flex flex-col overflow-hidden">
        {/* Mobile grab handle */}
        <div className="md:hidden pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1.5 bg-slate-200 rounded-full" />
        </div>

        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <h2 id="brand-kit-title" className="text-lg font-semibold text-slate-900">
              Name & PNG Logo Watermark
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Synced automatically across Card Studio and Reel Maker
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close watermark settings"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Custom Name / Handle Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Custom Name or Handle</h3>
                <p className="text-xs text-slate-500">Shown cleanly on cards and reels</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={brandKit.showHandle}
                onClick={() => onUpdate({ showHandle: !brandKit.showHandle })}
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
                  brandKit.showHandle ? 'bg-teal-700' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    brandKit.showHandle ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div>
              <label
                htmlFor="brand-handle-input"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Display Text
              </label>
              <input
                id="brand-handle-input"
                type="text"
                value={brandKit.handleText}
                onChange={(e) => onUpdate({ handleText: e.target.value })}
                placeholder="@yourname or Your Brand"
                maxLength={48}
                className="w-full h-11 px-3.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Position
              </label>
              <div className="grid grid-cols-3 gap-2">
                {POSITION_OPTIONS.map((pos) => (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() => onUpdate({ handlePosition: pos.id })}
                    className={`min-h-[40px] px-2.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                      brandKit.handlePosition === pos.id
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-700">Text Opacity</span>
                <span className="font-mono-tabular text-slate-500">
                  {Math.round(brandKit.handleOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.2}
                max={1}
                step={0.05}
                value={brandKit.handleOpacity}
                onChange={(e) => onUpdate({ handleOpacity: parseFloat(e.target.value) })}
                className="w-full accent-teal-700 cursor-pointer"
              />
            </div>
          </section>

          <hr className="border-slate-200" />

          {/* PNG Logo Watermark Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">PNG Logo Watermark</h3>
                <p className="text-xs text-slate-500">Supports transparent PNG backgrounds</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={brandKit.showLogo}
                onClick={() => onUpdate({ showLogo: !brandKit.showLogo })}
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
                  brandKit.showLogo ? 'bg-teal-700' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    brandKit.showLogo ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/webp,image/svg+xml,image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {brandKit.logoDataUrl ? (
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-14 h-14 rounded-lg border border-slate-200 flex items-center justify-center p-1.5 shrink-0"
                    style={{
                      backgroundImage:
                        'linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)',
                      backgroundSize: '12px 12px',
                      backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <img
                      src={brandKit.logoDataUrl}
                      alt="Uploaded brand logo preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">Logo ready</p>
                    <p className="text-xs text-slate-500">Transparent PNG supported</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 min-h-[40px] text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdate({ logoDataUrl: null })}
                    aria-label="Remove logo"
                    className="min-w-[40px] min-h-[40px] flex items-center justify-center text-rose-600 bg-white border border-slate-200 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-6 px-4 border border-dashed border-slate-300 rounded-xl bg-slate-50/70 hover:bg-slate-100/70 hover:border-teal-600 transition-colors flex flex-col items-center justify-center gap-2 text-center"
              >
                <Upload className="w-5 h-5 text-teal-700" />
                <span className="text-sm font-medium text-slate-900">Upload PNG Logo</span>
                <span className="text-xs text-slate-500">
                  Transparent PNG recommended · Max 4 MB
                </span>
              </button>
            )}

            {uploadError && (
              <p className="text-xs text-rose-600 font-medium">{uploadError}</p>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Logo Position
              </label>
              <div className="grid grid-cols-3 gap-2">
                {POSITION_OPTIONS.map((pos) => (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() => onUpdate({ logoPosition: pos.id })}
                    className={`min-h-[40px] px-2.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                      brandKit.logoPosition === pos.id
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-700">Logo Size</span>
                  <span className="font-mono-tabular text-slate-500">{brandKit.logoSize}px</span>
                </div>
                <input
                  type="range"
                  min={44}
                  max={180}
                  step={4}
                  value={brandKit.logoSize}
                  onChange={(e) => onUpdate({ logoSize: parseInt(e.target.value, 10) })}
                  className="w-full accent-teal-700 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-700">Opacity</span>
                  <span className="font-mono-tabular text-slate-500">
                    {Math.round(brandKit.logoOpacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.2}
                  max={1}
                  step={0.05}
                  value={brandKit.logoOpacity}
                  onChange={(e) => onUpdate({ logoOpacity: parseFloat(e.target.value) })}
                  className="w-full accent-teal-700 cursor-pointer"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onReset}
            className="px-3.5 py-2 min-h-[44px] text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 min-h-[44px] text-sm font-medium text-white bg-teal-700 rounded-lg hover:bg-teal-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
