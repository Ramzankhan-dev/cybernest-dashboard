// Devices in one department: enrollment (bulk enroll, profiles, QR), search, device cards, details.

import { useEffect, useState } from "react";
import { DeviceCard } from "./DeviceCard";
import { DeviceDetailsView } from "./DeviceDetails";
import { generateEnrollmentToken, getDevices } from "./deviceService";
import {
  createEnrollmentProfile,
  deleteEnrollmentProfile,
  getEnrollmentProfiles,
} from "./enrollmentService";

export function DevicesCardListView({ token, policies, organizationId, departmentId, departmentName, onBack, showToast, user }) {
  const canCreateDevices = user?.role === "OrganizationAdmin";
  const isReadOnly = !!user?.is_super_admin;
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [detailsDeviceUid, setDetailsDeviceUid] = useState(null);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [generatedUid, setGeneratedUid] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfilePolicyId, setNewProfilePolicyId] = useState("");
  const [newProfileExpiry, setNewProfileExpiry] = useState(24);
  const [newProfileRequireLogin, setNewProfileRequireLogin] = useState(false);

  function load(searchOverride) {
    setLoading(true);
    const params = { organization_id: organizationId, department_id: departmentId, limit: 200 };
    const s = searchOverride !== undefined ? searchOverride : search;
    if (s) params.search = s;
    getDevices(token, params)
      .then((data) => setDevices(data.devices))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  function loadProfiles() {
    getEnrollmentProfiles(token, organizationId).then(setProfiles).catch(() => {});
  }

  useEffect(() => { load(); loadProfiles(); }, [organizationId, departmentId]);

  async function handleGenerateToken(e) {
    e.preventDefault();
    try {
      const data = await generateEnrollmentToken(token, newDeviceName, selectedProfileId || null, departmentId || null);
      setGeneratedUid(data.device.device_uid);
      setNewDeviceName("");
      load();
    } catch (err) {
      showToast(err.message, true);
    }
  }

  async function handleCreateProfile(e) {
    e.preventDefault();
    if (!newProfileName.trim()) return;
    try {
      await createEnrollmentProfile(token, {
        name: newProfileName.trim(),
        organization_id: organizationId,
        default_policy_id: newProfilePolicyId || null,
        default_department_id: departmentId === "unassigned" ? null : departmentId,
        token_expiry_hours: newProfileExpiry,
        require_employee_login: newProfileRequireLogin,
      });
      setNewProfileName(""); setNewProfilePolicyId(""); setNewProfileExpiry(24); setNewProfileRequireLogin(false); setShowProfileForm(false);
      loadProfiles();
    } catch (err) {
      showToast(err.message, true);
    }
  }

  if (detailsDeviceUid) {
    return (
      <DeviceDetailsView
        device={devices.find((d) => d.device_uid === detailsDeviceUid)}
        token={token}
        policies={policies}
        onCommandSent={showToast}
        onClose={() => setDetailsDeviceUid(null)}
        readOnly={isReadOnly}
      />
    );
  }

  return (
    <section>
      <div className="dash-header-row">
        <h2 style={{ border: "none", margin: 0 }}>Devices — {departmentName}</h2>
        {onBack && <button className="ghost-dark" onClick={onBack}>← Back to Departments</button>}
      </div>

      {canCreateDevices && (
        <div className="policy-panel" style={{ marginBottom: "1.2rem" }}>
          <form onSubmit={handleGenerateToken} className="enroll-form">
            <input
              type="text"
              placeholder="Employee name (optional)"
              value={newDeviceName}
              onChange={(e) => setNewDeviceName(e.target.value)}
            />
            <select value={selectedProfileId} onChange={(e) => setSelectedProfileId(e.target.value)}>
              <option value="">No enrollment profile (24h token)</option>
              {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button type="submit">+ Bulk Enroll</button>
            <button type="button" className="ghost-dark" onClick={() => setShowProfileForm(!showProfileForm)}>
              {showProfileForm ? "Cancel" : "+ New Profile"}
            </button>
          </form>

          {showProfileForm && (
            <form onSubmit={handleCreateProfile} className="policy-form" style={{ marginTop: "0.8rem", borderTop: "1px solid var(--line)", paddingTop: "0.8rem" }}>
              <input type="text" placeholder="Profile name, e.g. Warehouse Devices" value={newProfileName} onChange={(e) => setNewProfileName(e.target.value)} />
              <select value={newProfilePolicyId} onChange={(e) => setNewProfilePolicyId(e.target.value)}>
                <option value="">No default policy</option>
                {policies.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input type="number" placeholder="Token expiry (hours)" value={newProfileExpiry} onChange={(e) => setNewProfileExpiry(e.target.value)} style={{ width: "140px" }} />
              <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem" }}>
                <input type="checkbox" checked={newProfileRequireLogin} onChange={(e) => setNewProfileRequireLogin(e.target.checked)} />
                Require Employee Login (SRS-A04)
              </label>
              <button type="submit">Save Profile</button>
            </form>
          )}

          {profiles.length > 0 && (
            <ul className="policy-list" style={{ marginTop: "0.8rem" }}>
              {profiles.map((p) => (
                <li key={p.id}>
                  <span><strong>{p.name}</strong> <span className="policy-flags">{p.policy_name ? `· ${p.policy_name}` : ""} · {p.token_expiry_hours}h expiry{p.require_employee_login ? " · Login required" : ""}</span></span>
                  <button className="danger" onClick={async () => {
                    if (!window.confirm(`Delete profile "${p.name}"?`)) return;
                    try { await deleteEnrollmentProfile(token, p.id); loadProfiles(); }
                    catch (err) { showToast(err.message, true); }
                  }}>Delete</button>
                </li>
              ))}
            </ul>
          )}

          {generatedUid && (
            <div className="generated-code">
              <p>Enrollment code: <span className="mono">{generatedUid}</span><br />Scan this QR in the CyberNest Agent app, or enter the code manually.</p>
              <img className="qr-image" src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${generatedUid}`} alt="Enrollment QR code" />
            </div>
          )}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); load(); }} className="policy-form" style={{ marginBottom: "1rem" }}>
        <input type="text" placeholder="Search by device, IMEI, or user..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <button type="submit">Filter</button>
      </form>

      {loading && <p>Loading...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && devices.length === 0 && <p className="empty-state">No devices in this department yet.</p>}
      {!loading && devices.length > 0 && (
        <div className="report-grid">
          {devices.map((d) => (
            <DeviceCard
              key={d.id}
              device={d}
              token={token}
              onView={setDetailsDeviceUid}
              onCommandSent={showToast}
              onRemoved={load}
              readOnly={isReadOnly}
            />
          ))}
        </div>
      )}
    </section>
  );
}
