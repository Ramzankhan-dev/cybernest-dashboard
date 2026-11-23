// KPI stat card used on the dashboard and several feature pages.

export function KpiCard({ label, value, onClick, icon: Icon, tone = "violet", hint, badge }) {
  const clickable = !!onClick;
  return (
    <div
      className={`kpi-card tone-${tone}`}
      onClick={onClick}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
      style={{ cursor: clickable ? "pointer" : "default", position: "relative" }}
    >
      {badge ? (
        <span title={`${badge} new`} style={{ position: "absolute", top: 10, right: 12, display: "inline-flex", alignItems: "center", gap: 3, fontSize: "0.72rem", fontWeight: 700, color: "#fff", background: "#d9534f", borderRadius: 999, padding: "2px 8px" }}>
          ★ {badge}
        </span>
      ) : null}
      {Icon && <span className="kpi-icon"><Icon size={20} /></span>}
      <div className="kpi-body">
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">{value ?? "—"}</div>
        {hint && <div className="kpi-hint">{hint}</div>}
      </div>
    </div>
  );
}
