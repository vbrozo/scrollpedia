import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FONT_KEY = 'scrollpedia_font_scale';
const AMOLED_KEY = 'scrollpedia_amoled';

/** Selectable reading text sizes. `label` renders an "A" at the matching size. */
export const FONT_OPTIONS = [
  { key: 'sm', scale: 0.9 },
  { key: 'md', scale: 1 },
  { key: 'lg', scale: 1.15 },
  { key: 'xl', scale: 1.3 },
] as const;

// Default (deep navy) vs AMOLED (pure black) palettes.
const NAVY = { bg: '#0d1128', card: '#0d1128', modal: '#111' };
const BLACK = { bg: '#000000', card: '#000000', modal: '#000000' };

interface ThemeContextValue {
  /** Multiplier applied to reading text sizes (title, extract, article body). */
  fontScale: number;
  /** Pure-black background for OLED screens / battery saving. */
  amoled: boolean;
  /** Primary screen background. */
  bg: string;
  /** Full-screen card background. */
  cardBg: string;
  /** Article modal background. */
  modalBg: string;
  setFontScale: (scale: number) => void;
  setAmoled: (on: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  fontScale: 1,
  amoled: false,
  bg: NAVY.bg,
  cardBg: NAVY.card,
  modalBg: NAVY.modal,
  setFontScale: () => {},
  setAmoled: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [fontScale, setFontScaleState] = useState(1);
  const [amoled, setAmoledState] = useState(false);
  const loaded = useRef(false);

  // Load persisted preferences once on mount.
  useEffect(() => {
    Promise.all([AsyncStorage.getItem(FONT_KEY), AsyncStorage.getItem(AMOLED_KEY)])
      .then(([f, a]) => {
        const parsed = f ? parseFloat(f) : NaN;
        if (!Number.isNaN(parsed) && FONT_OPTIONS.some((o) => o.scale === parsed)) {
          setFontScaleState(parsed);
        }
        if (a === '1') setAmoledState(true);
      })
      .finally(() => {
        loaded.current = true;
      });
  }, []);

  function setFontScale(scale: number) {
    setFontScaleState(scale);
    AsyncStorage.setItem(FONT_KEY, String(scale)).catch(() => {});
  }

  function setAmoled(on: boolean) {
    setAmoledState(on);
    AsyncStorage.setItem(AMOLED_KEY, on ? '1' : '0').catch(() => {});
  }

  const value = useMemo<ThemeContextValue>(() => {
    const palette = amoled ? BLACK : NAVY;
    return {
      fontScale,
      amoled,
      bg: palette.bg,
      cardBg: palette.card,
      modalBg: palette.modal,
      setFontScale,
      setAmoled,
    };
  }, [fontScale, amoled]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
