// Theme system — dark (default) / light.
//
// The active theme lives on <html data-theme="…"> so every CSS token in
// App.css switches in one place. The choice is persisted in localStorage
// and restored on load (index.html applies it before first paint, so there
// is no flash of the wrong theme). Charts can't read CSS variables inside
// SVG presentation attributes reliably, so their palettes live here and
// are read through useChartTheme().

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { IconMoon, IconSun } from "./icons.jsx";

export const THEME_STORAGE_KEY = "cybernest-theme";
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

const ThemeContext = createContext({
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

export function useTheme() {
  return useContext(ThemeContext);
}

// ---------- Chart palettes ----------
export const CHART_THEMES = {
  dark: {
    series: ["#A78BFA", "#F472B6", "#818CF8", "#5EEAD4", "#FBBF77"],
    barPrimary: ["#A78BFA", "#7C5CFF"],
    barSecondary: ["#F9A8D4", "#DB5CB0"],
    grid: "rgba(167, 139, 250, 0.12)",
    axis: "#9A92BE",
    cursor: "rgba(167, 139, 250, 0.08)",
    ringTrack: "rgba(255, 255, 255, 0.14)",
    ringValue: "#FFFFFF",
  },
  light: {
    series: ["#2F5D50", "#E8A09A", "#E9C46A", "#B4A7D6", "#8FB9A8"],
    barPrimary: ["#3E7466", "#2F5D50"],
    barSecondary: ["#F1B9B3", "#DE8F88"],
    grid: "rgba(47, 93, 80, 0.10)",
    axis: "#6F7A74",
    cursor: "rgba(47, 93, 80, 0.06)",
    ringTrack: "rgba(255, 255, 255, 0.18)",
    ringValue: "#F6CFC9",
  },
};

export function useChartTheme() {
  const { theme } = useTheme();
  return CHART_THEMES[theme] || CHART_THEMES.dark;
}

// Shared Recharts tooltip styling — HTML, so CSS variables work here.
export const chartTooltipProps = {
  contentStyle: {
    background: "var(--surface-elevated)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    boxShadow: "var(--shadow-md)",
    color: "var(--text-primary)",
    fontSize: 12.5,
    padding: "8px 12px",
  },
  itemStyle: { color: "var(--text-primary)", padding: 0 },
  labelStyle: { color: "var(--text-muted)", marginBottom: 4, fontWeight: 600 },
};

// ---------- Controls ----------

// Compact header switch: sun + moon with a sliding thumb.
export function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";
  const label = isLight ? "Switch to dark mode" : "Switch to light mode";
  return (
    <button
      type="button"
      className={`theme-toggle ${isLight ? "is-light" : "is-dark"} ${className}`.trim()}
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      role="switch"
      aria-checked={isLight}
    >
      <span className="theme-toggle-thumb" aria-hidden="true" />
      <span className="theme-toggle-icon moon" aria-hidden="true"><IconMoon size={15} /></span>
      <span className="theme-toggle-icon sun" aria-hidden="true"><IconSun size={15} /></span>
    </button>
  );
}

// Explicit two-option picker for Settings / Profile.
export function ThemeSegmented() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="segmented" role="radiogroup" aria-label="Color theme">
      <button
        type="button"
        role="radio"
        aria-checked={theme === "dark"}
        className={`segmented-option ${theme === "dark" ? "active" : ""}`}
        onClick={() => setTheme("dark")}
      >
        <IconMoon size={15} /> Dark
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={theme === "light"}
        className={`segmented-option ${theme === "light" ? "active" : ""}`}
        onClick={() => setTheme("light")}
      >
        <IconSun size={15} /> Light
      </button>
    </div>
  );
}
