// Theme system — dark (default) / light.
//
// The active theme lives on <html data-theme="…"> so every CSS token in
// styles/themes.css switches in one place. The choice is persisted in
// localStorage and restored on load (index.html applies it before first
// paint, so there is no flash of the wrong theme). Read it with
// hooks/useTheme; chart palettes live in config/chartThemes.js.

import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { THEME_STORAGE_KEY } from "../config/constants";

const DEFAULT_THEME = "dark";

function isValidTheme(value) {
  return value === "dark" || value === "light";
}

export function readStoredTheme() {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (isValidTheme(stored)) return stored;
  } catch {
    // Storage can be unavailable (private mode, blocked site data) — fall back.
  }
  return DEFAULT_THEME;
}

function applyThemeToDocument(theme) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.style.colorScheme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "light" ? "#FAF6F1" : "#0E0A1F");
}

export const ThemeContext = createContext({
  theme: DEFAULT_THEME,
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const fromDom = document.documentElement.getAttribute("data-theme");
    return isValidTheme(fromDom) ? fromDom : readStoredTheme();
  });

  useEffect(() => {
    applyThemeToDocument(theme);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Non-critical — theme still applies for this session.
    }
  }, [theme]);

  // Keep multiple open tabs in sync.
  useEffect(() => {
    function onStorage(e) {
      if (e.key === THEME_STORAGE_KEY && isValidTheme(e.newValue)) setThemeState(e.newValue);
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setTheme = useCallback((next) => {
    if (!isValidTheme(next)) return;
    // Briefly enable colour transitions so the swap feels smooth, without
    // leaving transitions on everything during normal interaction.
    const root = document.documentElement;
    root.classList.add("theme-transition");
    window.setTimeout(() => root.classList.remove("theme-transition"), 350);
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
