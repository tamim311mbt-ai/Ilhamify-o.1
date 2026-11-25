export type StudioTab = 'captions' | 'card' | 'reel';

export type CaptionCategory = 'islamic' | 'motivational';

export type IslamicSubTopic =
  | 'sabr'
  | 'shukr'
  | 'tawakkul'
  | 'tawbah'
  | 'quran_salah'
  | 'life_akhirah';

export type MotivationalSubTopic =
  | 'confidence'
  | 'hardwork'
  | 'resilience'
  | 'goals'
  | 'discipline'
  | 'positivity';

export type CaptionSubTopic = 'all' | IslamicSubTopic | MotivationalSubTopic;

export interface CaptionItem {
  id: string;
  category: CaptionCategory;
  subTopic: IslamicSubTopic | MotivationalSubTopic;
  text: string;
  attribution: string;
}

export type AspectRatioId = '1:1' | '4:5' | '9:16';

export interface AspectRatioSpec {
  id: AspectRatioId;
  label: string;
  sublabel: string;
  width: number;
  height: number;
}

export type TypographyPresetId = 'hind' | 'serif' | 'baloo' | 'anek';

export interface TypographyPreset {
  id: TypographyPresetId;
  name: string;
  fontFamily: string;
  fontWeight: number;
  lineHeightRatio: number;
}

export interface BackgroundTheme {
  id: string;
  name: string;
  kind: 'solid' | 'gradient';
  colors: string[];
  angle?: number;
  textColor: string;
  mutedColor: string;
  accentColor: string;
  glowColor: string;
  isDark: boolean;
}

export type WatermarkPosition =
  | 'bottom-center'
  | 'bottom-left'
  | 'bottom-right'
  | 'top-center'
  | 'top-left'
  | 'top-right';

export interface BrandKitState {
  handleText: string;
  showHandle: boolean;
  handlePosition: WatermarkPosition;
  handleOpacity: number;
  logoDataUrl: string | null;
  showLogo: boolean;
  logoPosition: WatermarkPosition;
  logoSize: number;
  logoOpacity: number;
}

export interface CardSettings {
  aspectRatio: AspectRatioId;
  themeId: string;
  typographyId: TypographyPresetId;
  fontSize: number;
  textAlign: 'center' | 'left';
  showQuoteMark: boolean;
  showDivider: boolean;
  customTextColor: string | null;
}

export type ReelMotionStyle = 'drift' | 'breathing' | 'kinetic' | 'horizon';

export type ReelDuration = 5 | 10 | 15;

export interface ReelSettings {
  themeId: string;
  typographyId: TypographyPresetId;
  motionStyle: ReelMotionStyle;
  duration: ReelDuration;
  fontSize: number;
  textAlign: 'center' | 'left';
  showParticles: boolean;
  resolution: '720p' | '1080p';
}
