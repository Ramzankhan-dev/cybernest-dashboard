// Super Admin Reports: platform-wide oversight reports + a custom report builder.
// (Organization-level operational reports live in Reports.jsx for Org Admins.)

import { Component, useEffect, useState } from "react";
import { RefreshButton } from "../../components/common/RefreshButton";
import { exportToCSV, exportToPDF } from "../../utils/exportUtils";
import { getAllOrganizations } from "../organizations/organizationService";
import { getCustomReportMeta, getPlatformReport, runCustomReport } from "./reportService";

const fmtDate = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
};
const cap = (s) => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : "—");
const arr = (v) => (Array.isArray(v) ? v : []);
const dash = (v) => (v === null || v === undefined || v === "" ? "—" : v);

function sumBy(rows, key) {
  return arr(rows).reduce((total, r) => total + (Number(r[key]) || 0), 0);
}
function pct(part, whole) {
  return whole > 0 ? `${Math.round((part / whole) * 100)}%` : "0%";
}

// Each report: which controls it needs, and how to turn the API response into one or more tables.
const REPORTS = [
  {
    key: "organizations-overview",
    title: "Organizations Overview",
    description: "Devices, users, compliance and status for every organization.",
    sections: (d) => [{
      title: "Organizations",
      headers: ["Organization", "Code", "Status", "Devices", "Employees", "Managers", "Compliance %"],
      rows: arr(d.rows).map((r) => [r.name, r.code, cap(r.status), r.total_devices, r.employees, r.managers, `${r.compliance_percentage}%`]),
    }],
  },
  {
    key: "compliance",
    title: "Compliance Report",
    description: "Compliance status and percentage per organization.",
    sections: (d) => {
      const total = sumBy(d.rows, "total_devices");
      const compliant = sumBy(d.rows, "compliant");
      return [{
        title: "Compliance by organization",
        headers: ["Organization", "Total devices", "Compliant", "Non-Compliant", "Pending Sync", "Policy Failed", "Unknown", "Compliance %"],
        rows: [
          ...arr(d.rows).map((r) => [r.name, r.total_devices, r.compliant, r.non_compliant, r.pending_sync, r.policy_failed, r.unknown, `${r.compliance_percentage}%`]),
          ["Platform total", total, compliant, sumBy(d.rows, "non_compliant"), sumBy(d.rows, "pending_sync"), sumBy(d.rows, "policy_failed"), sumBy(d.rows, "unknown"), pct(compliant, total)],
        ],
      }];
    },
  },
  {
    key: "inventory",
    title: "Device Inventory",
    description: "Total devices and status breakdown per organization.",
    sections: (d) => [{
      title: "Device inventory",
      headers: ["Organization", "Total", "Online", "Offline", "Pending enrollment", "Rooted", "Locked"],
      rows: [
        ...arr(d.rows).map((r) => [r.name, r.total, r.online, r.offline, r.pending, r.rooted, r.locked]),
        ["Platform total", sumBy(d.rows, "total"), sumBy(d.rows, "online"), sumBy(d.rows, "offline"), sumBy(d.rows, "pending"), sumBy(d.rows, "rooted"), sumBy(d.rows, "locked")],
      ],
    }],
  },
  {
    key: "security",
    title: "Security Report",
    description: "Rooted, policy-failed and non-compliant devices across the platform.",
    sections: (d) => [{
      title: "Risky devices",
      headers: ["Organization", "Device", "Model", "Employee", "Issue", "Compliance", "Battery %", "Last seen"],
      rows: arr(d.rows).map((r) => [
        r.organization, r.device_uid, dash(r.model), dash(r.employee_name),
        [r.is_rooted ? "Rooted" : null, ["Policy Failed", "Non-Compliant"].includes(r.compliance_status) ? r.compliance_status : null].filter(Boolean).join(" + "),
        r.compliance_status, dash(r.battery_level), fmtDate(r.last_seen),
      ]),
    }],
  },
  {
    key: "security-events",
    title: "Cross-Org Security Events",
    description: "Failed logins, remote wipe/lock, suspensions and other critical events across all organizations.",
    controls: ["dates"],
    sections: (d) => [
      {
        title: "Critical security events",
        headers: ["Time", "Organization", "User", "Category", "Action", "Status", "Details"],
        rows: arr(d.rows).map((r) => [fmtDate(r.created_at), dash(r.organization), r.user_name || r.user_email || "System", r.category, r.action, r.status, dash(r.details)]),
      },
      {
        title: "Currently suspended organizations",
        headers: ["Organization", "Code"],
        rows: arr(d.suspended_organizations).map((o) => [o.name, o.code]),
      },
    ],
  },
  {
    key: "activity",
    title: "Activity Report",
    description: "Who did what across the platform (audit-based).",
    controls: ["dates"],
    sections: (d) => [{
      title: "Platform activity",
      headers: ["Time", "Organization", "User", "Role", "Action", "Status", "Details"],
      rows: arr(d.rows).map((r) => [fmtDate(r.created_at), dash(r.organization), r.user_name || r.user_email || "System", dash(r.role), r.action, r.status, dash(r.details)]),
    }],
  },
  {
    key: "applications",
    title: "Application Report",
    description: "Allowed / blocked applications and APK installs per organization.",
    sections: (d) => [{
      title: "Applications by organization",
      headers: ["Organization", "Total apps", "Allowed", "Blocked", "APK packages", "APK installs"],
      rows: [
        ...arr(d.rows).map((r) => [r.name, r.total_apps, r.allowed_apps, r.blocked_apps, r.apk_packages, r.installs]),
        ["Platform total", sumBy(d.rows, "total_apps"), sumBy(d.rows, "allowed_apps"), sumBy(d.rows, "blocked_apps"), sumBy(d.rows, "apk_packages"), sumBy(d.rows, "installs")],
      ],
    }],
  },
  {
    key: "growth",
    title: "Platform Growth",
    description: "New organizations and device enrollments over time.",
    controls: ["dates", "interval"],
    sections: (d) => [{
      title: `Growth (per ${d.interval})`,
      headers: ["Period starting", "New organizations", "Device enrollments"],
      rows: [
        ...arr(d.rows).map((r) => [r.period, r.new_organizations, r.device_enrollments]),
        ["Total", sumBy(d.rows, "new_organizations"), sumBy(d.rows, "device_enrollments")],
      ],
    }],
  },
  {
    key: "inactive",
    title: "Inactive Devices / Organizations",
    description: "No heartbeat for N days.",
    controls: ["days"],
    sections: (d) => [
      {
        title: `Devices with no heartbeat for ${d.days}+ days`,
        headers: ["Organization", "Device", "Model", "Employee", "Last heartbeat", "Days inactive"],
        rows: arr(d.devices).map((r) => [r.organization, r.device_uid, dash(r.model), dash(r.employee_name), r.last_seen ? fmtDate(r.last_seen) : "Never", r.days_inactive ?? "Never"]),
      },
      {
        title: `Organizations with no heartbeat for ${d.days}+ days`,
        headers: ["Organization", "Status", "Enrolled devices", "Last heartbeat"],
        rows: arr(d.organizations).map((o) => [o.name, cap(o.status), o.devices, o.last_heartbeat ? fmtDate(o.last_heartbeat) : "Never"]),
      },
    ],
  },
];

function ReportTable({ section, filenameBase }) {
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div className="dash-header-row">
        <h3 style={{ fontSize: "0.95rem", margin: 0 }}>{section.title} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>· {section.rows.length} rows</span></h3>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="ghost-dark" disabled={section.rows.length === 0} onClick={() => exportToPDF(filenameBase, section.title, section.headers, section.rows)}>PDF</button>
          <button className="ghost-dark" disabled={section.rows.length === 0} onClick={() => exportToCSV(filenameBase, section.headers, section.rows)}>Excel</button>
        </div>
      </div>
      {section.rows.length === 0 ? (
        <p className="empty-state">No data.</p>
      ) : (
        <div className="table-scroll"><table>
          <thead><tr>{section.headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {section.rows.map((row, i) => (
              <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
            ))}
          </tbody>
        </table></div>
      )}
    </div>
  );
}

// Builds a report's tables; never throws (a bad/partial response shows an empty state instead).
function safeSections(report, payload) {
  try {
    return report.sections(payload || {});
  } catch (err) {
    console.error("Report render failed:", err);
    return [];
  }
}

class ReportErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err) { console.error("Reports crashed:", err); }
  render() {
    if (this.state.failed) {
      return (
        <div>
          <p className="error-text">Something went wrong while showing this report.</p>
          <button type="button" className="ghost-dark" onClick={() => this.setState({ failed: false })}>Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function PlatformReports({ token }) {
  const [reportKey, setReportKey] = useState(REPORTS[0].key);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [interval, setIntervalValue] = useState("month");
  const [days, setDays] = useState(7);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const report = REPORTS.find((r) => r.key === reportKey);
  const controls = report.controls || [];

  function load() {
    setLoading(true);
    setError("");
    const params = {};
    if (controls.includes("dates")) { params.date_from = dateFrom; params.date_to = dateTo; }
    if (controls.includes("interval")) params.interval = interval;
    if (controls.includes("days")) params.days = days;
    return getPlatformReport(token, report.key, params)
      .then((d) => setData({ key: report.key, payload: d }))
      .catch((err) => { setData(null); setError(err.message); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { setData(null); setError(""); load(); }, [reportKey]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.8rem" }}>
        <RefreshButton onRefresh={load} />
      </div>
      <div className="report-grid" style={{ marginBottom: "1.2rem" }}>
        {REPORTS.map((r) => (
          <div
            key={r.key}
            className="report-card"
            style={{ cursor: "pointer", outline: r.key === reportKey ? "2px solid var(--teal)" : "none" }}
            onClick={() => setReportKey(r.key)}
          >
            <h4>{r.title}</h4>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "0.3rem 0 0" }}>{r.description}</p>
          </div>
        ))}
      </div>

      {controls.length > 0 && (
        <form className="policy-form" style={{ marginBottom: "1rem" }} onSubmit={(e) => { e.preventDefault(); load(); }}>
          {controls.includes("dates") && (
            <>
              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>From</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>To</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </>
          )}
          {controls.includes("interval") && (
            <select value={interval} onChange={(e) => setIntervalValue(e.target.value)}>
              <option value="day">Per day</option>
              <option value="week">Per week</option>
              <option value="month">Per month</option>
            </select>
          )}
          {controls.includes("days") && (
            <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              No heartbeat for at least
              <input type="number" min="1" max="365" value={days} onChange={(e) => setDays(e.target.value)} style={{ margin: "0 0.4rem", width: "70px" }} />
              days
            </label>
          )}
          <button type="submit">Apply</button>
        </form>
      )}

      {loading && <p>Loading...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && data && data.key === report.key && safeSections(report, data.payload).map((section, i) => (
        <ReportTable key={i} section={section} filenameBase={`${report.key}${i > 0 ? `-${i + 1}` : ""}`} />
      ))}
    </div>
  );
}

// ===================== Custom Report Builder =====================

function formatCell(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) return fmtDate(value);
  return value;
}

function CustomReportBuilder({ token }) {
  const [meta, setMeta] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [entityKey, setEntityKey] = useState("");
  const [columns, setColumns] = useState([]);
  const [filters, setFilters] = useState({});
  const [scope, setScope] = useState("all");
  const [orgIds, setOrgIds] = useState([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getCustomReportMeta(token)
      .then((m) => {
        setMeta(m);
        if (m.entities.length > 0) {
          setEntityKey(m.entities[0].key);
          setColumns(m.entities[0].defaultColumns);
        }
      })
      .catch((err) => setError(err.message));
    getAllOrganizations(token, { limit: 100 }).then((d) => setOrgs(d.organizations)).catch(() => {});
  }, []);

  const entity = meta?.entities.find((e) => e.key === entityKey);

  function changeEntity(key) {
    const next = meta.entities.find((e) => e.key === key);
    setEntityKey(key);
    setColumns(next.defaultColumns);
    setFilters({});
    setResult(null);
    setError("");
  }

  function toggle(list, setList, value) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  // Reload the org list / builder options and, if a report is showing, run it again for fresh rows.
  async function handleRefresh() {
    await Promise.all([
      getCustomReportMeta(token).then(setMeta).catch(() => {}),
      getAllOrganizations(token, { limit: 100 }).then((d) => setOrgs(d.organizations)).catch(() => {}),
    ]);
    if (result) await handleRun({ preventDefault() {} });
  }

  async function handleRun(e) {
    e.preventDefault();
    if (columns.length === 0) { setError("Select at least one column"); return; }
    if (scope === "selected" && orgIds.length === 0) { setError("Select at least one organization"); return; }
    setRunning(true);
    setError("");
    try {
      const data = await runCustomReport(token, {
        entity: entityKey,
        columns,
        filters,
        organization_ids: scope === "selected" ? orgIds : [],
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      setResult(data);
    } catch (err) {
      setResult(null);
      setError(err.message);
    } finally {
      setRunning(false);
    }
  }

  if (!meta) return error ? <p className="error-text">{error}</p> : <p>Loading...</p>;

  const headers = result ? result.columns.map((c) => c.label) : [];
  const rows = result ? result.rows.map((r) => result.columns.map((c) => formatCell(r[c.key]))) : [];
  const filenameBase = `custom-${entityKey}`;
  const labelStyle = { fontSize: "0.8rem", color: "var(--text-muted)", display: "block", margin: "0.8rem 0 0.3rem" };
  const checkStyle = { display: "inline-flex", alignItems: "center", gap: "0.3rem", marginRight: "1rem", fontSize: "0.85rem" };

  return (
    <div>
      <form onSubmit={handleRun} className="policy-panel" style={{ marginBottom: "1.5rem" }}>
        <label style={labelStyle}>Data source</label>
        <select value={entityKey} onChange={(e) => changeEntity(e.target.value)}>
          {meta.entities.map((en) => <option key={en.key} value={en.key}>{en.label}</option>)}
        </select>

        <label style={labelStyle}>Scope</label>
        <label style={checkStyle}><input type="radio" checked={scope === "all"} onChange={() => setScope("all")} /> All organizations</label>
        <label style={checkStyle}><input type="radio" checked={scope === "selected"} onChange={() => setScope("selected")} /> Selected organizations</label>
        {scope === "selected" && (
          <div style={{ marginTop: "0.5rem", maxHeight: "160px", overflowY: "auto" }}>
            {orgs.map((o) => (
              <label key={o.id} style={checkStyle}>
                <input type="checkbox" checked={orgIds.includes(o.id)} onChange={() => toggle(orgIds, setOrgIds, o.id)} /> {o.name}
              </label>
            ))}
          </div>
        )}

        <label style={labelStyle}>Columns</label>
        <div>
          {entity.columns.map((c) => (
            <label key={c.key} style={checkStyle}>
              <input type="checkbox" checked={columns.includes(c.key)} onChange={() => toggle(columns, setColumns, c.key)} /> {c.label}
            </label>
          ))}
        </div>

        {entity.filters.length > 0 && <label style={labelStyle}>Filters</label>}
        <div className="policy-form">
          {entity.filters.map((f) => (
            f.options ? (
              <select key={f.key} value={filters[f.key] || ""} onChange={(e) => setFilters({ ...filters, [f.key]: e.target.value })}>
                <option value="">{f.label}: any</option>
                {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input key={f.key} type="text" placeholder={f.label} value={filters[f.key] || ""} onChange={(e) => setFilters({ ...filters, [f.key]: e.target.value })} />
            )
          ))}
        </div>

        <label style={labelStyle}>Date range — {entity.dateLabel}</label>
        <div className="policy-form">
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>

        <div style={{ marginTop: "1rem" }}>
          <button type="submit" disabled={running}>{running ? "Running..." : "Run report"}</button>
          {" "}
          <RefreshButton onRefresh={handleRefresh} />
        </div>
        {error && <p className="error-text">{error}</p>}
      </form>

      {result && (
        <>
          <ReportTable section={{ title: `${entity.label} — preview`, headers, rows }} filenameBase={filenameBase} />
          {result.truncated && (
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Showing the first {result.limit} rows. Narrow the scope, filters or date range to see the rest.
            </p>
          )}
        </>
      )}
    </div>
  );
}

export function SuperAdminReportsView({ token }) {
  const [tab, setTab] = useState("platform");
  return (
    <section>
      <h2>Reports</h2>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.2rem" }}>
        <button type="button" className={tab === "platform" ? "" : "ghost-dark"} onClick={() => setTab("platform")}>Platform Reports</button>
        <button type="button" className={tab === "custom" ? "" : "ghost-dark"} onClick={() => setTab("custom")}>Custom Report Builder</button>
      </div>
      <ReportErrorBoundary key={tab}>
        {tab === "platform" ? <PlatformReports token={token} /> : <CustomReportBuilder token={token} />}
      </ReportErrorBoundary>
    </section>
  );
}
