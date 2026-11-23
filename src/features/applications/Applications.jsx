// Applications page: one list of managed apps (each with its APK), install-to-device, install history.

import { useEffect, useState } from "react";
import { KpiCard } from "../../components/common/KpiCard";
import { ApplicationAssignModal } from "./ApplicationAssignment";
import { ApplicationFormModal } from "./ApplicationForm";
import { DeleteApplicationModal } from "./DeleteApplicationModal";
import { InstallApkModal } from "./InstallApkModal";
import {
  allowApplication,
  blockApplication,
  deleteApplication,
  getApplicationStats,
  getApplications,
  getInstallHistory,
} from "./applicationService";
import { formatDate, formatDateTime } from "../../utils/dateFormat";

export function ApplicationsView({ token, organizationId, showToast }) {
  const [apps, setApps] = useState([]);
  const [stats, setStats] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [assigningApp, setAssigningApp] = useState(null);
  const [installingApp, setInstallingApp] = useState(null);
  const [deletingApp, setDeletingApp] = useState(null);
  const [installHistory, setInstallHistory] = useState([]);

  function loadInstallHistory() {
    getInstallHistory(token, organizationId).then(setInstallHistory).catch(() => {});
  }

  useEffect(() => { loadInstallHistory(); }, [organizationId]);

  function load() {
    setLoading(true);
    const params = { organization_id: organizationId, page, limit: 20 };
    if (search) params.search = search;
    if (categoryFilter) params.category = categoryFilter;
    if (statusFilter) params.status = statusFilter;
    Promise.all([getApplications(token, params), getApplicationStats(token, organizationId)])
      .then(([a, s]) => { setApps(a.applications); setTotal(a.total); setStats(s); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [page, categoryFilter, statusFilter, organizationId]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    load();
  }

  async function handleToggleBlock(app) {
    try {
      if (app.status === "active") {
        const data = await blockApplication(token, app.id);
        showToast(`Blocked — ${data.devices_notified} device(s) notified`);
      } else {
        const data = await allowApplication(token, app.id);
        showToast(`Allowed — ${data.devices_notified} device(s) notified`);
      }
      load();
    } catch (err) {
      showToast(err.message, true);
    }
  }

  async function handleConfirmDelete() {
    try {
      const data = await deleteApplication(token, deletingApp.id);
      showToast(data.message);
      setDeletingApp(null);
      load();
      loadInstallHistory();
    } catch (err) {
      showToast(err.message, true);
    }
  }

  return (
    <section>
      <div className="dash-header-row">
        <h2 style={{ border: "none", margin: 0 }}>Applications</h2>
        <button onClick={() => { setEditingApp(null); setShowFormModal(true); }}>+ Add Application</button>
      </div>

      {stats && (
        <div className="kpi-grid" style={{ marginBottom: "1.2rem" }}>
          <KpiCard label="Total Applications" value={stats.total_applications} />
          <KpiCard label="Enterprise Apps" value={stats.enterprise_apps} />
          <KpiCard label="Public Apps" value={stats.public_apps} />
          <KpiCard label="Blocked Apps" value={stats.blocked_apps} />
          <KpiCard label="Installed Applications" value={stats.installed_applications} />
          <KpiCard label="Pending Installations" value={stats.pending_installations} />
        </div>
      )}

      <form onSubmit={handleSearchSubmit} className="policy-form" style={{ marginBottom: "1rem" }}>
        <input type="text" placeholder="Search applications..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
          <option value="">All categories</option>
          <option value="Enterprise">Enterprise</option>
          <option value="Public">Public</option>
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="active">Allowed</option>
          <option value="blocked">Blocked</option>
        </select>
        <button type="submit">Search</button>
        <button type="button" className="ghost-dark" onClick={load}>Refresh</button>
      </form>

      {loading && <p>Loading...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && apps.length === 0 && <p className="empty-state">No applications yet — click "+ Add Application" and upload an APK.</p>}
      {!loading && apps.length > 0 && (
        <div className="table-scroll"><table>
          <thead>
            <tr><th>Name</th><th>Package</th><th>Version</th><th>Category</th><th>Install Type</th><th>Size / Uploaded</th><th>Assigned</th><th>Installed</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {apps.map((a) => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td className="mono" style={{ fontSize: "0.75rem" }}>{a.package_name}</td>
                <td>{a.version || "—"}</td>
                <td>{a.category}</td>
                <td>{a.install_type}</td>
                <td>{a.package_id ? `${(a.file_size_bytes / 1024 / 1024).toFixed(1)} MB · ${formatDate(a.apk_uploaded_at)}` : "No APK"}</td>
                <td>{a.assigned_devices_count}</td>
                <td>{a.installed_count}</td>
                <td><span className={`badge ${a.status === "active" ? "active" : "suspended"}`}>{a.status === "active" ? "Allowed" : "Blocked"}</span></td>
                <td className="actions">
                  <button disabled={!a.package_id} title={a.package_id ? "" : "No APK uploaded — edit and attach one"} onClick={() => setInstallingApp(a)}>Install to Device</button>
                  <button onClick={() => { setEditingApp(a); setShowFormModal(true); }}>Edit</button>
                  <button onClick={() => setAssigningApp(a)}>Assign</button>
                  <button onClick={() => handleToggleBlock(a)}>{a.status === "active" ? "Block" : "Unblock"}</button>
                  <button className="danger" onClick={() => setDeletingApp(a)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}

      {total > 20 && (
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", justifyContent: "center" }}>
          <button className="ghost-dark" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Page {page} of {Math.ceil(total / 20)}</span>
          <button className="ghost-dark" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}

      <div className="dash-header-row" style={{ marginTop: "2rem" }}>
        <h2 style={{ border: "none", margin: 0 }}>Install History</h2>
        <button className="ghost-dark" onClick={loadInstallHistory}>Refresh</button>
      </div>
      {installHistory.length === 0 ? (
        <p className="empty-state">No installs recorded yet.</p>
      ) : (
        <div className="table-scroll"><table>
          <thead>
            <tr><th>App</th><th>Device</th><th>Installed By</th><th>When</th></tr>
          </thead>
          <tbody>
            {installHistory.map((h) => (
              <tr key={h.id}>
                <td>{h.app_name}{h.version_name ? ` (v${h.version_name})` : ""}</td>
                <td>{h.device_model || h.device_uid}</td>
                <td>{h.installed_by_name || "—"}</td>
                <td>{formatDateTime(h.installed_at)}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}

      {showFormModal && (
        <ApplicationFormModal
          initial={editingApp}
          token={token}
          organizationId={organizationId}
          onClose={() => setShowFormModal(false)}
          onSaved={(data) => { setShowFormModal(false); if (data && data.message) showToast(data.message); load(); }}
        />
      )}

      {assigningApp && (
        <ApplicationAssignModal
          app={assigningApp}
          token={token}
          organizationId={organizationId}
          showToast={showToast}
          onClose={(refresh) => { setAssigningApp(null); if (refresh) load(); }}
        />
      )}

      {deletingApp && (
        <DeleteApplicationModal app={deletingApp} onConfirm={handleConfirmDelete} onClose={() => setDeletingApp(null)} />
      )}

      {installingApp && (
        <InstallApkModal
          app={installingApp}
          token={token}
          organizationId={organizationId}
          showToast={showToast}
          onClose={(refresh) => { setInstallingApp(null); if (refresh) { load(); loadInstallHistory(); } }}
        />
      )}
    </section>
  );
}
