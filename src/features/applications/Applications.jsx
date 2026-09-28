// Applications page: managed apps, direct APK install, install history.

import { useEffect, useState } from "react";
import { KpiCard } from "../../components/common/KpiCard";
import { ApplicationAssignModal } from "./ApplicationAssignment";
import { ApplicationFormModal } from "./ApplicationForm";
import { InstallApkModal } from "./InstallApkModal";
import { UploadApkModal } from "./UploadApkModal";
import {
  allowApplication,
  blockApplication,
  deleteApkPackage,
  deleteApplication,
  getApkPackages,
  getApplicationStats,
  getApplications,
  getInstallHistory,
} from "./applicationService";

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
  const [apkPackages, setApkPackages] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [installingPkg, setInstallingPkg] = useState(null);
  const [installHistory, setInstallHistory] = useState([]);

  function loadApkPackages() {
    getApkPackages(token, organizationId).then(setApkPackages).catch(() => {});
  }
  function loadInstallHistory() {
    getInstallHistory(token, organizationId).then(setInstallHistory).catch(() => {});
  }

  useEffect(() => { loadApkPackages(); loadInstallHistory(); }, [organizationId]);

  async function handleDeletePkg(pkg) {
    if (!window.confirm(`Delete uploaded APK "${pkg.app_name}"?`)) return;
    try {
      await deleteApkPackage(token, pkg.id);
      loadApkPackages();
    } catch (err) {
      showToast(err.message, true);
    }
  }

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

  async function handleDelete(app) {
    if (!window.confirm(`Delete "${app.name}"?`)) return;
    try {
      await deleteApplication(token, app.id);
      load();
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
          <option value="Restricted">Restricted</option>
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
      {!loading && apps.length === 0 && <p className="empty-state">No applications registered yet.</p>}
      {!loading && apps.length > 0 && (
        <div className="table-scroll"><table>
          <thead>
            <tr><th>Name</th><th>Package</th><th>Version</th><th>Category</th><th>Install Type</th><th>Assigned</th><th>Installed</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {apps.map((a) => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td className="mono" style={{ fontSize: "0.75rem" }}>{a.package_name}</td>
                <td>{a.version || "—"}</td>
                <td>{a.category}</td>
                <td>{a.install_type}</td>
                <td>{a.assigned_devices_count}</td>
                <td>{a.installed_count}</td>
                <td><span className={`badge ${a.status === "active" ? "active" : "suspended"}`}>{a.status === "active" ? "Allowed" : "Blocked"}</span></td>
                <td className="actions">
                  <button onClick={() => { setEditingApp(a); setShowFormModal(true); }}>Edit</button>
                  <button onClick={() => setAssigningApp(a)}>Assign</button>
                  <button onClick={() => handleToggleBlock(a)}>{a.status === "active" ? "Block" : "Allow"}</button>
                  <button className="danger" onClick={() => handleDelete(a)}>Delete</button>
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
        <h2 style={{ border: "none", margin: 0 }}>Direct APK Install</h2>
        <button onClick={() => setShowUploadModal(true)}>+ Upload APK</button>
      </div>
      <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "0.3rem 0 1rem" }}>
        Upload an APK once, then push a silent install to any enrolled device — no Play Store or Managed Google Play needed.
      </p>
      {apkPackages.length === 0 ? (
        <p className="empty-state">No APKs uploaded yet.</p>
      ) : (
        <div className="table-scroll"><table>
          <thead>
            <tr><th>App</th><th>Package</th><th>Version</th><th>Size</th><th>Uploaded</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {apkPackages.map((pkg) => (
              <tr key={pkg.id}>
                <td>{pkg.app_name}</td>
                <td style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>{pkg.package_name}</td>
                <td>{pkg.version_name || "—"}</td>
                <td>{(pkg.file_size_bytes / 1024 / 1024).toFixed(1)} MB</td>
                <td>{new Date(pkg.uploaded_at).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => setInstallingPkg(pkg)}>Install to Device</button>
                  <button className="danger" onClick={() => handleDeletePkg(pkg)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
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
                <td>{new Date(h.installed_at).toLocaleString()}</td>
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
          onSaved={() => { setShowFormModal(false); load(); }}
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

      {showUploadModal && (
        <UploadApkModal
          token={token}
          organizationId={organizationId}
          showToast={showToast}
          onClose={(refresh) => { setShowUploadModal(false); if (refresh) loadApkPackages(); }}
        />
      )}

      {installingPkg && (
        <InstallApkModal
          pkg={installingPkg}
          token={token}
          organizationId={organizationId}
          showToast={showToast}
          onClose={(refresh) => { setInstallingPkg(null); if (refresh) { loadApkPackages(); loadInstallHistory(); } }}
        />
      )}
    </section>
  );
}
