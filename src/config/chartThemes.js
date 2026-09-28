// Recharts colour palettes per theme (SVG attributes can't read CSS
// variables reliably, so chart colours live here) and shared tooltip styling.

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
