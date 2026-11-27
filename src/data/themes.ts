import {
  AspectRatioSpec,
  BackgroundTheme,
  IslamicSubTopic,
  MotivationalSubTopic,
  TypographyPreset,
} from '../types/studio';

export const ASPECT_RATIOS: AspectRatioSpec[] = [
  { id: '1:1', label: '১:১ স্কয়ার', sublabel: '১০৮০ × ১০৮০', width: 1080, height: 1080 },
  { id: '4:5', label: '৪:৫ পোর্ট্রেট', sublabel: '১০৮০ × ১৩৫০', width: 1080, height: 1350 },
  { id: '9:16', label: '৯:১৬ স্টোরি', sublabel: '১০৮০ × ১৯২০', width: 1080, height: 1920 },
];

export const TYPOGRAPHY_PRESETS: TypographyPreset[] = [
  {
    id: 'serif',
    name: 'সাহিত্যিক সেরিফ',
    fontFamily: '"Noto Serif Bengali", "Tiro Bangla", serif',
    fontWeight: 600,
    lineHeightRatio: 1.48,
  },
  {
    id: 'hind',
    name: 'আধুনিক হিন্ড স্যান্স',
    fontFamily: '"Hind Siliguri", "Noto Sans Bengali", sans-serif',
    fontWeight: 600,
    lineHeightRatio: 1.45,
  },
  {
    id: 'baloo',
    name: 'বোল্ড ডিসপ্লে',
    fontFamily: '"Baloo Da 2", "Hind Siliguri", sans-serif',
    fontWeight: 600,
    lineHeightRatio: 1.42,
  },
  {
    id: 'anek',
    name: 'মসৃণ মিনিমাল',
    fontFamily: '"Anek Bangla", "Noto Sans Bengali", sans-serif',
    fontWeight: 500,
    lineHeightRatio: 1.48,
  },
];

export function getThemeBackgroundCss(theme: BackgroundTheme): string {
  const layers: string[] = [];

  if (theme.ambientHighlight) {
    const xPct = Math.round(theme.ambientHighlight.x * 100);
    const yPct = Math.round(theme.ambientHighlight.y * 100);
    layers.push(
      `radial-gradient(circle at ${xPct}% ${yPct}%, ${theme.ambientHighlight.color} 0%, transparent 65%)`
    );
  }

  if (theme.kind === 'solid' || theme.colors.length === 1) {
    if (layers.length === 0) {
      return theme.colors[0];
    }
    layers.push(`linear-gradient(180deg, ${theme.colors[0]}, ${theme.colors[0]})`);
    return layers.join(', ');
  }

  const colorStops = theme.colors
    .map((col, idx) => {
      const stop =
        theme.stops && theme.stops[idx] !== undefined
          ? Math.round(theme.stops[idx] * 100)
          : Math.round((idx / Math.max(1, theme.colors.length - 1)) * 100);
      return `${col} ${stop}%`;
    })
    .join(', ');

  if (theme.kind === 'radial') {
    const cx = Math.round((theme.ambientHighlight?.x ?? 0.35) * 100);
    const cy = Math.round((theme.ambientHighlight?.y ?? 0.3) * 100);
    layers.push(`radial-gradient(circle at ${cx}% ${cy}%, ${colorStops})`);
  } else {
    layers.push(`linear-gradient(${theme.angle ?? 145}deg, ${colorStops})`);
  }

  return layers.join(', ');
}

export const BACKGROUND_THEMES: BackgroundTheme[] = [
  {
    id: 'emerald-night',
    name: 'গভীর পান্না রাত',
    kind: 'gradient',
    colors: ['#042f2e', '#0f3d3e', '#021717'],
    angle: 145,
    textColor: '#f8fafc',
    mutedColor: '#99f6e4',
    accentColor: '#2dd4bf',
    glowColor: 'rgba(45, 212, 191, 0.22)',
    isDark: true,
  },
  {
    id: 'royal-emerald-teal',
    name: 'রয়্যাল পান্না ও টিল',
    kind: 'gradient',
    colors: ['#061a1b', '#103536', '#264d4d', '#0c2728', '#041213'],
    stops: [0, 0.28, 0.56, 0.82, 1],
    angle: 140,
    ambientHighlight: {
      color: 'rgba(94, 234, 212, 0.20)',
      x: 0.28,
      y: 0.24,
      radius: 0.78,
    },
    textColor: '#f8fafc',
    mutedColor: '#bfe3e3',
    accentColor: '#5eead4',
    glowColor: 'rgba(78, 114, 114, 0.34)',
    isDark: true,
    isPremium: true,
  },
  {
    id: 'golden-night',
    name: 'স্বর্ণালী রাত',
    kind: 'gradient',
    colors: ['#090807', '#17130d', '#241c10', '#120f0b', '#070605'],
    stops: [0, 0.3, 0.55, 0.8, 1],
    angle: 150,
    ambientHighlight: {
      color: 'rgba(218, 165, 32, 0.22)',
      x: 0.74,
      y: 0.22,
      radius: 0.75,
    },
    textColor: '#fbf9f5',
    mutedColor: '#ead49b',
    accentColor: '#eab308',
    glowColor: 'rgba(212, 175, 55, 0.24)',
    isDark: true,
    isPremium: true,
  },
  {
    id: 'midnight-indigo-glow',
    name: 'নিশীথ নীল আলো',
    kind: 'radial',
    colors: ['#18275c', '#0d173d', '#070d24', '#030612'],
    stops: [0, 0.36, 0.72, 1],
    ambientHighlight: {
      color: 'rgba(99, 102, 241, 0.20)',
      x: 0.35,
      y: 0.26,
      radius: 0.8,
    },
    textColor: '#f8fafc',
    mutedColor: '#c7d2fe',
    accentColor: '#818cf8',
    glowColor: 'rgba(99, 102, 241, 0.26)',
    isDark: true,
    isPremium: true,
  },
  {
    id: 'royal-plum-shadow',
    name: 'রাজকীয় বেগুনি ছায়া',
    kind: 'gradient',
    colors: ['#12081e', '#28123f', '#1c1836', '#0e1320', '#090710'],
    stops: [0, 0.32, 0.6, 0.85, 1],
    angle: 145,
    ambientHighlight: {
      color: 'rgba(192, 132, 252, 0.18)',
      x: 0.7,
      y: 0.25,
      radius: 0.76,
    },
    textColor: '#faf7ff',
    mutedColor: '#e2d4fb',
    accentColor: '#d8b4fe',
    glowColor: 'rgba(168, 85, 247, 0.24)',
    isDark: true,
    isPremium: true,
  },
  {
    id: 'aurora-glow',
    name: 'অরোরার আভা',
    kind: 'gradient',
    colors: ['#03181e', '#0a3a3a', '#0f524c', '#134e5e', '#041a22'],
    stops: [0, 0.25, 0.52, 0.78, 1],
    angle: 135,
    ambientHighlight: {
      color: 'rgba(45, 212, 191, 0.22)',
      x: 0.3,
      y: 0.2,
      radius: 0.82,
    },
    textColor: '#f0fdfa',
    mutedColor: '#a7f3d0',
    accentColor: '#2dd4bf',
    glowColor: 'rgba(45, 212, 191, 0.26)',
    isDark: true,
    isPremium: true,
  },
  {
    id: 'teal-velvet-signature',
    name: 'ইলহাম টিল ভেলভেট',
    kind: 'gradient',
    colors: ['#132020', '#233a3a', '#395757', '#264040', '#111d1d'],
    stops: [0, 0.28, 0.54, 0.78, 1],
    angle: 145,
    ambientHighlight: {
      color: 'rgba(130, 178, 178, 0.20)',
      x: 0.5,
      y: 0.28,
      radius: 0.78,
    },
    textColor: '#ffffff',
    mutedColor: '#cce0e0',
    accentColor: '#7bc4c4',
    glowColor: 'rgba(78, 114, 114, 0.34)',
    isDark: true,
    isPremium: true,
  },
  {
    id: 'golden-dawn',
    name: 'সোনালি ভোর',
    kind: 'gradient',
    colors: ['#fffaf1', '#fef1d6', '#fde3c3', '#fff4e0'],
    stops: [0, 0.35, 0.7, 1],
    angle: 140,
    ambientHighlight: {
      color: 'rgba(245, 158, 11, 0.14)',
      x: 0.75,
      y: 0.2,
      radius: 0.75,
    },
    textColor: '#23170e',
    mutedColor: '#6b4222',
    accentColor: '#b45309',
    glowColor: 'rgba(217, 119, 6, 0.15)',
    isDark: false,
    isPremium: true,
  },
  {
    id: 'mystic-rose-cream',
    name: 'মিস্টিক রোজ ও ক্রিম',
    kind: 'gradient',
    colors: ['#fff8f9', '#fbeaf0', '#f3e7f7', '#fcf7f4'],
    stops: [0, 0.34, 0.68, 1],
    angle: 135,
    ambientHighlight: {
      color: 'rgba(219, 39, 119, 0.08)',
      x: 0.26,
      y: 0.24,
      radius: 0.72,
    },
    textColor: '#2c1522',
    mutedColor: '#6d3550',
    accentColor: '#9d174d',
    glowColor: 'rgba(190, 24, 93, 0.12)',
    isDark: false,
    isPremium: true,
  },
  {
    id: 'silver-moonlight',
    name: 'সিলভার মুনলাইট',
    kind: 'gradient',
    colors: ['#f8fafc', '#ebf0f6', '#dde5ef', '#f3f6fa'],
    stops: [0, 0.35, 0.68, 1],
    angle: 145,
    ambientHighlight: {
      color: 'rgba(78, 114, 114, 0.10)',
      x: 0.72,
      y: 0.24,
      radius: 0.74,
    },
    textColor: '#0f172a',
    mutedColor: '#334155',
    accentColor: '#385454',
    glowColor: 'rgba(71, 85, 105, 0.14)',
    isDark: false,
    isPremium: true,
  },
  {
    id: 'ivory-sand-luxury',
    name: 'মুক্তা ও বালুকাবেলা',
    kind: 'gradient',
    colors: ['#fcfaf6', '#f4ede1', '#ebe0cf', '#f9f6f0'],
    stops: [0, 0.35, 0.68, 1],
    angle: 145,
    ambientHighlight: {
      color: 'rgba(180, 134, 72, 0.12)',
      x: 0.3,
      y: 0.22,
      radius: 0.72,
    },
    textColor: '#1f1812',
    mutedColor: '#5c4938',
    accentColor: '#4E7272',
    glowColor: 'rgba(161, 121, 70, 0.14)',
    isDark: false,
    isPremium: true,
  },
  {
    id: 'ivory-parchment',
    name: 'স্নিগ্ধ আইভরি',
    kind: 'solid',
    colors: ['#f8f6f1'],
    textColor: '#1c1917',
    mutedColor: '#57534e',
    accentColor: '#0f766e',
    glowColor: 'rgba(15, 118, 110, 0.12)',
    isDark: false,
  },
  {
    id: 'obsidian-gold',
    name: 'কালো ও সোনালি',
    kind: 'gradient',
    colors: ['#09090b', '#18181b', '#272014'],
    angle: 160,
    textColor: '#fafaf9',
    mutedColor: '#e7d5a8',
    accentColor: '#d4af37',
    glowColor: 'rgba(212, 175, 55, 0.20)',
    isDark: true,
  },
  {
    id: 'slate-mist',
    name: 'নীলচে স্লেট',
    kind: 'gradient',
    colors: ['#0f172a', '#1e293b', '#0f172a'],
    angle: 135,
    textColor: '#f8fafc',
    mutedColor: '#cbd5e1',
    accentColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.18)',
    isDark: true,
  },
  {
    id: 'crisp-paper',
    name: 'শুভ্র কাগজ',
    kind: 'solid',
    colors: ['#ffffff'],
    textColor: '#0f172a',
    mutedColor: '#475569',
    accentColor: '#0f766e',
    glowColor: 'rgba(15, 23, 42, 0.08)',
    isDark: false,
  },
  {
    id: 'desert-dusk',
    name: 'মরু গোধূলি',
    kind: 'gradient',
    colors: ['#2c1810', '#542d1b', '#1f110b'],
    angle: 150,
    textColor: '#fef3c7',
    mutedColor: '#fcd34d',
    accentColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.18)',
    isDark: true,
  },
  {
    id: 'sage-linen',
    name: 'সবুজ লিনেন',
    kind: 'gradient',
    colors: ['#ecfdf5', '#d1fae5', '#f0fdf4'],
    angle: 135,
    textColor: '#064e3b',
    mutedColor: '#047857',
    accentColor: '#0f766e',
    glowColor: 'rgba(16, 185, 129, 0.16)',
    isDark: false,
  },
  {
    id: 'deep-ocean',
    name: 'গভীর সমুদ্র',
    kind: 'gradient',
    colors: ['#082f49', '#0c4a6e', '#041a2b'],
    angle: 165,
    textColor: '#f0f9ff',
    mutedColor: '#bae6fd',
    accentColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.20)',
    isDark: true,
  },
  {
    id: 'soft-rose',
    name: 'কোমল গোলাপি',
    kind: 'gradient',
    colors: ['#fdf2f2', '#fce7f3', '#fff1f2'],
    angle: 140,
    textColor: '#3f1d28',
    mutedColor: '#831843',
    accentColor: '#be185d',
    glowColor: 'rgba(190, 24, 93, 0.12)',
    isDark: false,
  },
  {
    id: 'charcoal-mono',
    name: 'চারকোল কালো',
    kind: 'solid',
    colors: ['#141416'],
    textColor: '#f4f4f5',
    mutedColor: '#a1a1aa',
    accentColor: '#e4e4e7',
    glowColor: 'rgba(244, 244, 245, 0.12)',
    isDark: true,
  },
];

export const ISLAMIC_SUBTOPICS: { id: IslamicSubTopic; label: string }[] = [
  { id: 'sabr', label: 'সবর ও ধৈর্য' },
  { id: 'shukr', label: 'শোকর ও কৃতজ্ঞতা' },
  { id: 'tawakkul', label: 'আল্লাহর ওপর ভরসা' },
  { id: 'tawbah', label: 'ক্ষমা ও তওবা' },
  { id: 'quran_salah', label: 'কুরআন ও নামাজ' },
  { id: 'life_akhirah', label: 'জীবন ও আখিরাত' },
];

export const MOTIVATIONAL_SUBTOPICS: { id: MotivationalSubTopic; label: string }[] = [
  { id: 'confidence', label: 'আত্মবিশ্বাস' },
  { id: 'hardwork', label: 'পরিশ্রম ও ধৈর্য' },
  { id: 'resilience', label: 'ব্যর্থতা থেকে ঘুরে দাঁড়ানো' },
  { id: 'goals', label: 'লক্ষ্য ও স্বপ্ন' },
  { id: 'discipline', label: 'সময় ও শৃঙ্খলা' },
  { id: 'positivity', label: 'ইতিবাচক মানসিকতা' },
];

export const ALL_SUBTOPIC_LABELS: Record<
  'all' | IslamicSubTopic | MotivationalSubTopic,
  string
> = {
  all: 'সবগুলো বিষয়',
  sabr: 'সবর ও ধৈর্য',
  shukr: 'শোকর ও কৃতজ্ঞতা',
  tawakkul: 'আল্লাহর ওপর ভরসা',
  tawbah: 'ক্ষমা ও তওবা',
  quran_salah: 'কুরআন ও নামাজ',
  life_akhirah: 'জীবন ও আখিরাত',
  confidence: 'আত্মবিশ্বাস',
  hardwork: 'পরিশ্রম ও ধৈর্য',
  resilience: 'ব্যর্থতা থেকে ঘুরে দাঁড়ানো',
  goals: 'লক্ষ্য ও স্বপ্ন',
  discipline: 'সময় ও শৃঙ্খলা',
  positivity: 'ইতিবাচক মানসিকতা',
};
