// Departments: list / create / edit / delete, managers, policy assignment. Super Admin picks an organization first.

import { useEffect, useState } from "react";
import { getAllOrganizations } from "../organizations/organizationService";
import { createDepartment, deleteDepartment, getDepartments, updateDepartment } from "./departmentService";

export function DepartmentsOrgCardsView({ token, policies }) {
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
      <DepartmentsView
        token={token}
        policies={policies}
        organizationId={selectedOrg.id}
        onBack={() => setSelectedOrg(null)}
        user={{ role: "SuperAdmin", is_super_admin: true }}
      />
    );
  }

  return (
    <section>
      <h2>Departments — by Organization</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && orgs.length === 0 && <p className="empty-state">No organizations yet.</p>}
      {!loading && orgs.length > 0 && (
        <div className="report-grid">
          {orgs.map((org) => (
            <div key={org.id} className="report-card" style={{ cursor: "pointer" }} onClick={() => setSelectedOrg(org)}>
              <h4 style={{ margin: 0 }}>{org.name}</h4>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "0.3rem 0 0.8rem" }}>{org.code}</p>
              <div className="report-stat">{org.department_count}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>departments</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function DepartmentsView({ token, policies, organizationId, onBack, user }) {
  const isReadOnly = !!user?.is_super_admin;
  const [departments, setDepartments] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("");
  const [page, setPage] = useState(1);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [policyId, setPolicyId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  function load() {
    setLoading(true);
    const params = { page, limit: 20 };
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    if (sort) params.sort = sort;
    if (organizationId) params.organization_id = organizationId;
    getDepartments(token, params)
      .then((data) => { setDepartments(data.departments); setTotal(data.total); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [page, statusFilter, sort, organizationId]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    load();
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    setSaving(true);
    setError("");
    try {
      if (editingId) {
        await updateDepartment(token, editingId, { name: name.trim(), description, default_policy_id: policyId || null });
      } else {
        const payload = { name: name.trim(), code: code.trim().toUpperCase(), description, default_policy_id: policyId || null };
        if (organizationId) payload.organization_id = organizationId;
        await createDepartment(token, payload);
      }
      setName(""); setCode(""); setDescription(""); setPolicyId(""); setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(d) {
    setEditingId(d.id);
    setName(d.name);
    setCode(d.code);
    setDescription(d.description || "");
    setPolicyId(d.default_policy_id || "");
  }

  async function handleToggleStatus(d) {
    try {
      await updateDepartment(token, d.id, { status: d.status === "active" ? "disabled" : "active" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(d) {
    if (!window.confirm(`Delete "${d.name}"? Blocked if it still has employees.`)) return;
    try {
      await deleteDepartment(token, d.id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <div className="dash-header-row">
        <h2 style={{ border: "none", margin: 0 }}>Departments</h2>
        {onBack && <button className="ghost-dark" onClick={onBack}>← Back to Organizations</button>}
      </div>
      {!isReadOnly && (
        <div className="policy-panel" style={{ marginBottom: "1.5rem" }}>
          <form onSubmit={handleCreate} className="policy-form">
            <input type="text" placeholder="Department name, e.g. Sales" value={name} onChange={(e) => setName(e.target.value)} />
            {!editingId && (
              <input type="text" placeholder="Code, e.g. SALES01" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
            )}
            <input type="text" placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
            <select value={policyId} onChange={(e) => setPolicyId(e.target.value)}>
              <option value="">No default policy</option>
              {policies.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button type="submit" disabled={saving || !name.trim() || (!editingId && !code.trim())}>
              {saving ? "Saving..." : editingId ? "Update department" : "Create department"}
            </button>
            {editingId && (
              <button type="button" className="ghost-dark" onClick={() => { setEditingId(null); setName(""); setCode(""); setDescription(""); setPolicyId(""); }}>
                Cancel edit
              </button>
            )}
          </form>
          {error && <p className="error-text">{error}</p>}
        </div>
      )}

      <form onSubmit={handleSearchSubmit} className="policy-form" style={{ marginBottom: "1rem" }}>
        <input type="text" placeholder="Search departments..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="">Sort: Newest</option>
          <option value="name">Sort: Name</option>
          <option value="employee_count">Sort: Employees</option>
          <option value="device_count">Sort: Devices</option>
        </select>
        <button type="submit">Search</button>
      </form>

      {loading && <p>Loading...</p>}
      {!loading && departments.length === 0 && <p className="empty-state">No departments yet.</p>}
      {!loading && departments.length > 0 && (
        <div className="table-scroll"><table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Manager</th>
              <th>Default policy</th>
              <th>Employees</th>
              <th>Devices</th>
              <th>Online</th>
              <th>Status</th>
              {!isReadOnly && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {departments.map((d) => (
              <tr key={d.id}>
                <td>{d.name}</td>
                <td className="mono">{d.code}</td>
                <td>{d.manager_name || "—"}</td>
                <td>{d.policy_name || "—"}</td>
                <td>{d.employee_count}</td>
                <td>{d.device_count}</td>
                <td>{d.online_count}</td>
                <td><span className={`badge ${d.status === "active" ? "active" : "suspended"}`}>{d.status}</span></td>
                {!isReadOnly && (
                  <td className="actions">
                    <button onClick={() => startEdit(d)}>Edit</button>
                    <button onClick={() => handleToggleStatus(d)}>{d.status === "active" ? "Disable" : "Enable"}</button>
                    <button className="danger" onClick={() => handleDelete(d)}>Delete</button>
                  </td>
                )}
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
    </section>
  );
}
