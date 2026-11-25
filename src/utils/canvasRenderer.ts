import {
  BackgroundTheme,
  BrandKitState,
  CardSettings,
  ReelSettings,
  TypographyPreset,
  WatermarkPosition,
} from '../types/studio';

export interface RenderCardInput {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  caption: string;
  attribution: string;
  theme: BackgroundTheme;
  typography: TypographyPreset;
  settings: CardSettings;
  brandKit: BrandKitState;
  logoImage: HTMLImageElement | null;
}

export interface RenderReelFrameInput {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  caption: string;
  attribution: string;
  theme: BackgroundTheme;
  typography: TypographyPreset;
  settings: ReelSettings;
  brandKit: BrandKitState;
  logoImage: HTMLImageElement | null;
  progress: number; // 0 to 1
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  theme: BackgroundTheme
) {
  if (theme.kind === 'solid' || theme.colors.length === 1) {
    ctx.fillStyle = theme.colors[0];
    ctx.fillRect(0, 0, width, height);
  } else {
    const angleRad = ((theme.angle ?? 145) * Math.PI) / 180;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.hypot(width, height) / 2;
    const x0 = cx - Math.cos(angleRad) * radius;
    const y0 = cy - Math.sin(angleRad) * radius;
    const x1 = cx + Math.cos(angleRad) * radius;
    const y1 = cy + Math.sin(angleRad) * radius;

    const grad = ctx.createLinearGradient(x0, y0, x1, y1);
    const count = theme.colors.length;
    theme.colors.forEach((col, i) => {
      grad.addColorStop(i / Math.max(1, count - 1), col);
    });
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  // Subtle radial vignette for depth
  const vignette = ctx.createRadialGradient(
    width * 0.5,
    height * 0.45,
    width * 0.15,
    width * 0.5,
    height * 0.5,
    Math.max(width, height) * 0.85
  );
  vignette.addColorStop(0, 'rgba(255, 255, 255, 0.03)');
  vignette.addColorStop(1, theme.isDark ? 'rgba(0, 0, 0, 0.28)' : 'rgba(15, 23, 42, 0.04)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const paragraphs = text.split(/\r?\n/);
  const lines: string[] = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) {
      lines.push('');
      continue;
    }
    const words = trimmed.split(/\s+/);
    let current = '';

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth) {
        current = candidate;
      } else {
        if (current) {
          lines.push(current);
          current = word;
        } else {
          // Word longer than maxWidth: break cleanly by character
          let chunk = '';
          for (const ch of Array.from(word)) {
            if (ctx.measureText(chunk + ch).width <= maxWidth) {
              chunk += ch;
            } else {
              if (chunk) lines.push(chunk);
              chunk = ch;
            }
          }
          current = chunk;
        }
      }
    }
    if (current) {
      lines.push(current);
    }
  }

  return lines.length > 0 ? lines : [''];
}

function drawWatermarks(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  theme: BackgroundTheme,
  brandKit: BrandKitState,
  logoImage: HTMLImageElement | null,
  textColorOverride?: string | null
) {
  const scale = width / 1080;
  const marginX = 76 * scale;
  const marginY = 68 * scale;
  const activeColor = textColorOverride || theme.textColor;

  // Compute logo rectangle if rendered
  let logoRect: { x: number; y: number; w: number; h: number; pos: WatermarkPosition } | null =
    null;

  if (brandKit.showLogo && logoImage && logoImage.naturalWidth > 0) {
    const targetSize = brandKit.logoSize * scale;
    const aspect = logoImage.naturalWidth / logoImage.naturalHeight;
    let drawW = targetSize;
    let drawH = targetSize;
    if (aspect >= 1) {
      drawH = targetSize / aspect;
    } else {
      drawW = targetSize * aspect;
    }

    let x = marginX;
    let y = marginY;

    if (brandKit.logoPosition.endsWith('center')) {
      x = (width - drawW) / 2;
    } else if (brandKit.logoPosition.endsWith('right')) {
      x = width - marginX - drawW;
    }

    if (brandKit.logoPosition.startsWith('bottom')) {
      y = height - marginY - drawH;
    }

    ctx.save();
    ctx.globalAlpha = Math.max(0.1, Math.min(1, brandKit.logoOpacity));
    ctx.drawImage(logoImage, x, y, drawW, drawH);
    ctx.restore();

    logoRect = { x, y, w: drawW, h: drawH, pos: brandKit.logoPosition };
  }

  // Draw custom name/handle
  const cleanHandle = brandKit.handleText.trim();
  if (brandKit.showHandle && cleanHandle) {
    ctx.save();
    const handleFontSize = Math.round(28 * scale);
    ctx.font = `500 ${handleFontSize}px "Plus Jakarta Sans", "Hind Siliguri", sans-serif`;
    ctx.fillStyle = activeColor;
    ctx.globalAlpha = Math.max(0.15, Math.min(1, brandKit.handleOpacity));

    let x = marginX;
    let y = marginY + handleFontSize * 0.8;

    if (brandKit.handlePosition.endsWith('center')) {
      ctx.textAlign = 'center';
      x = width / 2;
    } else if (brandKit.handlePosition.endsWith('right')) {
      ctx.textAlign = 'right';
      x = width - marginX;
    } else {
      ctx.textAlign = 'left';
    }

    if (brandKit.handlePosition.startsWith('bottom')) {
      ctx.textBaseline = 'bottom';
      y = height - marginY;
    } else {
      ctx.textBaseline = 'top';
      y = marginY;
    }

    // Prevent overlap if logo and handle share the exact same slot
    if (logoRect && logoRect.pos === brandKit.handlePosition) {
      const gap = 16 * scale;
      if (brandKit.handlePosition.startsWith('bottom')) {
        y = logoRect.y - gap;
      } else {
        y = logoRect.y + logoRect.h + gap;
      }
    }

    ctx.fillText(cleanHandle, x, y);
    ctx.restore();
  }
}

export function renderQuoteCard({
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
}: RenderCardInput) {
  ctx.clearRect(0, 0, width, height);
  drawBackground(ctx, width, height, theme);

  const scale = width / 1080;
  const paddingX = 112 * scale;
  const maxTextWidth = width - paddingX * 2;
  const maxContentHeight = height * 0.62;
  const primaryTextColor = settings.customTextColor || theme.textColor;

  const displayCaption =
    caption.trim() || 'Write or select a caption to preview your quote card.';

  // Fit font size dynamically if caption is long
  let fontSize = settings.fontSize * scale;
  let lines: string[] = [];
  let lineHeight = fontSize * typography.lineHeightRatio;

  for (let attempt = 0; attempt < 18; attempt++) {
    ctx.font = `${typography.fontWeight} ${fontSize}px ${typography.fontFamily}`;
    lines = wrapLines(ctx, displayCaption, maxTextWidth);
    lineHeight = fontSize * typography.lineHeightRatio;
    const totalHeight = lines.length * lineHeight;
    if (totalHeight <= maxContentHeight || fontSize <= 24 * scale) {
      break;
    }
    fontSize *= 0.92;
  }

  const blockHeight = lines.length * lineHeight;
  const hasAttribution = attribution.trim().length > 0;
  const attrFontSize = Math.max(22 * scale, fontSize * 0.54);
  const dividerGap = settings.showDivider ? 36 * scale : 0;
  const attrHeight = hasAttribution ? attrFontSize * 1.6 + dividerGap : settings.showDivider ? 32 * scale : 0;

  const totalVerticalSpan = blockHeight + attrHeight;
  let startY = (height - totalVerticalSpan) / 2;

  // Subtle decorative quote mark above text
  if (settings.showQuoteMark) {
    ctx.save();
    const qSize = Math.round(92 * scale);
    ctx.font = `600 ${qSize}px "Cormorant Garamond", Georgia, serif`;
    ctx.fillStyle = theme.accentColor;
    ctx.globalAlpha = 0.42;
    ctx.textBaseline = 'alphabetic';
    if (settings.textAlign === 'center') {
      ctx.textAlign = 'center';
      ctx.fillText('“', width / 2, startY - 22 * scale);
    } else {
      ctx.textAlign = 'left';
      ctx.fillText('“', paddingX, startY - 22 * scale);
    }
    ctx.restore();
  }

  // Render caption lines
  ctx.save();
  ctx.font = `${typography.fontWeight} ${fontSize}px ${typography.fontFamily}`;
  ctx.fillStyle = primaryTextColor;
  ctx.textBaseline = 'top';
  ctx.textAlign = settings.textAlign === 'center' ? 'center' : 'left';
  const textX = settings.textAlign === 'center' ? width / 2 : paddingX;

  lines.forEach((line, idx) => {
    ctx.fillText(line, textX, startY + idx * lineHeight);
  });
  ctx.restore();

  let cursorY = startY + blockHeight;

  // Optional subtle hairline accent divider
  if (settings.showDivider) {
    cursorY += 28 * scale;
    const lineW = 84 * scale;
    const lineX = settings.textAlign === 'center' ? (width - lineW) / 2 : paddingX;
    ctx.save();
    ctx.fillStyle = theme.accentColor;
    ctx.globalAlpha = 0.72;
    ctx.fillRect(lineX, cursorY, lineW, Math.max(2, 3 * scale));
    ctx.restore();
    cursorY += 26 * scale;
  } else if (hasAttribution) {
    cursorY += 26 * scale;
  }

  // Attribution / subtitle
  if (hasAttribution) {
    ctx.save();
    ctx.font = `500 ${attrFontSize}px "Plus Jakarta Sans", "Hind Siliguri", sans-serif`;
    ctx.fillStyle = settings.customTextColor ? primaryTextColor : theme.mutedColor;
    ctx.globalAlpha = 0.9;
    ctx.textBaseline = 'top';
    ctx.textAlign = settings.textAlign === 'center' ? 'center' : 'left';
    ctx.fillText(attribution.trim(), textX, cursorY);
    ctx.restore();
  }

  // Render custom name/handle and PNG logo watermark
  drawWatermarks(
    ctx,
    width,
    height,
    theme,
    brandKit,
    logoImage,
    settings.customTextColor
  );
}

// Deterministic particle seed for consistent smooth reel loops
const PARTICLE_SEEDS = Array.from({ length: 18 }, (_, i) => ({
  x: ((i * 73 + 19) % 100) / 100,
  y: ((i * 41 + 37) % 100) / 100,
  r: 1.8 + (i % 4) * 1.1,
  speed: 0.4 + (i % 5) * 0.18,
  alpha: 0.14 + (i % 3) * 0.09,
}));

export function renderReelFrame({
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
  progress,
}: RenderReelFrameInput) {
  ctx.clearRect(0, 0, width, height);
  drawBackground(ctx, width, height, theme);

  const scale = width / 1080;
  const clampedP = Math.max(0, Math.min(1, progress));
  const wave = Math.sin(clampedP * Math.PI * 2);
  const cosWave = Math.cos(clampedP * Math.PI * 2);

  // Motion Layer 1: Atmospheric animated glow based on motionStyle
  ctx.save();
  if (settings.motionStyle === 'drift') {
    const gx = width * (0.5 + 0.24 * wave);
    const gy = height * (0.42 + 0.16 * cosWave);
    const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, width * 0.72);
    grad.addColorStop(0, theme.glowColor);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  } else if (settings.motionStyle === 'breathing') {
    const pulse = 0.58 + 0.2 * Math.sin(clampedP * Math.PI * 2);
    const grad = ctx.createRadialGradient(
      width * 0.5,
      height * 0.48,
      0,
      width * 0.5,
      height * 0.48,
      width * pulse
    );
    grad.addColorStop(0, theme.glowColor);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  } else if (settings.motionStyle === 'horizon') {
    const sweepPos = -0.3 + clampedP * 1.6;
    const sx = width * sweepPos;
    const sy = height * (0.25 + clampedP * 0.5);
    const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, width * 0.85);
    grad.addColorStop(0, theme.glowColor);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  } else {
    // kinetic subtle top & bottom ambient glow
    const grad = ctx.createRadialGradient(
      width * 0.5,
      height * 0.38,
      0,
      width * 0.5,
      height * 0.38,
      width * 0.75
    );
    grad.addColorStop(0, theme.glowColor);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.restore();

  // Motion Layer 2: Soft floating particles
  if (settings.showParticles) {
    ctx.save();
    ctx.fillStyle = theme.accentColor;
    for (const p of PARTICLE_SEEDS) {
      const py = ((p.y - clampedP * p.speed * 0.25 + 1) % 1) * height;
      const px = (p.x + Math.sin(clampedP * Math.PI * 2 + p.y * 6) * 0.025) * width;
      ctx.globalAlpha = p.alpha * (0.7 + 0.3 * Math.sin(clampedP * Math.PI * 4 + p.x * 10));
      ctx.beginPath();
      ctx.arc(px, py, p.r * scale * 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Caption layout & animation
  const paddingX = 110 * scale;
  const maxTextWidth = width - paddingX * 2;
  const maxContentHeight = height * 0.54;
  const displayCaption =
    caption.trim() || 'Write or select a caption to preview your vertical reel.';

  let fontSize = settings.fontSize * scale;
  let lines: string[] = [];
  let lineHeight = fontSize * typography.lineHeightRatio;

  for (let attempt = 0; attempt < 18; attempt++) {
    ctx.font = `${typography.fontWeight} ${fontSize}px ${typography.fontFamily}`;
    lines = wrapLines(ctx, displayCaption, maxTextWidth);
    lineHeight = fontSize * typography.lineHeightRatio;
    if (lines.length * lineHeight <= maxContentHeight || fontSize <= 26 * scale) {
      break;
    }
    fontSize *= 0.92;
  }

  const blockHeight = lines.length * lineHeight;
  const hasAttribution = attribution.trim().length > 0;
  const attrFontSize = Math.max(24 * scale, fontSize * 0.52);
  const totalVerticalSpan = blockHeight + (hasAttribution ? attrFontSize * 2.2 + 34 * scale : 24 * scale);

  // Subtle camera breath scale for 'breathing' style
  const textScale =
    settings.motionStyle === 'breathing'
      ? 1 + 0.018 * Math.sin(clampedP * Math.PI)
      : 1;

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.scale(textScale, textScale);
  ctx.translate(-width / 2, -height / 2);

  const startY = (height - totalVerticalSpan) / 2;
  const textX = settings.textAlign === 'center' ? width / 2 : paddingX;

  ctx.font = `${typography.fontWeight} ${fontSize}px ${typography.fontFamily}`;
  ctx.fillStyle = theme.textColor;
  ctx.textBaseline = 'top';
  ctx.textAlign = settings.textAlign === 'center' ? 'center' : 'left';

  lines.forEach((line, idx) => {
    let lineAlpha = 1;
    let offsetY = 0;

    if (settings.motionStyle === 'kinetic') {
      const staggerStart = idx * 0.05;
      const fadeSpan = 0.18;
      const t = Math.max(0, Math.min(1, (clampedP - staggerStart) / fadeSpan));
      const eased = 1 - Math.pow(1 - t, 3);
      lineAlpha = eased;
      offsetY = (1 - eased) * 26 * scale;
    } else {
      // Gentle intro fade over first 8% of reel
      const intro = Math.min(1, clampedP / 0.08);
      lineAlpha = intro;
      offsetY = (1 - intro) * 14 * scale;
    }

    ctx.save();
    ctx.globalAlpha = lineAlpha;
    ctx.fillText(line, textX, startY + idx * lineHeight + offsetY);
    ctx.restore();
  });

  // Subtle divider + attribution
  const attrAlpha =
    settings.motionStyle === 'kinetic'
      ? Math.max(0, Math.min(1, (clampedP - lines.length * 0.05) / 0.2))
      : Math.min(1, clampedP / 0.12);

  if (hasAttribution) {
    const divY = startY + blockHeight + 28 * scale;
    const divW = 72 * scale;
    const divX = settings.textAlign === 'center' ? (width - divW) / 2 : paddingX;

    ctx.save();
    ctx.globalAlpha = attrAlpha * 0.72;
    ctx.fillStyle = theme.accentColor;
    ctx.fillRect(divX, divY, divW, Math.max(2, 3 * scale));

    ctx.globalAlpha = attrAlpha * 0.9;
    ctx.font = `500 ${attrFontSize}px "Plus Jakarta Sans", "Hind Siliguri", sans-serif`;
    ctx.fillStyle = theme.mutedColor;
    ctx.textBaseline = 'top';
    ctx.textAlign = settings.textAlign === 'center' ? 'center' : 'left';
    ctx.fillText(attribution.trim(), textX, divY + 24 * scale);
    ctx.restore();
  }

  ctx.restore();

  // Bottom progress hair-line indicator inside reel? No, keep exported reel clean!
  // Render Brand Watermarks
  drawWatermarks(ctx, width, height, theme, brandKit, logoImage);
}
