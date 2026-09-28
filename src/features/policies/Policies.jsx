// Policies page: list, search, filter, and actions (edit, assign, duplicate, enable/disable, delete). Super Admin sees an organization picker first.

import { useEffect, useState } from "react";
import { getAllOrganizations } from "../organizations/organizationService";
import { PolicyAssignModal } from "./PolicyAssignment";
import { PolicyFormModal } from "./PolicyForm";
import {
  deletePolicy,
  duplicatePolicy,
  getPolicies,
  setPolicyStatus,
  unassignPolicyFromAll,
} from "./policyService";

export function PoliciesPageView({ token, organizationId, showToast, onGlobalRefresh, isSuperAdmin = false }) {
  const [policies, setPolicies] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [assigningPolicy, setAssigningPolicy] = useState(null);

  function load() {
    setLoading(true);
    const params = { organization_id: organizationId, page, limit: 20 };
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    if (sort) params.sort = sort;
    getPolicies(token, params)
      .then((data) => { setPolicies(data.policies); setTotal(data.total); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [page, statusFilter, sort, organizationId]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    load();
  }

  async function handleDuplicate(policy) {
    try {
      await duplicatePolicy(token, policy.id);
      showToast(`Duplicated "${policy.name}"`);
      load();
      onGlobalRefresh && onGlobalRefresh();
    } catch (err) {
      showToast(err.message, true);
    }
  }

  async function handleToggleStatus(policy) {
    try {
      await setPolicyStatus(token, policy.id, policy.status === "active" ? "disabled" : "active");
      load();
      onGlobalRefresh && onGlobalRefresh();
    } catch (err) {
      showToast(err.message, true);
    }
  }

  async function handleUnassign(policy) {
    if (!window.confirm(`Unassign "${policy.name}" from all devices? This will send unblock/reverse commands to each device (camera, wifi, kiosk, etc. as applicable) and clear the assignment.`)) return;
    try {
      const data = await unassignPolicyFromAll(token, policy.id);
      showToast(data.message);
      load();
      onGlobalRefresh && onGlobalRefresh();
    } catch (err) {
      showToast(err.message, true);
    }
  }

  async function handleDelete(policy) {
    if (!window.confirm(`Delete "${policy.name}"? Blocked if currently assigned.`)) return;
    try {
      await deletePolicy(token, policy.id);
      load();
      onGlobalRefresh && onGlobalRefresh();
    } catch (err) {
      if (err.message.toLowerCase().includes("assigned")) {
        if (window.confirm(`${err.message}\n\nUnassign it from all devices now and try deleting again?`)) {
          try {
            await unassignPolicyFromAll(token, policy.id);
            await deletePolicy(token, policy.id);
            load();
            onGlobalRefresh && onGlobalRefresh();
          } catch (err2) {
            showToast(err2.message, true);
          }
        }
      } else {
        showToast(err.message, true);
      }
    }
  }

  return (
    <section>
      <div className="dash-header-row">
        <h2 style={{ border: "none", margin: 0 }}>Policies</h2>
        {!isSuperAdmin && (
          <button onClick={() => { setEditingPolicy(null); setShowFormModal(true); }}>+ Create Policy</button>
        )}
      </div>

      <form onSubmit={handleSearchSubmit} className="policy-form" style={{ marginBottom: "1rem" }}>
        <input type="text" placeholder="Search policies..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="">Sort: Recently updated</option>
          <option value="name">Sort: Name</option>
        </select>
        <button type="submit">Search</button>
        <button type="button" className="ghost-dark" onClick={load}>Refresh</button>
      </form>

      {error && <p className="error-text">{error}</p>}
      {loading && <p>Loading...</p>}
      {!loading && policies.length === 0 && <p className="empty-state">No policies yet.</p>}
      {!loading && policies.length > 0 && (
        <div className="table-scroll"><table>
          <thead>
            <tr>
              <th>Name</th><th>Code</th><th>Description</th><th>Devices</th><th>Departments</th><th>Status</th><th>Last Updated</th>{!isSuperAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {policies.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td className="mono">{p.policy_code}</td>
                <td>{p.description || "—"}</td>
                <td>{p.assigned_devices_count}</td>
                <td>{p.assigned_departments_count}</td>
                <td><span className={`badge ${p.status === "active" ? "active" : "suspended"}`}>{p.status}</span></td>
                <td>{new Date(p.updated_at || p.created_at).toLocaleDateString()}</td>
                {!isSuperAdmin && (
                  <td className="actions">
                    <button onClick={() => { setEditingPolicy(p); setShowFormModal(true); }}>Edit</button>
                    <button onClick={() => setAssigningPolicy(p)}>Assign</button>
                    <button onClick={() => handleUnassign(p)}>Unassign All</button>
                    <button onClick={() => handleDuplicate(p)}>Duplicate</button>
                    <button onClick={() => handleToggleStatus(p)}>{p.status === "active" ? "Disable" : "Enable"}</button>
                    <button className="danger" onClick={() => handleDelete(p)}>Delete</button>
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

      {showFormModal && !isSuperAdmin && (
        <PolicyFormModal
          initial={editingPolicy}
          token={token}
          organizationId={organizationId}
          onClose={() => setShowFormModal(false)}
          onSaved={() => { setShowFormModal(false); load(); onGlobalRefresh && onGlobalRefresh(); }}
        />
      )}

      {assigningPolicy && !isSuperAdmin && (
        <PolicyAssignModal
          policy={assigningPolicy}
          token={token}
          showToast={showToast}
          onClose={(refresh) => { setAssigningPolicy(null); if (refresh) { load(); onGlobalRefresh && onGlobalRefresh(); } }}
        />
      )}
    </section>
  );
}

export function PoliciesOrgCardsView({ token, showToast, onGlobalRefresh }) {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrg, setSelectedOrg] = useState(null);

  useEffect(() => {
    getAllOrganizations(token, { limit: 100 }).then((data) => setOrgs(data.organizations)).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, []);

  if (selectedOrg) {
    return <PoliciesPageView token={token} organizationId={selectedOrg.id} showToast={showToast} onGlobalRefresh={onGlobalRefresh} isSuperAdmin />;
  }

  return (
    <section>
      <h2>Policies — Select an Organization</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && orgs.map((org) => (
        <div key={org.id} className="report-card" style={{ cursor: "pointer", marginBottom: "0.8rem" }} onClick={() => setSelectedOrg(org)}>
          <h4 style={{ margin: 0 }}>{org.name}</h4>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "0.3rem 0 0" }}>{org.code}</p>
        </div>
      ))}
    </section>
  );
}
