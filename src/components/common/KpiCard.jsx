// KPI stat card used on the dashboard and several feature pages.

export function KpiCard({ label, value, onClick, icon: Icon, tone = "violet", hint }) {
  const clickable = !!onClick;
  return (
    <div
      className={`kpi-card tone-${tone}`}
      onClick={onClick}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
      style={{ cursor: clickable ? "pointer" : "default" }}
    >
      {Icon && <span className="kpi-icon"><Icon size={20} /></span>}
      <div className="kpi-body">
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">{value ?? "—"}</div>
        {hint && <div className="kpi-hint">{hint}</div>}
      </div>
    </div>
  );
}
