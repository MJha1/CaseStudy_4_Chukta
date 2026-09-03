import { useEffect, useRef } from 'react';

/**
 * Call `onFocus` whenever the tab regains focus / becomes visible, so lists
 * stay live without a manual reload. The latest callback is always used, and
 * a short guard avoids double-firing when focus + visibilitychange coincide.
 */
export function useRefreshOnFocus(onFocus: () => void): void {
  const cb = useRef(onFocus);
  cb.current = onFocus;

  useEffect(() => {
    let last = 0;
    const run = () => {
      if (document.visibilityState === 'hidden') return;
      const now = Date.now();
      if (now - last < 500) return;
      last = now;
      cb.current();
    };
    window.addEventListener('focus', run);
    document.addEventListener('visibilitychange', run);
    return () => {
      window.removeEventListener('focus', run);
      document.removeEventListener('visibilitychange', run);
    };
  }, []);
}
