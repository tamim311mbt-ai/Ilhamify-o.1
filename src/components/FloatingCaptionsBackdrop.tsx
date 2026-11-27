import { useEffect, useMemo, useRef } from 'react';
import { CAPTIONS_LIBRARY } from '../data/captions';
import { CaptionItem } from '../types/studio';

interface FloatingSlot {
  id: string;
  positionClass: string;
  opacityClass: string;
  widthClass: string;
  vx: number;
  vy: number;
}

const MAX_SHIFT_X_PX = 42;
const MAX_SHIFT_Y_PX = 120;
const LERP_FACTOR = 0.1;

const FLOATING_SLOTS: FloatingSlot[] = [
  {
    id: 'slot-1',
    positionClass: 'top-[10%] left-[2%] md:left-[2.5%]',
    opacityClass: 'opacity-[0.085]',
    widthClass: 'max-w-[180px] md:max-w-[215px]',
    vx: 0.018,
    vy: -0.055,
  },
  {
    id: 'slot-2',
    positionClass: 'top-[14%] right-[2%] md:right-[2.5%]',
    opacityClass: 'opacity-[0.095]',
    widthClass: 'max-w-[175px] md:max-w-[220px]',
    vx: -0.02,
    vy: 0.04,
  },
  {
    id: 'slot-3',
    positionClass: 'top-[29%] left-[1.5%] hidden md:block',
    opacityClass: 'opacity-[0.105]',
    widthClass: 'max-w-[210px]',
    vx: 0.012,
    vy: -0.085,
  },
  {
    id: 'slot-4',
    positionClass: 'top-[33%] right-[1.5%] hidden md:block',
    opacityClass: 'opacity-[0.09]',
    widthClass: 'max-w-[205px]',
    vx: -0.016,
    vy: -0.045,
  },
  {
    id: 'slot-5',
    positionClass: 'top-[49%] left-[2%]',
    opacityClass: 'opacity-[0.08]',
    widthClass: 'max-w-[170px] md:max-w-[205px]',
    vx: -0.014,
    vy: 0.055,
  },
  {
    id: 'slot-6',
    positionClass: 'top-[52%] right-[2%] hidden md:block',
    opacityClass: 'opacity-[0.10]',
    widthClass: 'max-w-[210px]',
    vx: 0.02,
    vy: -0.07,
  },
  {
    id: 'slot-7',
    positionClass: 'top-[67%] left-[2.5%] hidden md:block',
    opacityClass: 'opacity-[0.09]',
    widthClass: 'max-w-[215px]',
    vx: 0.014,
    vy: -0.095,
  },
  {
    id: 'slot-8',
    positionClass: 'top-[71%] right-[2.5%]',
    opacityClass: 'opacity-[0.085]',
    widthClass: 'max-w-[175px] md:max-w-[210px]',
    vx: -0.018,
    vy: 0.045,
  },
  {
    id: 'slot-9',
    positionClass: 'top-[83%] left-[3%]',
    opacityClass: 'opacity-[0.08]',
    widthClass: 'max-w-[180px] md:max-w-[215px]',
    vx: 0.01,
    vy: -0.06,
  },
  {
    id: 'slot-10',
    positionClass: 'top-[85%] right-[3%] hidden lg:block',
    opacityClass: 'opacity-[0.10]',
    widthClass: 'max-w-[215px]',
    vx: -0.022,
    vy: -0.08,
  },
  {
    id: 'slot-11',
    positionClass: 'top-[22%] left-[11%] hidden 2xl:block',
    opacityClass: 'opacity-[0.085]',
    widthClass: 'max-w-[195px]',
    vx: 0.015,
    vy: 0.035,
  },
  {
    id: 'slot-12',
    positionClass: 'top-[62%] right-[11%] hidden 2xl:block',
    opacityClass: 'opacity-[0.085]',
    widthClass: 'max-w-[195px]',
    vx: -0.015,
    vy: -0.05,
  },
];

function clampShift(value: number, limit: number): number {
  if (value > limit) return limit;
  if (value < -limit) return -limit;
  return value;
}

function extractCompactSnippet(text: string): string | null {
  const cleaned = text.trim();
  if (cleaned.length <= 52) {
    return cleaned;
  }
  const clause = cleaned.split(/[—;।]/)[0]?.trim() ?? '';
  if (clause.length >= 18 && clause.length <= 48) {
    return `${clause}।`;
  }
  return null;
}

function selectFloatingCaptions(library: CaptionItem[], count: number): {
  text: string;
  attribution: string;
}[] {
  const islamicSnippets: { text: string; attribution: string }[] = [];
  const motivationalSnippets: { text: string; attribution: string }[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < library.length; i += 7) {
    const item = library[i];
    const snippet = extractCompactSnippet(item.text);
    if (!snippet || seen.has(snippet)) continue;
    seen.add(snippet);

    const entry = { text: snippet, attribution: item.attribution };
    if (item.category === 'islamic' && islamicSnippets.length < count) {
      islamicSnippets.push(entry);
    } else if (item.category === 'motivational' && motivationalSnippets.length < count) {
      motivationalSnippets.push(entry);
    }

    if (islamicSnippets.length >= count && motivationalSnippets.length >= count) {
      break;
    }
  }

  const combined: { text: string; attribution: string }[] = [];
  for (let i = 0; i < count; i++) {
    const src = i % 2 === 0 ? islamicSnippets : motivationalSnippets;
    const fallback = i % 2 === 0 ? motivationalSnippets : islamicSnippets;
    const item = src[Math.floor(i / 2)] ?? fallback[Math.floor(i / 2)];
    if (item) combined.push(item);
  }

  return combined;
}

export function FloatingCaptionsBackdrop() {
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);

  const snippets = useMemo(
    () => selectFloatingCaptions(CAPTIONS_LIBRARY, FLOATING_SLOTS.length),
    []
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const motionQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;

    let rafId: number | null = null;
    let targetScrollY = Math.max(0, window.scrollY || window.pageYOffset || 0);
    let currentScrollY = targetScrollY;

    const applyTransforms = (scrollPos: number) => {
      for (let i = 0; i < FLOATING_SLOTS.length; i++) {
        const el = slotRefs.current[i];
        if (!el) continue;
        const { vx, vy } = FLOATING_SLOTS[i];
        const tx = clampShift(scrollPos * vx, MAX_SHIFT_X_PX);
        const ty = clampShift(scrollPos * vy, MAX_SHIFT_Y_PX);
        el.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0)`;
      }
    };

    const resetTransforms = () => {
      for (let i = 0; i < FLOATING_SLOTS.length; i++) {
        const el = slotRefs.current[i];
        if (el) {
          el.style.transform = 'translate3d(0, 0, 0)';
        }
      }
    };

    const tick = () => {
      rafId = null;

      if (motionQuery?.matches) {
        resetTransforms();
        return;
      }

      const diff = targetScrollY - currentScrollY;
      if (Math.abs(diff) <= 0.15) {
        currentScrollY = targetScrollY;
        applyTransforms(currentScrollY);
        return;
      }

      currentScrollY += diff * LERP_FACTOR;
      applyTransforms(currentScrollY);
      rafId = window.requestAnimationFrame(tick);
    };

    const handleScroll = () => {
      if (motionQuery?.matches) return;
      targetScrollY = Math.max(0, window.scrollY || window.pageYOffset || 0);
      if (rafId === null) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const handleMotionChange = () => {
      if (motionQuery?.matches) {
        if (rafId !== null) {
          window.cancelAnimationFrame(rafId);
          rafId = null;
        }
        resetTransforms();
      } else {
        targetScrollY = Math.max(0, window.scrollY || window.pageYOffset || 0);
        currentScrollY = targetScrollY;
        applyTransforms(currentScrollY);
      }
    };

    if (motionQuery?.matches) {
      resetTransforms();
    } else {
      applyTransforms(currentScrollY);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    motionQuery?.addEventListener('change', handleMotionChange);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      motionQuery?.removeEventListener('change', handleMotionChange);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden [mask-image:radial-gradient(ellipse_92%_86%_at_50%_50%,#000_55%,transparent_100%)]"
    >
      {FLOATING_SLOTS.map((slot, idx) => {
        const item = snippets[idx];
        if (!item) return null;

        return (
          <div
            key={slot.id}
            ref={(el) => {
              slotRefs.current[idx] = el;
            }}
            className={`absolute ${slot.positionClass} ${slot.widthClass} ${slot.opacityClass} will-change-transform`}
          >
            <div className="rounded-xl border border-teal-700/25 dark:border-teal-400/25 bg-teal-100/50 dark:bg-teal-900/45 px-3.5 py-2.5">
              <p className="font-editorial text-[12px] md:text-[13px] leading-relaxed text-teal-950 dark:text-teal-100 line-clamp-2">
                {item.text}
              </p>
              {item.attribution && (
                <span className="block mt-1 text-[10px] font-medium text-teal-800 dark:text-teal-300 truncate">
                  — {item.attribution}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
