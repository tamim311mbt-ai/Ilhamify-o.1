import { useEffect, useState } from 'react';

const COUNTER_KEY = 'ilhamify-o1-tamim311mbt-visits';
const SESSION_FLAG_KEY = 'ilhamify_visit_counted_v1';
const LAST_COUNT_CACHE_KEY = 'ilhamify_last_visitor_count_v1';

export type VisitorCountStatus = 'loading' | 'ready' | 'unavailable';

interface VisitorCountState {
  count: number | null;
  status: VisitorCountStatus;
}

function readCachedCount(): number | null {
  try {
    const raw = localStorage.getItem(LAST_COUNT_CACHE_KEY);
    if (!raw) return null;
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export function useVisitorCount(): VisitorCountState {
  const [state, setState] = useState<VisitorCountState>({
    count: null,
    status: 'loading',
  });

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 5000);

    const fetchCount = async () => {
      let alreadyCounted = false;
      try {
        alreadyCounted = sessionStorage.getItem(SESSION_FLAG_KEY) === '1';
      } catch {
        alreadyCounted = false;
      }

      const mode = alreadyCounted ? 'get' : 'hit';
      const endpoint = `https://countapi.mileshilliard.com/api/v1/${mode}/${COUNTER_KEY}`;

      try {
        const res = await fetch(endpoint, {
          signal: controller.signal,
          cache: 'no-store',
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = (await res.json()) as { value?: number | string };
        const parsed =
          typeof data.value === 'number'
            ? data.value
            : typeof data.value === 'string'
            ? parseInt(data.value, 10)
            : NaN;

        if (!Number.isFinite(parsed) || parsed < 0) {
          throw new Error('Invalid count value');
        }

        if (!alreadyCounted) {
          try {
            sessionStorage.setItem(SESSION_FLAG_KEY, '1');
          } catch {
            // সেশন স্টোরেজ ত্রুটি উপেক্ষা করুন
          }
        }

        try {
          localStorage.setItem(LAST_COUNT_CACHE_KEY, String(parsed));
        } catch {
          // লোকাল স্টোরেজ ত্রুটি উপেক্ষা করুন
        }

        setState({ count: parsed, status: 'ready' });
      } catch {
        if (controller.signal.aborted) {
          const cached = readCachedCount();
          setState(
            cached !== null
              ? { count: cached, status: 'ready' }
              : { count: null, status: 'unavailable' }
          );
          return;
        }
        const cached = readCachedCount();
        setState(
          cached !== null
            ? { count: cached, status: 'ready' }
            : { count: null, status: 'unavailable' }
        );
      } finally {
        window.clearTimeout(timeoutId);
      }
    };

    fetchCount();

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  return state;
}
