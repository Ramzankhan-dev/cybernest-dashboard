// Audit logs: filters, stats, export (CSV/PDF). Super Admin picks an organization first.

import { useEffect, useState } from "react";
import { KpiCard } from "../../components/common/KpiCard";
import { exportToCSV, exportToPDF } from "../../utils/exportUtils";
import { getAllOrganizations } from "../organizations/organizationService";
import { getAuditLogStats, getAuditLogs } from "./auditService";

// [Role Badge] - Module, used to label who performed each audit event.
// The backend attaches `role` (SuperAdmin / OrganizationAdmin /
// DepartmentManager, or null for system-generated events) and
// `department_name` (for Department Managers only) to every row.
export function auditModuleBadge(log) {
  let roleLabel;
  if (log.role === "SuperAdmin") roleLabel = "Super Admin";
  else if (log.role === "OrganizationAdmin") roleLabel = "Organization Admin";
  else if (log.role === "DepartmentManager") roleLabel = `Manager - ${log.department_name || "—"}`;
  else roleLabel = "System";
  return `[${roleLabel}] - ${log.module}`;
}

export function AuditLogsOrgCardsView({ token }) {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrg, setSelectedOrg] = useState(null);

  useEffect(() => {
    getAllOrganizations(token, { limit: 100 })
      .then((data) => setOrgs(data.organizations))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (selectedOrg) {
    return (
      <AuditLogsView
        token={token}
        organizationId={selectedOrg.id}
        onBack={() => setSelectedOrg(null)}
      />
    );
  }

  return (
    <section>
      <h2>Audit Logs — Select an Organization</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && orgs.length === 0 && <p className="empty-state">No organizations yet.</p>}
      {!loading && orgs.length > 0 && (
        <div className="report-grid">
          {orgs.map((org) => (
            <div key={org.id} className="report-card" style={{ cursor: "pointer" }} onClick={() => setSelectedOrg(org)}>
              <h4 style={{ margin: 0 }}>{org.name}</h4>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "0.3rem 0 0" }}>{org.code}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function AuditLogsView({ token, organizationId, onBack }) {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  function load() {
    setLoading(true);
    const params = { organization_id: organizationId, page, limit: 50 };
    if (search) params.search = search;
    if (moduleFilter) params.module = moduleFilter;
    if (statusFilter) params.status = statusFilter;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    Promise.all([getAuditLogs(token, params), getAuditLogStats(token, organizationId)])
      .then(([l, s]) => { setLogs(l.logs); setTotal(l.total); setModules(l.modules); setStats(s); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [page, moduleFilter, statusFilter, organizationId]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    load();
  }

  function statusBadgeClass(status) {
    if (status === "success") return "active";
    if (status === "failure") return "suspended";
    return "setup";
  }

  return (
    <section>
      <div className="dash-header-row">
        <h2 style={{ border: "none", margin: 0 }}>Audit logs</h2>
        {onBack && <button className="ghost-dark" onClick={onBack}>← Back to Organizations</button>}
      </div>

      {stats && (
        <div className="kpi-grid" style={{ marginBottom: "1.2rem" }}>
          <KpiCard label="Total Events" value={stats.total_events} />
          <KpiCard label="Login Events" value={stats.login_events} />
          <KpiCard label="Policy Changes" value={stats.policy_changes} />
          <KpiCard label="Commands Executed" value={stats.commands_executed} />
          <KpiCard label="Failed Operations" value={stats.failed_operations} />
          <KpiCard label="Critical Security Events" value={stats.critical_security_events} />
        </div>
      )}

      <form onSubmit={handleSearchSubmit} className="policy-form" style={{ marginBottom: "1rem" }}>
        <input type="text" placeholder="Search by user or action..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={moduleFilter} onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }}>
          <option value="">All modules</option>
          {modules.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="success">Success</option>
          <option value="failure">Failed</option>
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        <button type="submit">Filter</button>
        <button type="button" className="ghost-dark" onClick={load}>Refresh</button>
        <button
          type="button"
          className="ghost-dark"
          onClick={() => exportToCSV("audit-logs", ["Time", "User", "Module", "Action", "Status", "IP"], logs.map((l) => [new Date(l.created_at).toLocaleString(), l.user_name || l.user_email || "System", auditModuleBadge(l), l.action, l.status, l.ip_address || "—"]))}
        >
          Export CSV
        </button>
        <button
          type="button"
          className="ghost-dark"
          onClick={() => exportToPDF("audit-logs", "Audit Logs", ["Time", "User", "Module", "Action", "Status"], logs.map((l) => [new Date(l.created_at).toLocaleString(), l.user_name || l.user_email || "System", auditModuleBadge(l), l.action, l.status]))}
        >
          Export PDF
        </button>
      </form>

      {loading && <p>Loading...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && logs.length === 0 && <p className="empty-state">No audit events yet.</p>}
      {!loading && logs.length > 0 && (
        <div className="table-scroll"><table>
          <thead>
            <tr><th>Time</th><th>User</th><th>Module / Role</th><th>Action</th><th>Status</th><th>IP Address</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <>
                <tr key={l.id}>
                  <td>{new Date(l.created_at).toLocaleString()}</td>
                  <td>{l.user_name || l.user_email || "System"}</td>
                  <td>{auditModuleBadge(l)}</td>
                  <td>{l.action}</td>
                  <td><span className={`badge ${statusBadgeClass(l.status)}`}>{l.status}</span></td>
                  <td className="mono" style={{ fontSize: "0.72rem" }}>{l.ip_address || "—"}</td>
                  <td className="actions">
                    <button onClick={() => setExpandedId(expandedId === l.id ? null : l.id)}>
                      {expandedId === l.id ? "Hide" : "View"}
                    </button>
                  </td>
                </tr>
                {expandedId === l.id && (
                  <tr>
                    <td colSpan={7} style={{ background: "var(--bg-elevated)" }}>
                      <div style={{ padding: "0.6rem" }}>
                        <p style={{ margin: "0.2rem 0" }}><strong>Event ID:</strong> {l.id}</p>
                        <p style={{ margin: "0.2rem 0" }}><strong>Details:</strong> {l.details || "—"}</p>
                        <p style={{ margin: "0.2rem 0" }}><strong>Browser/Device:</strong> {l.browser_info || "—"}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table></div>
      )}

      {total > 50 && (
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", justifyContent: "center" }}>
          <button className="ghost-dark" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Page {page} of {Math.ceil(total / 50)}</span>
          <button className="ghost-dark" disabled={page >= Math.ceil(total / 50)} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </section>
  );
}
