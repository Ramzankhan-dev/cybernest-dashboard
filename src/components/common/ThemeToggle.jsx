// Theme controls: compact header switch + two-option picker (Settings / Profile).
import { IconMoon, IconSun } from "../icons";
import { useTheme } from "../../hooks/useTheme";

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
