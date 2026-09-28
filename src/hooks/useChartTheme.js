// Chart palette for the active theme (see config/chartThemes.js).
import { CHART_THEMES } from "../config/chartThemes";
import { useTheme } from "./useTheme";

export function useChartTheme() {
  const { theme } = useTheme();
  return CHART_THEMES[theme] || CHART_THEMES.dark;
}
