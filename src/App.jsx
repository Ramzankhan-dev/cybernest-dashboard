import { useState, useEffect } from "react";
import {
  login,
  forgotPassword,
  verifyOtp,
  resetPassword,
  getDevices,
  getDeviceStats,
  getCompliance,
  getComplianceSummary,
  forceSyncDevice,
  getApplications,
  getApplicationStats,
  createApplication,
  updateApplication,
  assignApplication,
  blockApplication,
  allowApplication,
  deleteApplication,
  assignDeviceToEmployee,
  unassignDevice,
  removeDevice,
  generateEnrollmentToken,
  sendCommand,
  getCommandHistory,
  sendCommandMulti,
  cancelCommand,
  retryCommand,
  getPolicies,
  createPolicy,
  updatePolicy,
  duplicatePolicy,
  setPolicyStatus,
  deletePolicy,
  assignPolicyToDepartment,
  assignPolicy,
  getInstalledApps,
  getActivityLogs,
  changePassword,
  generateApiKey,
  getApiKeys,
  sendNotification,
  getNotifications,
  getMyOrganization,
  updateMyOrganization,
  getAllOrganizations,
  createOrganization,
  updateOrganization,
  setOrganizationStatus,
  deleteOrganization,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getEmployees,
  createEmployee,
  updateEmployee,
  changeEmployeeDepartment,
  changeEmployeeRole,
  deleteEmployee,
  assignEmployeeDevice,
  setEmployeeStatus,
  getDashboardSummary,
  getDashboardCharts,
  getDashboardActivity,
  getDashboardAlerts,
  globalSearch,
} from "./api";
import { exportToCSV, exportToPDF } from "./exportUtils";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

// A device only counts as "online" if it checked in recently — heartbeats
// go out every 30s, so anything older than 90s (missed ~3 beats) means
// it's actually lost connection, not that it's currently reachable.
function isDeviceOnline(device) {
  if (!device.last_seen) return false;
  return Date.now() - new Date(device.last_seen).getTime() < 90_000;
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(email, password);
      onLogin(data.token, data.user, data.refreshToken);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (showForgot) {
    return (
      <div className="login-screen">
        <ForgotPasswordFlow onBackToLogin={() => setShowForgot(false)} />
      </div>
    );
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Cyber<span style={{color: "var(--teal)"}}>Nest</span></h1>
        <p className="subtitle">Sign in to manage your devices</p>

        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="error-text">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p className="forgot-link" onClick={() => setShowForgot(true)}>Forgot password?</p>
      </form>
    </div>
  );
}

function ForgotPasswordFlow({ onBackToLogin }) {
  const [step, setStep] = useState("email"); // email | otp | reset | done
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  async function handleSendOtp(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email);
      setStep("otp");
      setResendTimer(60);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await verifyOtp(email, otp);
      setStep("reset");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email, otp, password);
      setStep("done");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      className="login-card"
      onSubmit={step === "email" ? handleSendOtp : step === "otp" ? handleVerifyOtp : handleResetPassword}
    >
      <h1>Cyber<span style={{color: "var(--teal)"}}>Nest</span></h1>

      {step === "email" && (
        <>
          <p className="subtitle">Enter your registered email</p>
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </>
      )}

      {step === "otp" && (
        <>
          <p className="subtitle">Enter the 6-digit code sent to {email}</p>
          <label>Verification code</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            required
          />
          <p
            className="forgot-link"
            style={{ opacity: resendTimer > 0 ? 0.5 : 1, pointerEvents: resendTimer > 0 ? "none" : "auto" }}
            onClick={() => { if (resendTimer <= 0) handleSendOtp({ preventDefault: () => {} }); }}
          >
            {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend code"}
          </p>
        </>
      )}

      {step === "reset" && (
        <>
          <p className="subtitle">Choose a new password</p>
          <label>New password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <label>Confirm password</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
        </>
      )}

      {step === "done" && (
        <p className="subtitle">Password updated. You can now sign in with your new password.</p>
      )}

      {error && <p className="error-text">{error}</p>}

      {step !== "done" && (
        <button type="submit" disabled={loading}>
          {loading ? "Please wait..." : step === "email" ? "Send code" : step === "otp" ? "Verify code" : "Reset password"}
        </button>
      )}

      <p className="forgot-link" onClick={onBackToLogin}>
        {step === "done" ? "Back to login" : "Back to login"}
      </p>
    </form>
  );
}

function DeviceRow({ device, onViewDetails, token, onRemoved }) {
  const online = isDeviceOnline(device);
  const [removing, setRemoving] = useState(false);

  async function handleRemove() {
    if (!window.confirm(`Remove device "${device.employee_name || device.device_uid}"? This unenrolls it and clears all its policy associations.`)) return;
    setRemoving(true);
    try {
      await removeDevice(token, device.device_uid);
      onRemoved();
    } catch (err) {
      alert(err.message);
    } finally {
      setRemoving(false);
    }
  }

  return (
    <tr>
      <td>
        <span className={`status-dot ${online ? "online" : "pending"}`} />
        {device.assigned_employee_name || device.employee_name || "Unassigned"}
      </td>
      <td>{device.department_name || "—"}</td>
      <td className="mono">{device.device_uid}</td>
      <td>{device.model || "—"}</td>
      <td>{device.android_version || "—"}</td>
      <td>{device.battery_level != null ? `${device.battery_level}%` : "—"}</td>
      <td>{online ? "online" : "offline"}</td>
      <td className="actions">
        <button onClick={() => onViewDetails(device.device_uid)}>View details</button>
        <button className="danger" disabled={removing} onClick={handleRemove}>Remove</button>
      </td>
    </tr>
  );
}

function PolicyAssignModal({ policy, token, onClose, showToast }) {
  const [mode, setMode] = useState("device"); // device | department
  const [devices, setDevices] = useState([]);
  const [deviceUid, setDeviceUid] = useState("");
  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getDepartments(token, { organization_id: policy.organization_id, limit: 100 }).then((d) => setDepartments(d.departments)).catch(() => {});
    getDevices(token, { organization_id: policy.organization_id, limit: 200 }).then((d) => setDevices(d.devices)).catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (mode === "device") {
        if (!deviceUid.trim()) return;
        const data = await assignPolicy(token, policy.id, deviceUid.trim());
        showToast(`Policy applied — ${data.commands_sent.length} rule(s) sent`);
      } else {
        if (!departmentId) return;
        const data = await assignPolicyToDepartment(token, policy.id, departmentId);
        showToast(data.message);
      }
      onClose(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={() => onClose(false)}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>Assign "{policy.name}"</h3>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          <button type="button" className={mode === "device" ? "" : "ghost-dark"} onClick={() => setMode("device")}>📱 To Device</button>
          <button type="button" className={mode === "department" ? "" : "ghost-dark"} onClick={() => setMode("department")}>🏢 To Department</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          {mode === "device" ? (
            <>
              <label>Device</label>
              <select value={deviceUid} onChange={(e) => setDeviceUid(e.target.value)}>
                <option value="">Select device…</option>
                {devices.map((d) => (
                  <option key={d.id} value={d.device_uid}>
                    {d.model || d.device_uid} — {d.assigned_employee_name || d.employee_name || "Unassigned"}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <>
              <label>Department</label>
              <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                <option value="">Select department…</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </>
          )}
          {error && <p className="error-text">{error}</p>}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
            <button type="submit" disabled={saving}>{saving ? "Applying..." : "Apply"}</button>
            <button type="button" className="ghost-dark" onClick={() => onClose(false)}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PolicyFormModal({ initial, token, organizationId, onClose, onSaved }) {
  const blank = {
    name: "", policy_code: "", description: "",
    camera_blocked: false, bluetooth_blocked: false, wifi_restricted: false, usb_transfer_blocked: false,
    screenshot_blocked: false, usb_debugging_blocked: false, mobile_hotspot_blocked: false,
    airplane_mode_blocked: false, location_services_blocked: false, factory_reset_blocked: false,
    password_required: false, password_min_length: "", max_failed_attempts: "", auto_lock_timeout_minutes: "",
    blocked_apps: "", prevent_unknown_sources: false, prevent_play_store: false,
    root_detection_enabled: true, developer_options_disabled: false,
    vpn_required: false, mobile_data_restricted: false,
    kiosk_mode: false, kiosk_package: "", working_hours_start: "", working_hours_end: "",
  };
  const [form, setForm] = useState(initial ? { ...blank, ...initial } : blank);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(field, value) { setForm({ ...form, [field]: value }); }
  function checkbox(field, label) {
    return <label><input type="checkbox" checked={!!form[field]} onChange={(e) => set(field, e.target.checked)} /> {label}</label>;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, organization_id: organizationId };
      if (initial) await updatePolicy(token, initial.id, payload);
      else await createPolicy(token, payload);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ width: "560px" }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{initial ? "Edit Policy" : "Create Policy"}</h3>
        <form onSubmit={handleSubmit} className="modal-form">
          <label>Policy Name *</label>
          <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} required />

          {!initial && (
            <>
              <label>Policy Code * (e.g. SALES01)</label>
              <input type="text" value={form.policy_code} onChange={(e) => set("policy_code", e.target.value.toUpperCase())} required />
            </>
          )}

          <label>Description</label>
          <input type="text" value={form.description || ""} onChange={(e) => set("description", e.target.value)} />

          <p style={{ fontSize: "0.78rem", color: "var(--teal)", margin: "0.9rem 0 0.3rem", fontWeight: 600 }}>Device Restrictions</p>
          <div className="policy-checkbox-grid">
            {checkbox("camera_blocked", "Camera")}
            {checkbox("bluetooth_blocked", "Bluetooth")}
            {checkbox("wifi_restricted", "Wi-Fi config")}
            {checkbox("usb_transfer_blocked", "USB file transfer")}
            {checkbox("screenshot_blocked", "Screenshot")}
            {checkbox("usb_debugging_blocked", "USB debugging")}
            {checkbox("mobile_hotspot_blocked", "Mobile hotspot")}
            {checkbox("airplane_mode_blocked", "Airplane mode")}
            {checkbox("location_services_blocked", "Location services")}
            {checkbox("factory_reset_blocked", "Factory reset")}
          </div>

          <p style={{ fontSize: "0.78rem", color: "var(--teal)", margin: "0.9rem 0 0.3rem", fontWeight: 600 }}>Password Policy</p>
          <div className="policy-checkbox-grid">
            {checkbox("password_required", "Password required")}
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input type="number" placeholder="Min length" value={form.password_min_length} onChange={(e) => set("password_min_length", e.target.value)} />
            <input type="number" placeholder="Max failed attempts" value={form.max_failed_attempts} onChange={(e) => set("max_failed_attempts", e.target.value)} />
            <input type="number" placeholder="Auto-lock (minutes)" value={form.auto_lock_timeout_minutes} onChange={(e) => set("auto_lock_timeout_minutes", e.target.value)} />
          </div>

          <p style={{ fontSize: "0.78rem", color: "var(--teal)", margin: "0.9rem 0 0.3rem", fontWeight: 600 }}>Application Policy</p>
          <input type="text" placeholder="Blocked app packages, comma-separated" value={form.blocked_apps || ""} onChange={(e) => set("blocked_apps", e.target.value)} />
          <div className="policy-checkbox-grid">
            {checkbox("prevent_unknown_sources", "Prevent unknown sources")}
            {checkbox("prevent_play_store", "Prevent Play Store access")}
          </div>

          <p style={{ fontSize: "0.78rem", color: "var(--teal)", margin: "0.9rem 0 0.3rem", fontWeight: 600 }}>Kiosk Policy</p>
          <div className="policy-checkbox-grid">{checkbox("kiosk_mode", "Enable kiosk (single app) mode")}</div>
          <input type="text" placeholder="Kiosk target app package (blank = agent app)" value={form.kiosk_package || ""} onChange={(e) => set("kiosk_package", e.target.value)} />
          <label>Working hours (kiosk/camera/bluetooth auto-toggle)</label>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input type="time" value={form.working_hours_start || ""} onChange={(e) => set("working_hours_start", e.target.value)} />
            <span>–</span>
            <input type="time" value={form.working_hours_end || ""} onChange={(e) => set("working_hours_end", e.target.value)} />
          </div>

          <p style={{ fontSize: "0.78rem", color: "var(--teal)", margin: "0.9rem 0 0.3rem", fontWeight: 600 }}>Network Policy</p>
          <div className="policy-checkbox-grid">
            {checkbox("vpn_required", "VPN required")}
            {checkbox("mobile_data_restricted", "Restrict mobile data")}
          </div>
          <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: "0.2rem 0 0" }}>
            Note: VPN/proxy enforcement is recorded here but not yet wired to an on-device action.
          </p>

          <p style={{ fontSize: "0.78rem", color: "var(--teal)", margin: "0.9rem 0 0.3rem", fontWeight: 600 }}>Security Policy</p>
          <div className="policy-checkbox-grid">
            {checkbox("root_detection_enabled", "Root detection")}
            {checkbox("developer_options_disabled", "Disable developer options")}
          </div>

          {error && <p className="error-text">{error}</p>}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.2rem" }}>
            <button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Policy"}</button>
            <button type="button" className="ghost-dark" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PoliciesPageView({ token, organizationId, showToast }) {
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
    } catch (err) {
      showToast(err.message, true);
    }
  }

  async function handleToggleStatus(policy) {
    try {
      await setPolicyStatus(token, policy.id, policy.status === "active" ? "disabled" : "active");
      load();
    } catch (err) {
      showToast(err.message, true);
    }
  }

  async function handleDelete(policy) {
    if (!window.confirm(`Delete "${policy.name}"? Blocked if currently assigned.`)) return;
    try {
      await deletePolicy(token, policy.id);
      load();
    } catch (err) {
      showToast(err.message, true);
    }
  }

  return (
    <section>
      <div className="dash-header-row">
        <h2 style={{ border: "none", margin: 0 }}>Policies</h2>
        <button onClick={() => { setEditingPolicy(null); setShowFormModal(true); }}>+ Create Policy</button>
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
        <table>
          <thead>
            <tr>
              <th>Name</th><th>Code</th><th>Description</th><th>Devices</th><th>Departments</th><th>Status</th><th>Last Updated</th><th>Actions</th>
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
                <td className="actions">
                  <button onClick={() => { setEditingPolicy(p); setShowFormModal(true); }}>Edit</button>
                  <button onClick={() => setAssigningPolicy(p)}>Assign</button>
                  <button onClick={() => handleDuplicate(p)}>Duplicate</button>
                  <button onClick={() => handleToggleStatus(p)}>{p.status === "active" ? "Disable" : "Enable"}</button>
                  <button className="danger" onClick={() => handleDelete(p)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {total > 20 && (
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", justifyContent: "center" }}>
          <button className="ghost-dark" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Page {page} of {Math.ceil(total / 20)}</span>
          <button className="ghost-dark" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}

      {showFormModal && (
        <PolicyFormModal
          initial={editingPolicy}
          token={token}
          organizationId={organizationId}
          onClose={() => setShowFormModal(false)}
          onSaved={() => { setShowFormModal(false); load(); }}
        />
      )}

      {assigningPolicy && (
        <PolicyAssignModal
          policy={assigningPolicy}
          token={token}
          showToast={showToast}
          onClose={(refresh) => { setAssigningPolicy(null); if (refresh) load(); }}
        />
      )}
    </section>
  );
}

function PoliciesOrgCardsView({ token, showToast }) {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrg, setSelectedOrg] = useState(null);

  useEffect(() => {
    getAllOrganizations(token, { limit: 100 }).then((data) => setOrgs(data.organizations)).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, []);

  if (selectedOrg) {
    return <PoliciesPageView token={token} organizationId={selectedOrg.id} showToast={showToast} />;
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

function AppsPanel({ deviceUid, token, onClose, onCommandSent, embedded }) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [requesting, setRequesting] = useState(false);

  function loadApps() {
    setLoading(true);
    getInstalledApps(token, deviceUid)
      .then(setApps)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadApps();
  }, [deviceUid]);

  async function handleRequestUpdate() {
    setRequesting(true);
    try {
      await sendCommand(token, deviceUid, "list_apps");
      onCommandSent("Requested fresh app list from the device — wait a few seconds, then click Refresh list below.");
    } catch (err) {
      onCommandSent(`Failed: ${err.message}`, true);
    } finally {
      setRequesting(false);
    }
  }

  async function handleAppAction(commandType, packageName) {
    setActing(packageName + commandType);
    try {
      await sendCommand(token, deviceUid, commandType, packageName);
      onCommandSent(`${commandType} sent for ${packageName}`);
    } catch (err) {
      onCommandSent(`Failed: ${err.message}`, true);
    } finally {
      setActing(null);
    }
  }

  const body = (
    <>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <button className="ghost-dark" onClick={handleRequestUpdate} disabled={requesting}>
          {requesting ? "Requesting..." : "Request update from device"}
        </button>
        <button className="ghost-dark" onClick={loadApps}>Refresh list</button>
      </div>
      {loading && <p>Loading...</p>}
      {!loading && apps.length === 0 && (
        <p className="empty-state">
          No apps reported yet — click "Request update from device" first, wait a few seconds, then "Refresh list".
        </p>
      )}
      {!loading && apps.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>App</th>
              <th>Package</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {apps.map((app) => (
              <tr key={app.id}>
                <td>{app.app_name || "—"}</td>
                <td className="mono">{app.package_name}</td>
                <td>{app.status}</td>
                <td className="actions">
                  {app.status === "blocked" ? (
                    <button
                      disabled={acting !== null}
                      onClick={() => handleAppAction("unblock_app", app.package_name)}
                    >
                      {acting === app.package_name + "unblock_app" ? "..." : "Allow"}
                    </button>
                  ) : (
                    <button
                      disabled={acting !== null}
                      onClick={() => handleAppAction("block_app", app.package_name)}
                    >
                      {acting === app.package_name + "block_app" ? "..." : "Block"}
                    </button>
                  )}
                  <button
                    className="danger"
                    disabled={acting !== null}
                    onClick={() => handleAppAction("uninstall_app", app.package_name)}
                  >
                    {acting === app.package_name + "uninstall_app" ? "..." : "Uninstall"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );

  if (embedded) return body;

  return (
    <section className="history-panel">
      <div className="history-header">
        <h2 style={{ border: "none", margin: 0 }}>
          Installed apps — <span className="mono">{deviceUid}</span>
        </h2>
        <button className="ghost-dark" onClick={onClose}>Close</button>
      </div>
      {body}
    </section>
  );
}

function DeviceDetailsView({ device, token, policies, onCommandSent, onClose }) {
  const [tab, setTab] = useState("general");
  const [sending, setSending] = useState(null);
  const [appPackage, setAppPackage] = useState("");
  const [selectedPolicy, setSelectedPolicy] = useState("");

  async function handleCommand(commandType, packageName = null) {
    setSending(commandType);
    try {
      await sendCommand(token, device.device_uid, commandType, packageName);
      onCommandSent(`${commandType} sent to ${device.employee_name || device.device_uid}`);
    } catch (err) {
      onCommandSent(`Failed: ${err.message}`, true);
    } finally {
      setSending(null);
    }
  }

  async function handleWipe() {
    const confirmed = window.confirm(
      `⚠️ This will PERMANENTLY ERASE all data on "${device.employee_name || device.device_uid}". This cannot be undone. Continue?`
    );
    if (!confirmed) return;
    setSending("wipe");
    try {
      await sendCommand(token, device.device_uid, "wipe");
      onCommandSent(`Wipe command sent to ${device.employee_name || device.device_uid}`);
    } catch (err) {
      onCommandSent(`Failed: ${err.message}`, true);
    } finally {
      setSending(null);
    }
  }

  async function handleApplyPolicy() {
    if (!selectedPolicy) return;
    setSending("apply_policy");
    try {
      const data = await assignPolicy(token, selectedPolicy, device.device_uid);
      onCommandSent(`Policy applied (${data.commands_sent.length} rules)`);
    } catch (err) {
      onCommandSent(`Failed: ${err.message}`, true);
    } finally {
      setSending(null);
    }
  }

  return (
    <section className="details-panel">
      <div className="history-header">
        <h2 style={{ border: "none", margin: 0 }}>
          {device.employee_name || "Unassigned"} — <span className="mono">{device.device_uid}</span>
        </h2>
        <button className="ghost-dark" onClick={onClose}>Close</button>
      </div>

      <div className="tab-strip">
        {["general", "apps", "policy", "commands"].map((t) => (
          <button
            key={t}
            className={`tab-btn ${tab === t ? "active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <div>
          <table style={{ marginBottom: "1.2rem" }}>
            <tbody>
              <tr><td><strong>Manufacturer</strong></td><td>{device.manufacturer || "—"}</td></tr>
              <tr><td><strong>Model</strong></td><td>{device.model || "—"}</td></tr>
              <tr><td><strong>Device ID</strong></td><td className="mono">{device.device_identifier || "—"}</td></tr>
              <tr><td><strong>IMEI</strong></td><td className="mono">{device.imei || "—"}</td></tr>
              <tr><td><strong>Android version</strong></td><td>{device.android_version || "—"}</td></tr>
              <tr><td><strong>RAM</strong></td><td>{device.ram_gb != null ? `${device.ram_gb} GB` : "—"}</td></tr>
              <tr><td><strong>Storage</strong></td><td>{device.storage_used_gb != null ? `${device.storage_used_gb} / ${device.storage_total_gb} GB` : "—"}</td></tr>
              <tr><td><strong>Network</strong></td><td>{device.network_info || "—"}</td></tr>
              <tr><td><strong>Battery</strong></td><td>{device.battery_level != null ? `${device.battery_level}%` : "—"}</td></tr>
              <tr><td><strong>Status</strong></td><td>{isDeviceOnline(device) ? "online" : "offline"}</td></tr>
              <tr><td><strong>Last seen</strong></td><td>{device.last_seen ? new Date(device.last_seen).toLocaleString() : "—"}</td></tr>
              <tr><td><strong>Enrolled</strong></td><td>{device.enrolled_at ? new Date(device.enrolled_at).toLocaleString() : "—"}</td></tr>
            </tbody>
          </table>
          <div className="quick-actions">
            <button onClick={() => handleCommand("lock")} disabled={sending !== null}>Lock</button>
            <button onClick={() => handleCommand("ring")} disabled={sending !== null}>Ring</button>
            <button onClick={() => handleCommand("sync")} disabled={sending !== null}>Sync</button>
            <button className="danger" onClick={handleWipe} disabled={sending !== null}>Wipe</button>
          </div>
        </div>
      )}

      {tab === "apps" && (
        <AppsPanel deviceUid={device.device_uid} token={token} onCommandSent={onCommandSent} embedded />
      )}

      {tab === "policy" && (
        <div>
          <div className="app-block-label" style={{ marginBottom: "0.6rem" }}>Apply a saved policy:</div>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.2rem" }}>
            <select value={selectedPolicy} onChange={(e) => setSelectedPolicy(e.target.value)}>
              <option value="">Select a saved policy…</option>
              {policies.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button disabled={sending !== null || !selectedPolicy} onClick={handleApplyPolicy}>
              {sending === "apply_policy" ? "Applying..." : "Apply policy"}
            </button>
          </div>
          {policies.length > 0 && (
            <ul className="policy-list">
              {policies.map((p) => (
                <li key={p.id}>
                  <strong>{p.name}</strong>
                  <span className="policy-flags">
                    {p.camera_blocked && "Camera "}
                    {p.bluetooth_blocked && "Bluetooth "}
                    {p.wifi_restricted && "Wi-Fi "}
                    {p.usb_transfer_blocked && "USB "}
                    {p.kiosk_mode && "Kiosk "}
                    {p.working_hours_start && p.working_hours_end && `${p.working_hours_start.slice(0,5)}–${p.working_hours_end.slice(0,5)}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "commands" && (
        <div>
          <div className="quick-actions" style={{ marginBottom: "1.2rem" }}>
            <button onClick={() => handleCommand("block_camera")} disabled={sending !== null}>Block camera</button>
            <button onClick={() => handleCommand("unblock_camera")} disabled={sending !== null}>Unblock camera</button>
            <button onClick={() => handleCommand("block_bluetooth")} disabled={sending !== null}>Block Bluetooth</button>
            <button onClick={() => handleCommand("unblock_bluetooth")} disabled={sending !== null}>Unblock Bluetooth</button>
            <button onClick={() => handleCommand("lock")} disabled={sending !== null}>Lock</button>
            <button onClick={() => handleCommand("ring")} disabled={sending !== null}>Ring</button>
            <button onClick={() => handleCommand("sync")} disabled={sending !== null}>Sync</button>
            <button onClick={() => handleCommand("refresh_policy")} disabled={sending !== null}>Refresh Policy</button>
            <button onClick={() => handleCommand("restart")} disabled={sending !== null}>Restart</button>
            <button onClick={() => handleCommand("enable_kiosk", appPackage.trim() || null)} disabled={sending !== null}>Enable Kiosk</button>
            <button onClick={() => handleCommand("disable_kiosk")} disabled={sending !== null}>Disable Kiosk</button>
            <button className="danger" onClick={handleWipe} disabled={sending !== null}>Wipe</button>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.2rem" }}>
            <input
              type="text"
              placeholder="Package name — for app block/unblock, or Enable Kiosk target"
              value={appPackage}
              onChange={(e) => setAppPackage(e.target.value)}
            />
            <button disabled={sending !== null || !appPackage.trim()} onClick={() => handleCommand("block_app", appPackage.trim())}>Block app</button>
            <button disabled={sending !== null || !appPackage.trim()} onClick={() => handleCommand("unblock_app", appPackage.trim())}>Unblock app</button>
          </div>
          <h2 style={{ fontSize: "0.95rem" }}>Command history</h2>
          <HistoryPanel deviceUid={device.device_uid} token={token} embedded />
        </div>
      )}
    </section>
  );
}

function HistoryPanel({ deviceUid, token, onClose, embedded }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCommandHistory(token, deviceUid)
      .then(setHistory)
      .finally(() => setLoading(false));
  }, [deviceUid]);

  const content = (
    <>
      {loading && <p>Loading...</p>}
      {!loading && history.length === 0 && (
        <p className="empty-state">No commands sent to this device yet.</p>
      )}
      {!loading && history.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Command</th>
              <th>Status</th>
              <th>Issued at</th>
              <th>Executed at</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h) => (
              <tr key={h.id}>
                <td>{h.command_type}</td>
                <td>{h.status}</td>
                <td>{new Date(h.issued_at).toLocaleString()}</td>
                <td>{h.executed_at ? new Date(h.executed_at).toLocaleString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );

  if (embedded) return content;

  return (
    <section className="history-panel">
      <div className="history-header">
        <h2 style={{ border: "none", margin: 0 }}>
          Command history — <span className="mono">{deviceUid}</span>
        </h2>
        <button className="ghost-dark" onClick={onClose}>Close</button>
      </div>
      {content}
    </section>
  );
}

function ActivityLogsView({ token }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getActivityLogs(token, { limit: 200 })
      .then((data) => setLogs(data.commands))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <h2>Activity logs</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && logs.length === 0 && <p className="empty-state">No activity yet.</p>}
      {!loading && logs.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Admin</th>
              <th>Action</th>
              <th>Device</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td>{new Date(l.issued_at).toLocaleString()}</td>
                <td>{l.admin_name || "System"}</td>
                <td>{l.command_type}</td>
                <td>{l.employee_name || l.device_uid}</td>
                <td>{l.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function AlertsView({ devices }) {
  const alerts = [];

  devices.forEach((d) => {
    const name = d.employee_name || d.device_uid;
    if (d.battery_level != null && d.battery_level < 15) {
      alerts.push({
        key: `battery-${d.id}`,
        title: `Battery low — ${name}`,
        desc: `Device battery is at ${d.battery_level}%.`,
        time: d.last_seen ? new Date(d.last_seen).toLocaleString() : "—",
      });
    }
    if (d.last_seen && !isDeviceOnline(d)) {
      alerts.push({
        key: `offline-${d.id}`,
        title: `Device offline — ${name}`,
        desc: `No check-in since ${new Date(d.last_seen).toLocaleString()}.`,
        time: new Date(d.last_seen).toLocaleString(),
      });
    }
    if (d.is_rooted) {
      alerts.push({
        key: `root-${d.id}`,
        title: `Root access detected — ${name}`,
        desc: `Device flagged as rooted — this may bypass policy enforcement.`,
        time: d.last_seen ? new Date(d.last_seen).toLocaleString() : "—",
      });
    }
  });

  return (
    <section>
      <h2>Alerts {alerts.length > 0 && `· ${alerts.length} active`}</h2>
      {alerts.length === 0 && <p className="empty-state">No active alerts — everything looks normal.</p>}
      {alerts.map((a) => (
        <div key={a.key} className="alert-card">
          <div>
            <div className="alert-title">{a.title}</div>
            <div className="alert-desc">{a.desc}</div>
            <div className="alert-time">{a.time}</div>
          </div>
        </div>
      ))}
    </section>
  );
}

function ProfileView({ token, user }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState("");
  const [pwError, setPwError] = useState("");

  const [apiKeys, setApiKeys] = useState([]);
  const [newKey, setNewKey] = useState(null);
  const [keyLoading, setKeyLoading] = useState(false);

  function loadKeys() {
    getApiKeys(token).then(setApiKeys).catch(() => {});
  }

  useEffect(() => {
    loadKeys();
  }, []);

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwSaving(true);
    setPwMessage("");
    setPwError("");
    try {
      await changePassword(token, currentPassword, newPassword);
      setPwMessage("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwSaving(false);
    }
  }

  async function handleGenerateKey() {
    setKeyLoading(true);
    try {
      const data = await generateApiKey(token);
      setNewKey(data.key);
      loadKeys();
    } catch (err) {
      // silently ignore, keys list stays as-is
    } finally {
      setKeyLoading(false);
    }
  }

  return (
    <section>
      <h2>Admin profile</h2>
      <p style={{ marginBottom: "1.2rem", fontSize: "0.9rem" }}>
        <strong>{user.name}</strong> — <span className="mono">{user.email}</span>
      </p>

      <div className="policy-panel" style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ fontSize: "0.95rem", marginBottom: "0.8rem" }}>Change password</h3>
        <form onSubmit={handleChangePassword} className="policy-form">
          <input
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button type="submit" disabled={pwSaving || !currentPassword || !newPassword}>
            {pwSaving ? "Updating..." : "Update password"}
          </button>
        </form>
        {pwMessage && <p style={{ color: "var(--teal)", fontSize: "0.85rem", marginTop: "0.5rem" }}>{pwMessage}</p>}
        {pwError && <p className="error-text">{pwError}</p>}
      </div>

      <div className="policy-panel">
        <h3 style={{ fontSize: "0.95rem", marginBottom: "0.8rem" }}>API keys</h3>
        <button className="ghost-dark" onClick={handleGenerateKey} disabled={keyLoading}>
          {keyLoading ? "Generating..." : "+ Generate new key"}
        </button>
        {newKey && (
          <p className="generated-code" style={{ marginTop: "0.8rem" }}>
            New key (copy it now — it won't be shown again): <span className="mono">{newKey}</span>
          </p>
        )}
        {apiKeys.length > 0 && (
          <ul className="policy-list" style={{ marginTop: "1rem" }}>
            {apiKeys.map((k) => (
              <li key={k.id}>
                <span className="mono">{k.key_prefix}...</span>
                <span className="policy-flags">{new Date(k.created_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function NotificationCenterView({ token, devices }) {
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState(""); // "" = everyone, "dept:ID", "device:UID"
  const [departments, setDepartments] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);

  function loadSent() {
    getNotifications(token).then(setSent).catch(() => {}).finally(() => setLoading(false));
  }

  useEffect(() => {
    loadSent();
    getDepartments(token).then((data) => setDepartments(data.departments)).catch(() => {});
  }, []);

  async function handleSend(e) {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    setError("");
    try {
      let targetPayload = {};
      if (target.startsWith("dept:")) {
        targetPayload = { target_department_id: target.slice(5) };
      } else if (target.startsWith("device:")) {
        targetPayload = { target_device_uid: target.slice(7) };
      }
      await sendNotification(token, message.trim(), targetPayload);
      setMessage("");
      setTarget("");
      loadSent();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <section>
      <h2>Notification center</h2>
      <div className="policy-panel" style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ fontSize: "0.95rem", marginBottom: "0.8rem" }}>Send notification</h3>
        <form onSubmit={handleSend}>
          <textarea
            className="notif-textarea"
            placeholder="Write your message to employees..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.6rem" }}>
            <select value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="">Everyone</option>
              <optgroup label="Departments">
                {departments.map((d) => (
                  <option key={`dept-${d.id}`} value={`dept:${d.id}`}>{d.name}</option>
                ))}
              </optgroup>
              <optgroup label="Devices">
                {devices.map((d) => (
                  <option key={`device-${d.id}`} value={`device:${d.device_uid}`}>{d.employee_name || d.device_uid}</option>
                ))}
              </optgroup>
            </select>
            <button type="submit" disabled={sending || !message.trim()}>
              {sending ? "Sending..." : "Send notification"}
            </button>
          </div>
        </form>
        {error && <p className="error-text">{error}</p>}
      </div>

      <h3 style={{ fontSize: "0.95rem", marginBottom: "0.6rem" }}>Recently sent</h3>
      {loading && <p>Loading...</p>}
      {!loading && sent.length === 0 && <p className="empty-state">No notifications sent yet.</p>}
      {!loading && sent.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Message</th>
              <th>Target</th>
              <th>Devices reached</th>
              <th>Sent at</th>
            </tr>
          </thead>
          <tbody>
            {sent.map((n) => (
              <tr key={n.id}>
                <td>{n.message}</td>
                <td>{n.target_device_uid || n.department_name || "Everyone"}</td>
                <td>{n.device_count}</td>
                <td>{new Date(n.sent_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function ReportCard({ title, stat, headers, rows, filenameBase }) {
  return (
    <div className="report-card">
      <h4>{title}</h4>
      <div className="report-stat">{stat}</div>
      <div className="report-actions">
        <button onClick={() => exportToPDF(filenameBase, title, headers, rows)}>PDF</button>
        <button onClick={() => exportToCSV(filenameBase, headers, rows)}>Excel</button>
      </div>
    </div>
  );
}

function ReportsView({ devices, policies, token }) {
  const [logs, setLogs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    getActivityLogs(token).then(setLogs).catch(() => {});
    getDepartments(token).then((data) => setDepartments(data.departments)).catch(() => {});
    getEmployees(token).then(setEmployees).catch(() => {});
  }, []);

  // 1. Device Inventory
  const inventoryHeaders = ["Employee", "Device UID", "Model", "Manufacturer", "Android", "IMEI", "Battery %", "Status"];
  const inventoryRows = devices.map((d) => [
    d.employee_name || "Unassigned", d.device_uid, d.model || "—", d.manufacturer || "—",
    d.android_version || "—", d.imei || "—", d.battery_level ?? "—", isDeviceOnline(d) ? "online" : "offline",
  ]);

  // 2. Policy Report
  const policyHeaders = ["Name", "Camera", "Bluetooth", "Wi-Fi", "USB", "Kiosk", "Working hours"];
  const policyRows = policies.map((p) => [
    p.name,
    p.camera_blocked ? "Blocked" : "—",
    p.bluetooth_blocked ? "Blocked" : "—",
    p.wifi_restricted ? "Restricted" : "—",
    p.usb_transfer_blocked ? "Blocked" : "—",
    p.kiosk_mode ? (p.kiosk_package || "Agent app") : "—",
    p.working_hours_start && p.working_hours_end ? `${p.working_hours_start.slice(0,5)}–${p.working_hours_end.slice(0,5)}` : "—",
  ]);

  // 3. Security Report (reuses the same alert logic as the Alerts page)
  const securityRows = [];
  devices.forEach((d) => {
    const name = d.employee_name || d.device_uid;
    if (d.is_rooted) securityRows.push([name, "Root access detected", new Date(d.last_seen).toLocaleString()]);
    if (d.last_seen && !isDeviceOnline(d)) securityRows.push([name, "Device offline", new Date(d.last_seen).toLocaleString()]);
  });
  const securityHeaders = ["Device", "Issue", "Detected at"];

  // 4. Battery Health
  const batteryHeaders = ["Employee", "Device UID", "Battery %"];
  const batteryRows = devices.filter((d) => d.battery_level != null).map((d) => [d.employee_name || "Unassigned", d.device_uid, d.battery_level]);
  const avgBattery = batteryRows.length > 0 ? Math.round(batteryRows.reduce((sum, r) => sum + r[2], 0) / batteryRows.length) : "—";

  // 5. Storage Report
  const storageHeaders = ["Employee", "Device UID", "Used GB", "Total GB"];
  const storageRows = devices.filter((d) => d.storage_used_gb != null).map((d) => [d.employee_name || "Unassigned", d.device_uid, d.storage_used_gb, d.storage_total_gb]);

  // 6. Activity Report
  const activityHeaders = ["Time", "Admin", "Action", "Device", "Status"];
  const activityRows = logs.map((l) => [
    new Date(l.issued_at).toLocaleString(), l.admin_name || "System", l.command_type, l.employee_name || l.device_uid, l.status,
  ]);

  // 7. Department Usage
  const deptHeaders = ["Department", "Default policy", "Employees", "Devices assigned"];
  const deptRows = departments.map((d) => [d.name, d.policy_name || "—", d.employee_count, d.device_count]);

  // 8. Employee Report
  const employeeHeaders = ["Name", "Code", "Department", "Device", "Status"];
  const employeeRows = employees.map((e) => [
    e.name, e.employee_code || "—", e.department_name, e.device_uid ? (e.model || e.device_uid) : "Unassigned", e.status,
  ]);

  return (
    <section>
      <h2>Reports</h2>
      <div className="report-grid">
        <ReportCard title="Device Inventory" stat={`${devices.length} devices`} headers={inventoryHeaders} rows={inventoryRows} filenameBase="device-inventory" />
        <ReportCard title="Department Usage" stat={`${departments.length} departments`} headers={deptHeaders} rows={deptRows} filenameBase="department-usage" />
        <ReportCard title="Employee Report" stat={`${employees.length} employees`} headers={employeeHeaders} rows={employeeRows} filenameBase="employee-report" />
        <ReportCard title="Policy Report" stat={`${policies.length} policies`} headers={policyHeaders} rows={policyRows} filenameBase="policy-report" />
        <ReportCard title="Security Report" stat={`${securityRows.length} issues`} headers={securityHeaders} rows={securityRows} filenameBase="security-report" />
        <ReportCard title="Battery Health" stat={`Avg. ${avgBattery}%`} headers={batteryHeaders} rows={batteryRows} filenameBase="battery-health" />
        <ReportCard title="Storage Report" stat={`${storageRows.length} devices`} headers={storageHeaders} rows={storageRows} filenameBase="storage-report" />
        <ReportCard title="Activity Report" stat={`${logs.length} events`} headers={activityHeaders} rows={activityRows} filenameBase="activity-report" />
      </div>
    </section>
  );
}

function OrgFormModal({ initial, onClose, onSaved, token, isEdit }) {
  const [form, setForm] = useState(initial || {
    name: "", code: "", industry: "", email: "", contact_number: "", country: "", city: "", address: "",
    admin_name: "", admin_email: "", admin_password: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(field, value) { setForm({ ...form, [field]: value }); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (isEdit) {
        await updateOrganization(token, initial.id, form);
      } else {
        await createOrganization(token, form);
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{isEdit ? "Edit Organization" : "Create Organization"}</h3>
        <form onSubmit={handleSubmit} className="modal-form">
          <label>Organization Name *</label>
          <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} required />

          {!isEdit && (
            <>
              <label>Organization Code * (e.g. ACME001)</label>
              <input type="text" value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} required />
            </>
          )}

          <label>Industry *</label>
          <input type="text" value={form.industry} onChange={(e) => set("industry", e.target.value)} required />

          <label>Email *</label>
          <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />

          <label>Contact Number</label>
          <input type="text" value={form.contact_number} onChange={(e) => set("contact_number", e.target.value)} />

          <label>Country *</label>
          <input type="text" value={form.country} onChange={(e) => set("country", e.target.value)} required />

          <label>City</label>
          <input type="text" value={form.city} onChange={(e) => set("city", e.target.value)} />

          <label>Address</label>
          <input type="text" value={form.address} onChange={(e) => set("address", e.target.value)} />

          {!isEdit && (
            <>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "0.8rem 0 0.3rem" }}>
                Optional: create the first Organization Admin for this org now
              </p>
              <label>Admin Name</label>
              <input type="text" value={form.admin_name} onChange={(e) => set("admin_name", e.target.value)} />
              <label>Admin Email</label>
              <input type="email" value={form.admin_email} onChange={(e) => set("admin_email", e.target.value)} />
              <label>Admin Password</label>
              <input type="password" value={form.admin_password} onChange={(e) => set("admin_password", e.target.value)} />
            </>
          )}

          {error && <p className="error-text">{error}</p>}

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
            <button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
            <button type="button" className="ghost-dark" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function OrganizationsAdminView({ token }) {
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
              <table style={{ marginBottom: "0.8rem" }}>
                <tbody>
                  <tr><td>Departments</td><td style={{ textAlign: "right" }}>{org.department_count}</td></tr>
                  <tr><td>Employees</td><td style={{ textAlign: "right" }}>{org.employee_count}</td></tr>
                  <tr><td>Devices</td><td style={{ textAlign: "right" }}>{org.device_count}</td></tr>
                  <tr><td>Admin</td><td style={{ textAlign: "right" }}>{org.admin_name || "—"}</td></tr>
                </tbody>
              </table>
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

function OrganizationView({ token }) {
  const [org, setOrg] = useState(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function load() {
    getMyOrganization(token).then((data) => {
      setOrg(data);
      setName(data.name);
    }).catch(() => {});
  }

  useEffect(() => { load(); }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await updateMyOrganization(token, name);
      setMessage("Organization updated.");
      load();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!org) return <section><h2>Organization</h2><p>Loading...</p></section>;

  return (
    <section>
      <h2>Organization</h2>
      <div className="policy-panel">
        <form onSubmit={handleSave} className="policy-form">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
          <button type="submit" disabled={saving || !name.trim()}>
            {saving ? "Saving..." : "Save name"}
          </button>
        </form>
        {message && <p style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>{message}</p>}
        <div className="report-grid" style={{ marginTop: "1.2rem" }}>
          <div className="report-card"><h4>Departments</h4><div className="report-stat">{org.department_count}</div></div>
          <div className="report-card"><h4>Devices</h4><div className="report-stat">{org.device_count}</div></div>
          <div className="report-card"><h4>Admins</h4><div className="report-stat">{org.admin_count}</div></div>
        </div>
      </div>
    </section>
  );
}

function DepartmentsOrgCardsView({ token, policies }) {
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

function DepartmentsView({ token, policies, organizationId, onBack }) {
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
        <table>
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
              <th>Actions</th>
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
                <td className="actions">
                  <button onClick={() => startEdit(d)}>Edit</button>
                  <button onClick={() => handleToggleStatus(d)}>{d.status === "active" ? "Disable" : "Enable"}</button>
                  <button className="danger" onClick={() => handleDelete(d)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

function EmployeesOrgCardsView({ token }) {
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
      <EmployeesView
        token={token}
        organizationId={selectedOrg.id}
        onBack={() => setSelectedOrg(null)}
      />
    );
  }

  return (
    <section>
      <h2>Employees — by Organization</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && orgs.length === 0 && <p className="empty-state">No organizations yet.</p>}
      {!loading && orgs.length > 0 && (
        <div className="report-grid">
          {orgs.map((org) => (
            <div key={org.id} className="report-card" style={{ cursor: "pointer" }} onClick={() => setSelectedOrg(org)}>
              <h4 style={{ margin: 0 }}>{org.name}</h4>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "0.3rem 0 0.8rem" }}>
                {org.code} · Admin: {org.admin_name || "—"}
              </p>
              <div className="report-stat">{org.employee_count}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>employees</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function EmployeesView({ token, organizationId, onBack }) {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [sort, setSort] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [designation, setDesignation] = useState("");
  const [role, setRole] = useState("Employee");
  const [deptId, setDeptId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deviceInputs, setDeviceInputs] = useState({});
  const [availableDevices, setAvailableDevices] = useState([]);
  const [acting, setActing] = useState(null);

  function load() {
    const params = { page, limit: 20 };
    if (search) params.search = search;
    if (deptFilter) params.department_id = deptFilter;
    if (statusFilter) params.status = statusFilter;
    if (roleFilter) params.role = roleFilter;
    if (sort) params.sort = sort;
    if (organizationId) params.organization_id = organizationId;
    getEmployees(token, params).then((data) => { setEmployees(data.employees); setTotal(data.total); }).catch((err) => setError(err.message));
    const deptParams = organizationId ? { organization_id: organizationId, limit: 100 } : {};
    getDepartments(token, deptParams).then((data) => setDepartments(data.departments)).catch(() => {});
    // Devices with no employee attached yet — the only ones that make sense to assign
    getDevices(token, { organization_id: organizationId, department_id: "unassigned", limit: 200 })
      .then((data) => setAvailableDevices(data.devices))
      .catch(() => {});
  }

  useEffect(() => { load(); }, [page, deptFilter, statusFilter, roleFilter, sort, organizationId]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    load();
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !code.trim() || !email.trim() || !deptId) return;
    setSaving(true);
    setError("");
    try {
      await createEmployee(token, {
        first_name: firstName.trim(), last_name: lastName.trim(), employee_code: code.trim(),
        email: email.trim(), phone_number: phone.trim(), designation: designation.trim(),
        role, department_id: deptId,
      });
      setFirstName(""); setLastName(""); setCode(""); setEmail(""); setPhone(""); setDesignation(""); setRole("Employee"); setDeptId("");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAssignDevice(employeeId) {
    const deviceUid = (deviceInputs[employeeId] || "").trim();
    if (!deviceUid) return;
    setActing(employeeId);
    try {
      await assignEmployeeDevice(token, employeeId, deviceUid);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setActing(null);
    }
  }

  async function handleToggleStatus(employee) {
    setActing(employee.id);
    try {
      await setEmployeeStatus(token, employee.id, employee.status === "active" ? "suspended" : "active");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setActing(null);
    }
  }

  async function handleDepartmentChange(employee, newDeptId) {
    if (!newDeptId) return;
    setActing(employee.id);
    try {
      await changeEmployeeDepartment(token, employee.id, newDeptId);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setActing(null);
    }
  }

  async function handleRoleChange(employee, newRole) {
    setActing(employee.id);
    try {
      await changeEmployeeRole(token, employee.id, newRole);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setActing(null);
    }
  }

  async function handleDelete(employee) {
    if (!window.confirm(`Delete employee "${employee.name}"?`)) return;
    try {
      await deleteEmployee(token, employee.id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <div className="dash-header-row">
        <h2 style={{ border: "none", margin: 0 }}>Employees</h2>
        {onBack && <button className="ghost-dark" onClick={onBack}>← Back to Organizations</button>}
      </div>
      <div className="policy-panel" style={{ marginBottom: "1.5rem" }}>
        <form onSubmit={handleCreate} className="policy-form">
          <input type="text" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <input type="text" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          <input type="text" placeholder="Employee ID, e.g. EMP0001" value={code} onChange={(e) => setCode(e.target.value)} />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="text" placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <input type="text" placeholder="Designation (optional)" value={designation} onChange={(e) => setDesignation(e.target.value)} />
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="Employee">Employee</option>
            <option value="DepartmentManager">Department Manager</option>
            <option value="OrganizationAdmin">Organization Admin</option>
          </select>
          <select value={deptId} onChange={(e) => setDeptId(e.target.value)}>
            <option value="">Select department…</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <button type="submit" disabled={saving || !firstName.trim() || !lastName.trim() || !code.trim() || !email.trim() || !deptId}>
            {saving ? "Adding..." : "Add employee"}
          </button>
        </form>
        {error && <p className="error-text">{error}</p>}
      </div>

      <form onSubmit={handleSearchSubmit} className="policy-form" style={{ marginBottom: "1rem" }}>
        <input type="text" placeholder="Search employees..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}>
          <option value="">All departments</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
          <option value="">All roles</option>
          <option value="Employee">Employee</option>
          <option value="DepartmentManager">Department Manager</option>
          <option value="OrganizationAdmin">Organization Admin</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="">Sort: Newest</option>
          <option value="name">Sort: Name</option>
          <option value="department">Sort: Department</option>
        </select>
        <button type="submit">Search</button>
      </form>

      {employees.length === 0 && <p className="empty-state">No employees yet.</p>}
      {employees.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Department</th>
              <th>Role</th>
              <th>Device</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id}>
                <td className="mono">{e.employee_code}</td>
                <td>{e.name}{e.designation && <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{e.designation}</div>}</td>
                <td>{e.email || "—"}</td>
                <td>{e.phone_number || "—"}</td>
                <td>
                  <select value={e.department_id} disabled={acting !== null} onChange={(ev) => handleDepartmentChange(e, ev.target.value)}>
                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </td>
                <td>
                  <select value={e.role} disabled={acting !== null} onChange={(ev) => handleRoleChange(e, ev.target.value)}>
                    <option value="Employee">Employee</option>
                    <option value="DepartmentManager">Dept. Manager</option>
                    <option value="OrganizationAdmin">Org Admin</option>
                  </select>
                </td>
                <td>{e.device_uid ? `${e.model || e.device_uid}` : "Unassigned"}</td>
                <td><span className={`badge ${e.status === "active" ? "active" : "suspended"}`}>{e.status}</span></td>
                <td className="actions">
                  {!e.device_uid && (
                    <>
                      <select
                        style={{ width: "150px" }}
                        value={deviceInputs[e.id] || ""}
                        onChange={(ev) => setDeviceInputs({ ...deviceInputs, [e.id]: ev.target.value })}
                      >
                        <option value="">Select device…</option>
                        {availableDevices.map((d) => (
                          <option key={d.id} value={d.device_uid}>{d.model || d.device_uid} {d.imei ? `(${d.imei.slice(-4)})` : ""}</option>
                        ))}
                      </select>
                      <button disabled={acting !== null || !deviceInputs[e.id]} onClick={() => handleAssignDevice(e.id)}>Assign</button>
                    </>
                  )}
                  <button disabled={acting !== null} onClick={() => handleToggleStatus(e)}>
                    {e.status === "active" ? "Suspend" : "Reinstate"}
                  </button>
                  <button className="danger" disabled={acting !== null} onClick={() => handleDelete(e)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

const CHART_COLORS = ["#0F6E56", "#1D2A44", "#C99A3E", "#A63B2A", "#5F5E5A"];

function KpiCard({ label, value, onClick }) {
  return (
    <div className="kpi-card" onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  );
}

function DashboardOverview({ token, user, onNavigate }) {
  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState(null);
  const [activity, setActivity] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAll() {
    try {
      const [s, c, a, al] = await Promise.all([
        getDashboardSummary(token),
        getDashboardCharts(token),
        getDashboardActivity(token),
        getDashboardAlerts(token),
      ]);
      setSummary(s);
      setCharts(c);
      setActivity(a);
      setAlerts(al);
      setLastUpdated(new Date());
      setError("");
    } catch (err) {
      setError("Unable to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // FR-06: auto refresh every 60 seconds
    const interval = setInterval(loadAll, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <section><h2>Dashboard</h2><p>Loading dashboard...</p></section>;
  if (error) return <section><h2>Dashboard</h2><p className="error-text">{error}</p></section>;

  const deviceStatusData = charts ? [
    { name: "Online", value: charts.device_status.online },
    { name: "Offline", value: charts.device_status.offline },
  ] : [];
  const complianceData = charts ? [
    { name: "Compliant", value: charts.policy_compliance.compliant },
    { name: "Non-Compliant", value: charts.policy_compliance.non_compliant },
  ] : [];

  return (
    <section>
      <div className="dash-header-row">
        <div>
          <h2 style={{ border: "none", margin: 0 }}>Welcome back, {user.name}</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.2rem 0 0" }}>
            {lastUpdated && `Last updated ${lastUpdated.toLocaleTimeString()}`}
          </p>
        </div>
        <button className="ghost-dark" onClick={loadAll}>Refresh</button>
      </div>

      <div className="kpi-grid">
        <KpiCard label="Total Devices" value={summary.total_devices} onClick={() => onNavigate("devices")} />
        <KpiCard label="Online Devices" value={summary.online_devices} onClick={() => onNavigate("devices")} />
        <KpiCard label="Offline Devices" value={summary.offline_devices} onClick={() => onNavigate("devices")} />
        <KpiCard label="Active Policies" value={summary.active_policies} onClick={() => onNavigate("policies")} />
        <KpiCard label="Policy Violations" value={summary.policy_violations} onClick={() => onNavigate("alerts")} />
        <KpiCard label="Pending Commands" value={summary.pending_commands} onClick={() => onNavigate("activity")} />
        <KpiCard label="Today's Alerts" value={summary.todays_alerts} onClick={() => onNavigate("alerts")} />
        <KpiCard label="Organizations" value={summary.total_organizations} onClick={() => onNavigate("org")} />
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          <h4>Device Status</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={deviceStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                {deviceStatusData.map((entry, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h4>Policy Compliance</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={complianceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                {complianceData.map((entry, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h4>Android Versions</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={charts.android_versions}>
              <XAxis dataKey="version" fontSize={11} />
              <YAxis allowDecimals={false} fontSize={11} />
              <Tooltip />
              <Bar dataKey="count" fill="#0F6E56" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h4>Device Distribution (by Department)</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={charts.device_distribution}>
              <XAxis dataKey="department" fontSize={11} />
              <YAxis allowDecimals={false} fontSize={11} />
              <Tooltip />
              <Bar dataKey="count" fill="#1D2A44" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h4>Device Health</h4>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
            <div style={{ textAlign: "center" }}>
              <div className="report-stat" style={{ fontSize: "2rem" }}>{charts.device_health.avg_battery}%</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Average battery across fleet</div>
            </div>
          </div>
        </div>
      </div>

      <div className="dash-two-col">
        <div>
          <h3 style={{ fontSize: "0.95rem" }}>Recent Activities</h3>
          {activity.length === 0 && <p className="empty-state">No recent activity.</p>}
          {activity.length > 0 && (
            <table>
              <thead><tr><th>Time</th><th>Activity</th><th>Device</th></tr></thead>
              <tbody>
                {activity.map((a) => (
                  <tr key={a.id}>
                    <td>{new Date(a.issued_at).toLocaleTimeString()}</td>
                    <td>{a.command_type}</td>
                    <td>{a.employee_name || a.device_uid}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div>
          <h3 style={{ fontSize: "0.95rem" }}>Security Alerts</h3>
          {alerts.length === 0 && <p className="empty-state">No active alerts.</p>}
          {alerts.slice(0, 8).map((a, i) => (
            <div key={i} className="alert-card" style={{ marginBottom: "0.4rem" }}>
              <div>
                <div className="alert-title">{a.device}</div>
                <div className="alert-desc">{a.message}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <h3 style={{ fontSize: "0.95rem" }}>Quick Actions</h3>
      <div className="quick-actions">
        <button onClick={() => onNavigate("devices")}>➕ Enroll Device</button>
        <button onClick={() => onNavigate("employees")}>➕ Add Employee</button>
        <button onClick={() => onNavigate("departments")}>📜 Create Policy</button>
        <button onClick={() => onNavigate("notifications")}>📢 Send Notification</button>
        <button onClick={loadAll}>🔄 Refresh Dashboard</button>
        <button onClick={() => onNavigate("reports")}>📊 Generate Report</button>
      </div>
    </section>
  );
}

function DeviceCard({ device, token, onView, onCommandSent, onRemoved }) {
  const online = isDeviceOnline(device);
  const [sending, setSending] = useState(null);

  async function quickCommand(cmd) {
    setSending(cmd);
    try {
      await sendCommand(token, device.device_uid, cmd);
      onCommandSent(`${cmd} sent to ${device.model || device.device_uid}`);
    } catch (err) {
      onCommandSent(err.message, true);
    } finally {
      setSending(null);
    }
  }

  async function handleRemove() {
    if (!window.confirm(`Remove "${device.model || device.device_uid}"? This unenrolls it permanently.`)) return;
    try {
      await removeDevice(token, device.device_uid);
      onRemoved();
    } catch (err) {
      onCommandSent(err.message, true);
    }
  }

  return (
    <div className="report-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h4 style={{ margin: 0 }}>{device.model || "Unknown model"}</h4>
        <span className={`badge ${online ? "active" : "suspended"}`}>{online ? "ONLINE" : "OFFLINE"}</span>
      </div>
      <table style={{ marginTop: "0.6rem", marginBottom: "0.8rem" }}>
        <tbody>
          <tr><td>UID</td><td className="mono" style={{ textAlign: "right", fontSize: "0.72rem" }}>{device.device_uid}</td></tr>
          <tr><td>IMEI</td><td className="mono" style={{ textAlign: "right" }}>{device.imei || "—"}</td></tr>
          <tr><td>Android</td><td style={{ textAlign: "right" }}>{device.android_version || "—"}</td></tr>
          <tr><td>Battery</td><td style={{ textAlign: "right" }}>{device.battery_level != null ? `${device.battery_level}%` : "—"}</td></tr>
          <tr><td>User</td><td style={{ textAlign: "right" }}>{device.assigned_employee_name || device.employee_name || "Unassigned"}</td></tr>
        </tbody>
      </table>
      <div className="actions">
        <button onClick={() => onView(device.device_uid)}>View</button>
        <button className="danger" disabled={sending !== null} onClick={() => quickCommand("lock")}>
          {sending === "lock" ? "..." : "Lock"}
        </button>
        <button disabled={sending !== null} onClick={() => quickCommand("sync")}>
          {sending === "sync" ? "..." : "Sync"}
        </button>
        <button className="danger" onClick={handleRemove}>Remove</button>
      </div>
    </div>
  );
}

function DevicesCardListView({ token, policies, organizationId, departmentId, departmentName, onBack, showToast }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [detailsDeviceUid, setDetailsDeviceUid] = useState(null);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [generatedUid, setGeneratedUid] = useState(null);

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

  useEffect(() => { load(); }, [organizationId, departmentId]);

  async function handleGenerateToken(e) {
    e.preventDefault();
    try {
      const data = await generateEnrollmentToken(token, newDeviceName);
      setGeneratedUid(data.device.device_uid);
      setNewDeviceName("");
      load();
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
      />
    );
  }

  return (
    <section>
      <div className="dash-header-row">
        <h2 style={{ border: "none", margin: 0 }}>Devices — {departmentName}</h2>
        {onBack && <button className="ghost-dark" onClick={onBack}>← Back to Departments</button>}
      </div>

      <div className="policy-panel" style={{ marginBottom: "1.2rem" }}>
        <form onSubmit={handleGenerateToken} className="enroll-form">
          <input
            type="text"
            placeholder="Employee name (optional)"
            value={newDeviceName}
            onChange={(e) => setNewDeviceName(e.target.value)}
          />
          <button type="submit">+ Bulk Enroll</button>
        </form>
        {generatedUid && (
          <div className="generated-code">
            <p>Enrollment code: <span className="mono">{generatedUid}</span><br />Scan this QR in the CyberNest Agent app, or enter the code manually.</p>
            <img className="qr-image" src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${generatedUid}`} alt="Enrollment QR code" />
          </div>
        )}
      </div>

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
            />
          ))}
        </div>
      )}
    </section>
  );
}

function DevicesDeptCardsView({ token, policies, organizationId, onBack, showToast }) {
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

function DevicesOrgCardsView({ token, policies, showToast }) {
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

function CommandCenterView({ token, organizationId, isSuperAdmin, showToast }) {
  const [tab, setTab] = useState("pending");
  const [commands, setCommands] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [commandTypeFilter, setCommandTypeFilter] = useState("");
  const [devices, setDevices] = useState([]);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [newCommandType, setNewCommandType] = useState("sync");
  const [sending, setSending] = useState(false);
  const [acting, setActing] = useState(null);

  const [orgs, setOrgs] = useState([]);
  const [orgFilter, setOrgFilter] = useState(isSuperAdmin ? "" : organizationId);
  const [departments, setDepartments] = useState([]);
  const [deptFilter, setDeptFilter] = useState("all"); // "all" | department id

  function load() {
    setLoading(true);
    const params = { tab, page, limit: 30 };
    if (search) params.search = search;
    if (commandTypeFilter) params.command_type = commandTypeFilter;
    getActivityLogs(token, params)
      .then((data) => { setCommands(data.commands); setTotal(data.total); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [tab, page]);

  // Super Admin sees every organization to pick from first
  useEffect(() => {
    if (isSuperAdmin) {
      getAllOrganizations(token, { limit: 100 }).then((d) => setOrgs(d.organizations)).catch(() => {});
    }
  }, [isSuperAdmin]);

  // Departments for whichever org is currently selected
  useEffect(() => {
    const orgToUse = isSuperAdmin ? orgFilter : organizationId;
    if (!orgToUse) { setDepartments([]); return; }
    getDepartments(token, { organization_id: orgToUse, limit: 100 }).then((d) => setDepartments(d.departments)).catch(() => {});
    setDeptFilter("all");
  }, [orgFilter, organizationId, isSuperAdmin]);

  // Devices for the selected org + department ("all" = every device in that org)
  useEffect(() => {
    const orgToUse = isSuperAdmin ? orgFilter : organizationId;
    if (!orgToUse) { setDevices([]); return; }
    const params = { organization_id: orgToUse, limit: 200 };
    if (deptFilter !== "all") params.department_id = deptFilter;
    getDevices(token, params).then((d) => setDevices(d.devices)).catch(() => {});
  }, [orgFilter, deptFilter, organizationId, isSuperAdmin]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    load();
  }

  function toggleDeviceSelect(uid) {
    setSelectedDevices((prev) => prev.includes(uid) ? prev.filter((u) => u !== uid) : [...prev, uid]);
  }

  async function handleSendCommand(e) {
    e.preventDefault();
    if (selectedDevices.length === 0) {
      showToast("Select at least one device", true);
      return;
    }
    if (["wipe", "enable_kiosk"].includes(newCommandType) && !window.confirm(`This is a destructive/impactful command (${newCommandType}). Continue?`)) {
      return;
    }
    setSending(true);
    try {
      const data = await sendCommandMulti(token, selectedDevices, newCommandType);
      showToast(data.message);
      setSelectedDevices([]);
      load();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setSending(false);
    }
  }

  async function handleCancel(cmd) {
    setActing(cmd.id);
    try {
      await cancelCommand(token, cmd.id);
      load();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setActing(null);
    }
  }

  async function handleRetry(cmd) {
    setActing(cmd.id);
    try {
      await retryCommand(token, cmd.id);
      showToast("Command retried");
      load();
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setActing(null);
    }
  }

  function statusLabel(status) {
    if (status === "pending") return "Pending";
    if (status === "sent") return "Delivered";
    if (status === "executed") return "Completed";
    if (status === "failed") return "Failed";
    if (status === "cancelled") return "Cancelled";
    return status;
  }

  return (
    <section>
      <h2>Command Center</h2>

      <div className="policy-panel" style={{ marginBottom: "1.2rem" }}>
        <form onSubmit={handleSendCommand}>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.8rem" }}>
            {isSuperAdmin && (
              <select value={orgFilter} onChange={(e) => setOrgFilter(e.target.value)}>
                <option value="">Select organization…</option>
                {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            )}
            <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} disabled={isSuperAdmin && !orgFilter}>
              <option value="all">All Devices</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0 0 0.5rem" }}>Select device(s):</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.8rem", maxHeight: "120px", overflowY: "auto" }}>
            {devices.length === 0 && <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>No devices to show — pick an organization/department above.</p>}
            {devices.map((d) => (
              <label key={d.id} style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem", border: "1px solid var(--line)", padding: "0.3rem 0.6rem", borderRadius: "5px" }}>
                <input type="checkbox" checked={selectedDevices.includes(d.device_uid)} onChange={() => toggleDeviceSelect(d.device_uid)} />
                {d.model || d.device_uid} {d.assigned_employee_name ? `(${d.assigned_employee_name})` : ""}
                {isSuperAdmin && orgFilter && (
                  <span style={{ color: "var(--amber)", fontSize: "0.7rem" }}> · {orgs.find((o) => String(o.id) === String(orgFilter))?.name}</span>
                )}
                {d.department_name && <span style={{ color: "var(--teal)", fontSize: "0.7rem" }}> · {d.department_name}</span>}
              </label>
            ))}
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <select value={newCommandType} onChange={(e) => setNewCommandType(e.target.value)}>
              <option value="sync">Sync Device</option>
              <option value="lock">Lock Device</option>
              <option value="ring">Ring Device</option>
              <option value="restart">Restart Device</option>
              <option value="refresh_policy">Refresh Policy</option>
              <option value="list_apps">Request Device Info (Apps)</option>
              <option value="wipe">Factory Reset (destructive)</option>
            </select>
            <button type="submit" disabled={sending || selectedDevices.length === 0}>
              {sending ? "Sending..." : `Send to ${selectedDevices.length || 0} device(s)`}
            </button>
          </div>
        </form>
      </div>

      <div className="tab-strip">
        <button className={`tab-btn ${tab === "pending" ? "active" : ""}`} onClick={() => { setTab("pending"); setPage(1); }}>Pending</button>
        <button className={`tab-btn ${tab === "completed" ? "active" : ""}`} onClick={() => { setTab("completed"); setPage(1); }}>Completed</button>
        <button className={`tab-btn ${tab === "failed" ? "active" : ""}`} onClick={() => { setTab("failed"); setPage(1); }}>Failed</button>
      </div>

      <form onSubmit={handleSearchSubmit} className="policy-form" style={{ marginBottom: "1rem" }}>
        <input type="text" placeholder="Search by device or employee..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <input type="text" placeholder="Command type filter, e.g. lock" value={commandTypeFilter} onChange={(e) => setCommandTypeFilter(e.target.value)} />
        <button type="submit">Filter</button>
      </form>

      {loading && <p>Loading...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && commands.length === 0 && <p className="empty-state">No commands in this category.</p>}
      {!loading && commands.length > 0 && (
        <table>
          <thead>
            <tr><th>ID</th><th>Command</th><th>Device</th><th>Employee</th><th>Sent By</th><th>Sent Time</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {commands.map((c) => (
              <tr key={c.id}>
                <td className="mono">{c.id}</td>
                <td>{c.command_type}{c.retry_of && <span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}> (retry)</span>}</td>
                <td>{c.device_uid}</td>
                <td>{c.employee_full_name || c.employee_name || "—"}</td>
                <td>{c.admin_name || "System"}</td>
                <td>{new Date(c.issued_at).toLocaleString()}</td>
                <td>
                  <span className={`badge ${c.status === "executed" ? "active" : c.status === "failed" ? "suspended" : "setup"}`}>{statusLabel(c.status)}</span>
                  {c.error_message && <div style={{ fontSize: "0.7rem", color: "var(--danger)", marginTop: "0.2rem" }}>{c.error_message}</div>}
                </td>
                <td className="actions">
                  {c.status === "pending" && <button disabled={acting !== null} onClick={() => handleCancel(c)}>Cancel</button>}
                  {c.status === "failed" && <button disabled={acting !== null} onClick={() => handleRetry(c)}>Retry</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

function ComplianceView({ token, organizationId, isSuperAdmin, showToast }) {
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
        <table>
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
        </table>
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

function ApplicationFormModal({ initial, token, organizationId, onClose, onSaved }) {
  const [form, setForm] = useState(initial || { name: "", package_name: "", version: "", category: "Public", install_type: "Optional" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(field, value) { setForm({ ...form, [field]: value }); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (initial) await updateApplication(token, initial.id, form);
      else await createApplication(token, { ...form, organization_id: organizationId });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{initial ? "Edit Application" : "Add Application"}</h3>
        <form onSubmit={handleSubmit} className="modal-form">
          <label>Application Name *</label>
          <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} required />

          {!initial && (
            <>
              <label>Package Name * (e.g. com.whatsapp)</label>
              <input type="text" value={form.package_name} onChange={(e) => set("package_name", e.target.value)} required />
            </>
          )}

          <label>Version</label>
          <input type="text" value={form.version || ""} onChange={(e) => set("version", e.target.value)} />

          <label>Category</label>
          <select value={form.category} onChange={(e) => set("category", e.target.value)}>
            <option value="Enterprise">Enterprise</option>
            <option value="Public">Public</option>
            <option value="Restricted">Restricted</option>
          </select>

          <label>Install Type</label>
          <select value={form.install_type} onChange={(e) => set("install_type", e.target.value)}>
            <option value="Required">Required</option>
            <option value="Optional">Optional</option>
            <option value="Blocked">Blocked</option>
          </select>

          {error && <p className="error-text">{error}</p>}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
            <button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
            <button type="button" className="ghost-dark" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ApplicationAssignModal({ app, token, organizationId, onClose, showToast }) {
  const [mode, setMode] = useState("device");
  const [devices, setDevices] = useState([]);
  const [deviceUid, setDeviceUid] = useState("");
  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getDevices(token, { organization_id: organizationId, limit: 200 }).then((d) => setDevices(d.devices)).catch(() => {});
    getDepartments(token, { organization_id: organizationId, limit: 100 }).then((d) => setDepartments(d.departments)).catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const target = mode === "device" ? { device_uid: deviceUid } : { department_id: departmentId };
      const data = await assignApplication(token, app.id, target);
      showToast(data.message);
      onClose(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={() => onClose(false)}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>Assign "{app.name}"</h3>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          <button type="button" className={mode === "device" ? "" : "ghost-dark"} onClick={() => setMode("device")}>📱 To Device</button>
          <button type="button" className={mode === "department" ? "" : "ghost-dark"} onClick={() => setMode("department")}>🏢 To Department</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          {mode === "device" ? (
            <>
              <label>Device</label>
              <select value={deviceUid} onChange={(e) => setDeviceUid(e.target.value)}>
                <option value="">Select device…</option>
                {devices.map((d) => <option key={d.id} value={d.device_uid}>{d.model || d.device_uid}</option>)}
              </select>
            </>
          ) : (
            <>
              <label>Department</label>
              <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                <option value="">Select department…</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </>
          )}
          {app.category === "Restricted" && (
            <p style={{ fontSize: "0.7rem", color: "var(--amber)", margin: "0.5rem 0 0" }}>
              This is a Restricted app — assigning it will actively block it on the target device(s).
            </p>
          )}
          {error && <p className="error-text">{error}</p>}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
            <button type="submit" disabled={saving}>{saving ? "Assigning..." : "Assign"}</button>
            <button type="button" className="ghost-dark" onClick={() => onClose(false)}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ApplicationsView({ token, organizationId, showToast }) {
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
        <table>
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
        </table>
      )}

      {total > 20 && (
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", justifyContent: "center" }}>
          <button className="ghost-dark" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Page {page} of {Math.ceil(total / 20)}</span>
          <button className="ghost-dark" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(page + 1)}>Next</button>
        </div>
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
    </section>
  );
}

function Dashboard({ token, user, onLogout }) {
  const [page, setPage] = useState("overview");
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [generatedUid, setGeneratedUid] = useState(null);
  const [detailsDeviceUid, setDetailsDeviceUid] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);

  async function handleSearchChange(value) {
    setSearchQuery(value);
    if (!value.trim()) {
      setSearchResults(null);
      return;
    }
    try {
      const results = await globalSearch(token, value);
      setSearchResults(results);
    } catch (err) {
      // silent — search is a convenience feature
    }
  }

  async function loadPolicies() {
    try {
      const data = await getPolicies(token, { organization_id: user.organization_id, limit: 200 });
      setPolicies(data.policies);
    } catch (err) {
      // Non-critical — device list still works without policies
    }
  }

  const [deviceSearch, setDeviceSearch] = useState("");
  const [deviceStats, setDeviceStats] = useState(null);

  async function loadDevices(searchOverride) {
    setLoading(true);
    try {
      const params = { organization_id: user.organization_id, limit: 200 };
      const s = searchOverride !== undefined ? searchOverride : deviceSearch;
      if (s) params.search = s;
      const data = await getDevices(token, params);
      setDevices(data.devices);
      const stats = await getDeviceStats(token, user.organization_id);
      setDeviceStats(stats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleDeviceSearchSubmit(e) {
    e.preventDefault();
    loadDevices(deviceSearch);
  }

  useEffect(() => {
    loadDevices();
    loadPolicies();
  }, []);

  function showToast(message, isError = false) {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleGenerateToken(e) {
    e.preventDefault();
    try {
      const data = await generateEnrollmentToken(token, newDeviceName);
      setGeneratedUid(data.device.device_uid);
      setNewDeviceName("");
      loadDevices();
    } catch (err) {
      showToast(err.message, true);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1 className="sidebar-logo">Cyber<span style={{color: "var(--teal)"}}>Nest</span></h1>
        <nav className="sidebar-nav">
          <button className={page === "overview" ? "active" : ""} onClick={() => setPage("overview")}>📊 Dashboard</button>
          <button className={page === "org" ? "active" : ""} onClick={() => setPage("org")}>🏢 {user.is_super_admin ? "Organizations" : "Organization"}</button>
          <button className={page === "departments" ? "active" : ""} onClick={() => setPage("departments")}>🗂️ Departments</button>
          <button className={page === "employees" ? "active" : ""} onClick={() => setPage("employees")}>👤 Employees</button>
          <button className={page === "devices" ? "active" : ""} onClick={() => setPage("devices")}>📱 Devices</button>
          <button className={page === "policies" ? "active" : ""} onClick={() => setPage("policies")}>📜 Policies</button>
          <button className={page === "activity" ? "active" : ""} onClick={() => setPage("activity")}>📜 Activity Logs</button>
          <button className={page === "commands" ? "active" : ""} onClick={() => setPage("commands")}>⚡ Commands</button>
          <button className={page === "compliance" ? "active" : ""} onClick={() => setPage("compliance")}>✅ Compliance</button>
          <button className={page === "applications" ? "active" : ""} onClick={() => setPage("applications")}>📦 Applications</button>
          <button className={page === "alerts" ? "active" : ""} onClick={() => setPage("alerts")}>🚨 Alerts</button>
          <button className={page === "notifications" ? "active" : ""} onClick={() => setPage("notifications")}>📢 Notifications</button>
          <button className={page === "reports" ? "active" : ""} onClick={() => setPage("reports")}>📈 Reports</button>
          <button className={page === "profile" ? "active" : ""} onClick={() => setPage("profile")}>⚙️ Profile</button>
        </nav>
      </aside>

      <div className="main-area">
        <header className="top-header">
          <input
            type="text"
            className="global-search"
            placeholder="Search devices, employees, departments, policies..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          <div className="topbar-right">
            <span>{user.name}</span>
            <button className="ghost-dark" onClick={onLogout}>Sign out</button>
          </div>

          {searchResults && (
            <div className="search-results">
              {Object.entries(searchResults).every(([, v]) => v.length === 0) && (
                <div className="search-result-empty">No results</div>
              )}
              {Object.entries(searchResults).map(([type, items]) =>
                items.length > 0 ? (
                  <div key={type} className="search-result-group">
                    <div className="search-result-heading">{type}</div>
                    {items.map((item, i) => (
                      <div key={i} className="search-result-item">{item.name || item.employee_name || item.device_uid}</div>
                    ))}
                  </div>
                ) : null
              )}
            </div>
          )}
        </header>

      <main>
        {page === "overview" && <DashboardOverview token={token} user={user} onNavigate={setPage} />}
        {page === "org" && (user.is_super_admin ? <OrganizationsAdminView token={token} /> : <OrganizationView token={token} />)}
        {page === "departments" && (user.is_super_admin
          ? <DepartmentsOrgCardsView token={token} policies={policies} />
          : <DepartmentsView token={token} policies={policies} />)}
        {page === "employees" && (user.is_super_admin
          ? <EmployeesOrgCardsView token={token} />
          : <EmployeesView token={token} organizationId={user.organization_id} />)}
        {page === "activity" && <ActivityLogsView token={token} />}
        {page === "commands" && <CommandCenterView token={token} organizationId={user.organization_id} isSuperAdmin={user.is_super_admin} showToast={showToast} />}
        {page === "compliance" && <ComplianceView token={token} organizationId={user.organization_id} isSuperAdmin={user.is_super_admin} showToast={showToast} />}
        {page === "applications" && <ApplicationsView token={token} organizationId={user.organization_id} showToast={showToast} />}
        {page === "alerts" && <AlertsView devices={devices} />}
        {page === "profile" && <ProfileView token={token} user={user} />}
        {page === "notifications" && <NotificationCenterView token={token} devices={devices} />}
        {page === "reports" && <ReportsView devices={devices} policies={policies} token={token} />}

        {page === "devices" && (user.is_super_admin
          ? <DevicesOrgCardsView token={token} policies={policies} showToast={showToast} />
          : <DevicesDeptCardsView token={token} policies={policies} organizationId={user.organization_id} showToast={showToast} />)}
        {page === "policies" && (user.is_super_admin
          ? <PoliciesOrgCardsView token={token} showToast={showToast} />
          : <PoliciesPageView token={token} organizationId={user.organization_id} showToast={showToast} />)}
      </main>
      </div>

      {toast && (
        <div className={`toast ${toast.isError ? "toast-error" : ""}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);

  function handleLogin(newToken, newUser, newRefreshToken) {
    setToken(newToken);
    setUser(newUser);
    setRefreshToken(newRefreshToken);
  }

  function handleLogout() {
    setToken(null);
    setUser(null);
    setRefreshToken(null);
  }

  if (!token) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <Dashboard token={token} user={user} onLogout={handleLogout} />;
}
