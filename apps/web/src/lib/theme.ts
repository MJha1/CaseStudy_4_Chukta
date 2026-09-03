import { useCallback, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';
const KEY = 'chukta.theme';

/** Read the saved theme; defaults to dark. */
export function getTheme(): Theme {
  try {
    return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

function apply(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* ignore */
  }
}

/** Theme state + toggle. The <html> data-theme attribute is the source of truth. */
export function useTheme(): { theme: Theme; setTheme: (t: Theme) => void; toggle: () => void } {
  const [theme, setThemeState] = useState<Theme>(getTheme);

  // Keep the DOM in sync if the attribute was set pre-paint by the init script.
  useEffect(() => {
    apply(theme);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const toggle = useCallback(() => setThemeState((t) => (t === 'dark' ? 'light' : 'dark')), []);
  return { theme, setTheme, toggle };
}
