// Circular percentage gauge (plain SVG).

// Circular gauge for the average-battery figure (Device Health).
export function HealthRing({ value, label, chartTheme }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const r = 62;
  const c = 2 * Math.PI * r;
  return (
    <div className="hero-ring" role="img" aria-label={`${label}: ${value ?? "—"}%`}>
      <svg width="150" height="150" viewBox="0 0 150 150">
        <circle cx="75" cy="75" r={r} fill="none" stroke={chartTheme.ringTrack} strokeWidth="11" />
        <circle
          cx="75" cy="75" r={r} fill="none"
          stroke={chartTheme.ringValue}
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={`${(v / 100) * c} ${c}`}
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <div className="hero-ring-label">
        <strong>{value != null ? `${value}%` : "—"}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
