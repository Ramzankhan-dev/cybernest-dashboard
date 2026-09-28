// Organizations: Super Admin management view and the Org Admin's own organization view.

import { useEffect, useState } from "react";
import { OrgFormModal } from "./OrganizationForm";
import {
  deleteOrganization,
  getAllOrganizations,
  getMyOrganization,
  setOrganizationStatus,
} from "./organizationService";

export function OrganizationsAdminView({ token }) {
  const [orgs, setOrgs] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (sort) params.sort = sort;
      const data = await getAllOrganizations(token, params);
      setOrgs(data.organizations);
      setTotal(data.total);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page, statusFilter, sort]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    load();
  }

  async function handleStatusChange(org, newStatus) {
    try {
      await setOrganizationStatus(token, org.id, newStatus);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(org) {
    if (!window.confirm(`Delete "${org.name}"? This cannot be undone (blocked if it still has devices).`)) return;
    try {
      await deleteOrganization(token, org.id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <div className="dash-header-row">
        <h2 style={{ border: "none", margin: 0 }}>Organizations</h2>
        <button onClick={() => { setEditingOrg(null); setShowModal(true); }}>+ Create Organization</button>
      </div>

      <form onSubmit={handleSearchSubmit} className="policy-form" style={{ marginBottom: "1rem" }}>
        <input type="text" placeholder="Search organizations..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="inactive">Inactive</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="">Sort: Newest</option>
          <option value="name">Sort: Name</option>
          <option value="device_count">Sort: Device count</option>
          <option value="status">Sort: Status</option>
        </select>
        <button type="submit">Search</button>
        <button type="button" className="ghost-dark" onClick={load}>Refresh</button>
      </form>

      {error && <p className="error-text">{error}</p>}
      {loading && <p>Loading...</p>}
      {!loading && orgs.length === 0 && <p className="empty-state">No organizations found.</p>}

      {!loading && orgs.length > 0 && (
        <div className="report-grid">
          {orgs.map((org) => (
            <div key={org.id} className="report-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ margin: 0 }}>{org.name}</h4>
                <span className={`badge ${org.status === "active" ? "active" : org.status === "suspended" ? "suspended" : "setup"}`}>
                  {org.status}
                </span>
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "0.3rem 0 0.8rem" }}>
                {org.code} · {org.industry} · {org.country}
              </p>
              <div className="table-scroll"><table style={{ marginBottom: "0.8rem" }}>
                <tbody>
                  <tr><td>Departments</td><td style={{ textAlign: "right" }}>{org.department_count}</td></tr>
                  <tr><td>Employees</td><td style={{ textAlign: "right" }}>{org.employee_count}</td></tr>
                  <tr><td>Devices</td><td style={{ textAlign: "right" }}>{org.device_count}</td></tr>
                  <tr><td>Admin</td><td style={{ textAlign: "right" }}>{org.admin_name || "—"}</td></tr>
                </tbody>
              </table></div>
              <div className="actions">
                <button onClick={() => { setEditingOrg(org); setShowModal(true); }}>Edit</button>
                {org.status === "active" ? (
                  <button onClick={() => handleStatusChange(org, "suspended")}>Suspend</button>
                ) : (
                  <button onClick={() => handleStatusChange(org, "active")}>Activate</button>
                )}
                <button className="danger" onClick={() => handleDelete(org)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {total > 20 && (
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", justifyContent: "center" }}>
          <button className="ghost-dark" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Page {page} of {Math.ceil(total / 20)}</span>
          <button className="ghost-dark" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}

      {showModal && (
        <OrgFormModal
          initial={editingOrg}
          isEdit={!!editingOrg}
          token={token}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load(); }}
        />
      )}
    </section>
  );
}

export function OrganizationView({ token }) {
  const [org, setOrg] = useState(null);

  function load() {
    getMyOrganization(token).then((data) => setOrg(data)).catch(() => {});
  }

  useEffect(() => { load(); }, []);

  if (!org) return <section><h2>Organization</h2><p>Loading...</p></section>;

  return (
    <section>
      <div className="dash-header-row">
        <h2 style={{ border: "none", margin: 0 }}>{org.name}</h2>
      </div>
      <div className="policy-panel">
        <div className="report-grid">
          <div className="report-card"><h4>Total Devices</h4><div className="report-stat">{org.device_count}</div></div>
          <div className="report-card"><h4>Total Departments</h4><div className="report-stat">{org.department_count}</div></div>
          <div className="report-card"><h4>Total Managers</h4><div className="report-stat">{org.manager_count}</div></div>
          <div className="report-card"><h4>Total Employees</h4><div className="report-stat">{org.employee_count}</div></div>
        </div>
      </div>
    </section>
  );
}
