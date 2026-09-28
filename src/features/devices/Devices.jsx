// Devices entry points: organization picker (Super Admin) -> department picker -> device list.

import { useEffect, useState } from "react";
import { getDepartments } from "../departments/departmentService";
import { getAllOrganizations } from "../organizations/organizationService";
import { DevicesCardListView } from "./DeviceList";
import { getDevices } from "./deviceService";

export function DevicesDeptCardsView({ token, policies, organizationId, onBack, showToast, user }) {
  const [departments, setDepartments] = useState([]);
  const [unassignedCount, setUnassignedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDept, setSelectedDept] = useState(null);

  useEffect(() => {
    getDepartments(token, { organization_id: organizationId, limit: 100 })
      .then((data) => setDepartments(data.departments))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    getDevices(token, { organization_id: organizationId, department_id: "unassigned", limit: 1 })
      .then((data) => setUnassignedCount(data.total))
      .catch(() => {});
  }, [organizationId]);

  if (selectedDept) {
    return (
      <DevicesCardListView
        token={token}
        policies={policies}
        organizationId={organizationId}
        departmentId={selectedDept.id}
        departmentName={selectedDept.name}
        onBack={() => setSelectedDept(null)}
        showToast={showToast}
        user={user}
      />
    );
  }

  return (
    <section>
      <div className="dash-header-row">
        <h2 style={{ border: "none", margin: 0 }}>Devices — Select a Department</h2>
        {onBack && <button className="ghost-dark" onClick={onBack}>← Back to Organizations</button>}
      </div>
      {loading && <p>Loading...</p>}
      {error && <p className="error-text">{error}</p>}
      <div className="report-grid">
        <div
          className="report-card"
          style={{ cursor: "pointer", borderColor: "var(--amber)" }}
          onClick={() => setSelectedDept({ id: "unassigned", name: "Unassigned Devices" })}
        >
          <h4 style={{ margin: 0 }}>⚠️ Unassigned Devices</h4>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "0.3rem 0 0.8rem" }}>Newly enrolled, no employee yet</p>
          <div className="report-stat" style={{ color: "var(--amber)" }}>{unassignedCount}</div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>devices</div>
        </div>
        {!loading && departments.map((d) => (
          <div key={d.id} className="report-card" style={{ cursor: "pointer" }} onClick={() => setSelectedDept(d)}>
            <h4 style={{ margin: 0 }}>{d.name}</h4>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "0.3rem 0 0.8rem" }}>{d.code}</p>
            <div className="report-stat">{d.device_count}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>devices</div>
          </div>
        ))}
      </div>
      {!loading && departments.length === 0 && <p className="empty-state" style={{ marginTop: "1rem" }}>No departments yet — create one first.</p>}
    </section>
  );
}

export function DevicesOrgCardsView({ token, policies, showToast, user }) {
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
      <DevicesDeptCardsView
        token={token}
        policies={policies}
        organizationId={selectedOrg.id}
        onBack={() => setSelectedOrg(null)}
        showToast={showToast}
        user={user}
      />
    );
  }

  return (
    <section>
      <h2>Devices — Select an Organization</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && orgs.length === 0 && <p className="empty-state">No organizations yet.</p>}
      {!loading && orgs.length > 0 && (
        <div className="report-grid">
          {orgs.map((org) => (
            <div key={org.id} className="report-card" style={{ cursor: "pointer" }} onClick={() => setSelectedOrg(org)}>
              <h4 style={{ margin: 0 }}>{org.name}</h4>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "0.3rem 0 0.8rem" }}>{org.code} · Admin: {org.admin_name || "—"}</p>
              <div className="report-stat">{org.device_count}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>devices</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
