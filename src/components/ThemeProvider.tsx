"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = Exclude<Theme, "system">;

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme?: ResolvedTheme;
  setTheme: (theme: Theme) => void;
};

const THEME_STORAGE_KEY = "theme";
const SYSTEM_THEME_QUERY = "(prefers-color-scheme: dark)";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function normalizeTheme(value: string | null): Theme {
  return value === "light" || value === "dark" ? value : "system";
}

function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme !== "system") return theme;
  return window.matchMedia(SYSTEM_THEME_QUERY).matches ? "dark" : "light";
}

function applyTheme(theme: ResolvedTheme, disableTransitions: boolean) {
  let transitionStyle: HTMLStyleElement | null = null;
  if (disableTransitions) {
    transitionStyle = document.createElement("style");
    transitionStyle.textContent = "*,*::before,*::after{transition:none!important}";
    document.head.appendChild(transitionStyle);
  }

  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(theme);
  document.documentElement.style.colorScheme = theme;

  if (transitionStyle) {
    window.getComputedStyle(document.body);
    window.setTimeout(() => transitionStyle?.remove(), 0);
  }
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>();

  const commitTheme = useCallback((nextTheme: Theme, disableTransitions: boolean) => {
    const nextResolvedTheme = resolveTheme(nextTheme);
    setThemeState(nextTheme);
    setResolvedTheme(nextResolvedTheme);
    applyTheme(nextResolvedTheme, disableTransitions);
  }, []);

  const setTheme = useCallback((nextTheme: Theme) => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // Tema sesi aktif tetap berubah ketika penyimpanan browser tidak tersedia.
    }
    commitTheme(nextTheme, true);
  }, [commitTheme]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      let storedTheme: string | null = null;
      try {
        storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      } catch {
        // Gunakan preferensi sistem ketika penyimpanan browser diblokir.
      }
      commitTheme(normalizeTheme(storedTheme), false);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [commitTheme]);

  useEffect(() => {
    const media = window.matchMedia(SYSTEM_THEME_QUERY);
    const handleSystemThemeChange = () => {
      if (theme === "system") commitTheme("system", false);
    };
    media.addEventListener("change", handleSystemThemeChange);
    return () => media.removeEventListener("change", handleSystemThemeChange);
  }, [commitTheme, theme]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY) commitTheme(normalizeTheme(event.newValue), false);
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [commitTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme }),
    [resolvedTheme, setTheme, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme harus digunakan di dalam ThemeProvider.");
  return context;
}
