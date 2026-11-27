import { CSSProperties, ReactNode, useEffect, useRef, useState } from 'react';

type RevealCallback = () => void;

const revealListeners = new WeakMap<Element, RevealCallback>();
let sharedRevealObserver: IntersectionObserver | null = null;

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getSharedRevealObserver(): IntersectionObserver | null {
  if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
    return null;
  }
  if (!sharedRevealObserver) {
    sharedRevealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting || entry.boundingClientRect.top < window.innerHeight) {
            const cb = revealListeners.get(entry.target);
            if (cb) {
              cb();
              revealListeners.delete(entry.target);
            }
            sharedRevealObserver?.unobserve(entry.target);
          }
        }
      },
      {
        threshold: 0.04,
        rootMargin: '0px 0px -16px 0px',
      }
    );
  }
  return sharedRevealObserver;
}

interface ScrollRevealProps {
  children: ReactNode;
  delayMs?: number;
  className?: string;
}

export function ScrollReveal({ children, delayMs = 0, className = '' }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [revealed, setRevealed] = useState<boolean>(() => prefersReducedMotion());

  useEffect(() => {
    if (revealed) return;
    const node = ref.current;
    if (!node) return;

    if (prefersReducedMotion()) {
      setRevealed(true);
      return;
    }

    const observer = getSharedRevealObserver();
    if (!observer) {
      setRevealed(true);
      return;
    }

    revealListeners.set(node, () => {
      setRevealed(true);
    });
    observer.observe(node);

    return () => {
      revealListeners.delete(node);
      observer.unobserve(node);
    };
  }, [revealed]);

  const style: CSSProperties | undefined =
    delayMs > 0 ? ({ '--reveal-delay': `${delayMs}ms` } as CSSProperties) : undefined;

  return (
    <div
      ref={ref}
      style={style}
      className={`scroll-reveal-item ${revealed ? 'is-revealed' : ''} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
