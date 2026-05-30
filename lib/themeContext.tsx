import { D } from '@/constants/dark';
import { L } from '@/constants/light';
import { prefsStorage, type UserPrefs } from '@/lib/storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';

export type ColorPalette = {
  bg: string;
  surface: string;
  surfaceAlt: string;
  dark: string;
  yellow: string;
  coral: string;
  violet: string;
  mint: string;
  orange: string;
  blue: string;
  text: string;
  textMid: string;
  textLight: string;
  ink: string;
  onInk: string;
  border: string;
  shadow: string;
  radius: typeof L.radius;
};
export type ThemeMode = UserPrefs['theme'];

type ThemeContextValue = {
  colors: ColorPalette;
  isDark: boolean;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue>({
  colors: L,
  isDark: false,
  theme: 'light',
  setTheme: async () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeMode>('light');

  useEffect(() => {
    prefsStorage.get().then((p) => setThemeState(p.theme ?? 'light'));
  }, []);

  const isDark = useMemo(() => {
    if (theme === 'dark') return true;
    if (theme === 'system') return systemScheme === 'dark';
    return false;
  }, [theme, systemScheme]);

  const colors: ColorPalette = isDark ? D : L;

  const setTheme = useCallback(async (next: ThemeMode) => {
    setThemeState(next);
    await prefsStorage.set({ theme: next });
  }, []);

  const value = useMemo(
    () => ({ colors, isDark, theme, setTheme }),
    [colors, isDark, theme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

/** Shorthand for themed color palette */
export function useColors() {
  return useContext(ThemeContext).colors;
}
