import { CaptionItem } from '../types/studio';
import { ISLAMIC_CAPTIONS } from './islamicCaptions';
import { MOTIVATIONAL_CAPTIONS } from './motivationalCaptions';

export const CAPTIONS_LIBRARY: CaptionItem[] = [
  ...ISLAMIC_CAPTIONS,
  ...MOTIVATIONAL_CAPTIONS,
];
