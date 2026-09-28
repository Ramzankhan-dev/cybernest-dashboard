// Policy assignment & compliance overview with force sync.

import { useEffect, useState } from "react";
import { KpiCard } from "../../components/common/KpiCard";
import { forceSyncDevice, getCompliance, getComplianceSummary } from "./complianceService";

export function ComplianceView({ token, organizationId, isSuperAdmin, showToast }) {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(null);

  function load() {
    setLoading(true);
    const params = { organization_id: organizationId, page, limit: 30 };
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    Promise.all([
      getCompliance(token, params),
      getComplianceSummary(token, organizationId),
    ])
      .then(([c, s]) => { setRows(c.compliance); setTotal(c.total); setSummary(s); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [page, statusFilter, organizationId]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    load();
  }

  async function handleForceSync(row) {
    setSyncing(row.device_uid);
    try {
      await forceSyncDevice(token, row.device_uid);
      showToast("Sync requested");
      load();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setSyncing(null);
    }
  }

  function badgeClass(status) {
    if (status === "Compliant") return "active";
    if (status === "Non-Compliant" || status === "Policy Failed") return "suspended";
    return "setup";
  }

  return (
    <section>
      <h2>Policy Assignment &amp; Compliance</h2>

      {summary && (
        <div className="kpi-grid" style={{ marginBottom: "1.2rem" }}>
          <KpiCard label="Total Devices" value={summary.total_devices} />
          <KpiCard label="Compliant" value={summary.compliant_devices} />
          <KpiCard label="Non-Compliant" value={summary.non_compliant_devices} />
          <KpiCard label="Pending Sync" value={summary.pending_sync} />
          <KpiCard label="Failed Policies" value={summary.failed_policies} />
          <KpiCard label="Compliance %" value={`${summary.compliance_percentage}%`} />
        </div>
      )}

      <form onSubmit={handleSearchSubmit} className="policy-form" style={{ marginBottom: "1rem" }}>
        <input type="text" placeholder="Search by device or employee..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="compliant">Compliant</option>
          <option value="non-compliant">Non-Compliant</option>
          <option value="pending-sync">Pending Sync</option>
          <option value="policy-failed">Policy Failed</option>
          <option value="unknown">Unknown</option>
        </select>
        <button type="submit">Search</button>
        <button type="button" className="ghost-dark" onClick={load}>Refresh</button>
      </form>

      {loading && <p>Loading...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && rows.length === 0 && <p className="empty-state">No devices with a policy assignment yet.</p>}
      {!loading && rows.length > 0 && (
        <div className="table-scroll"><table>
          <thead>
            <tr><th>Device</th><th>Employee</th><th>Department</th><th>Policy</th><th>Version</th><th>Status</th><th>Last Sync</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.model || r.device_uid}</td>
                <td>{r.assigned_employee_name || r.employee_name || "—"}</td>
                <td>{r.department_name || "—"}</td>
                <td>{r.policy_name || "—"}</td>
                <td>{r.policy_version || "—"}</td>
                <td><span className={`badge ${badgeClass(r.compliance_status)}`}>{r.compliance_status}</span></td>
                <td>{r.last_seen ? new Date(r.last_seen).toLocaleString() : "Never"}</td>
                <td className="actions">
                  <button disabled={syncing !== null} onClick={() => handleForceSync(r)}>{syncing === r.device_uid ? "Syncing..." : "Force Sync"}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}

      {total > 30 && (
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", justifyContent: "center" }}>
          <button className="ghost-dark" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Page {page} of {Math.ceil(total / 30)}</span>
          <button className="ghost-dark" disabled={page >= Math.ceil(total / 30)} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </section>
  );
}
