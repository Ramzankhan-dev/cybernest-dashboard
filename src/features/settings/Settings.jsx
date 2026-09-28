// System settings, appearance, and system health.

import { useEffect, useState } from "react";
import { ThemeSegmented } from "../../components/common/ThemeToggle";
import { getDepartments } from "../departments/departmentService";
import { getSettings, getSystemHealth, resetSettings, updateSettings } from "./settingsService";

export function SettingsView({ token, organizationId, policies, showToast }) {
  const [settings, setSettings] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([
      getSettings(token, organizationId),
      getDepartments(token, { organization_id: organizationId, limit: 100 }),
      getSystemHealth(token),
    ])
      .then(([s, d, h]) => { setSettings(s); setDepartments(d.departments); setHealth(h); })
      .catch((err) => showToast(err.message, true))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [organizationId]);

  function set(field, value) { setSettings({ ...settings, [field]: value }); }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await updateSettings(token, settings);
      setSettings(data.settings);
      showToast("Settings saved");
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (!window.confirm("Restore all settings to their defaults?")) return;
    try {
      const data = await resetSettings(token);
      setSettings(data.settings);
      showToast("Settings restored to defaults");
    } catch (err) {
      showToast(err.message, true);
    }
  }

  if (loading || !settings) return <section><h2>Settings</h2><p>Loading...</p></section>;

  return (
    <section>
      <h2>System Settings</h2>

      <div className="policy-panel" style={{ marginBottom: "1.5rem" }}>
        <div className="appearance-row">
          <div>
            <h3 style={{ fontSize: "0.95rem", margin: 0 }}>Appearance</h3>
            <p>Choose the dashboard theme. Your choice is saved on this browser.</p>
          </div>
          <ThemeSegmented />
        </div>
      </div>

      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1.2rem" }}>
        Organization name & branding are managed under <strong>Organization</strong>. API keys are under <strong>Profile</strong>.
      </p>

      <form onSubmit={handleSave}>
        <div className="policy-panel" style={{ marginBottom: "1.2rem" }}>
          <h3 style={{ fontSize: "0.9rem", marginBottom: "0.6rem" }}>General</h3>
          <div className="policy-form">
            <select value={settings.time_zone} onChange={(e) => set("time_zone", e.target.value)}>
              <option value="Asia/Karachi">Asia/Karachi</option>
              <option value="UTC">UTC</option>
              <option value="Asia/Dubai">Asia/Dubai</option>
              <option value="America/New_York">America/New_York</option>
            </select>
            <select value={settings.date_format} onChange={(e) => set("date_format", e.target.value)}>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
        </div>

        <div className="policy-panel" style={{ marginBottom: "1.2rem" }}>
          <h3 style={{ fontSize: "0.9rem", marginBottom: "0.6rem" }}>Security</h3>
          <div className="policy-form">
            <label>Max failed login attempts:
              <input type="number" min="3" max="10" value={settings.max_failed_login_attempts} onChange={(e) => set("max_failed_login_attempts", parseInt(e.target.value))} style={{ marginLeft: "0.4rem", width: "70px" }} />
            </label>
            <label>Lockout duration (min):
              <input type="number" min="1" value={settings.lockout_duration_minutes} onChange={(e) => set("lockout_duration_minutes", parseInt(e.target.value))} style={{ marginLeft: "0.4rem", width: "70px" }} />
            </label>
            <label>Session timeout (days):
              <input type="number" min="1" max="30" value={settings.session_timeout_days} onChange={(e) => set("session_timeout_days", parseInt(e.target.value))} style={{ marginLeft: "0.4rem", width: "70px" }} />
            </label>
          </div>
          <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>Session timeout applies to newly issued logins — existing sessions keep their original expiry.</p>
        </div>

        <div className="policy-panel" style={{ marginBottom: "1.2rem" }}>
          <h3 style={{ fontSize: "0.9rem", marginBottom: "0.6rem" }}>Enrollment</h3>
          <div className="policy-form">
            <label>Default QR expiry (hours):
              <input type="number" min="1" value={settings.default_qr_expiry_hours} onChange={(e) => set("default_qr_expiry_hours", parseInt(e.target.value))} style={{ marginLeft: "0.4rem", width: "70px" }} />
            </label>
          </div>
          <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>Used when generating a QR code without picking a specific Enrollment Profile.</p>
        </div>

        <div className="policy-panel" style={{ marginBottom: "1.2rem" }}>
          <h3 style={{ fontSize: "0.9rem", marginBottom: "0.6rem" }}>Default Policy & Department</h3>
          <div className="policy-form">
            <select value={settings.default_policy_id || ""} onChange={(e) => set("default_policy_id", e.target.value || null)}>
              <option value="">No default policy</option>
              {policies.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={settings.default_department_id || ""} onChange={(e) => set("default_department_id", e.target.value || null)}>
              <option value="">No default department</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>

        <div className="policy-panel" style={{ marginBottom: "1.2rem" }}>
          <h3 style={{ fontSize: "0.9rem", marginBottom: "0.6rem" }}>Notifications</h3>
          <select value={settings.default_notification_priority} onChange={(e) => set("default_notification_priority", e.target.value)}>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
          <button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Settings"}</button>
          <button type="button" className="ghost-dark" onClick={handleReset}>Restore Defaults</button>
        </div>
      </form>

      <div className="policy-panel">
        <h3 style={{ fontSize: "0.9rem", marginBottom: "0.6rem" }}>About System — Health</h3>
        {health && (
          <div className="table-scroll"><table>
            <tbody>
              <tr><td>Database</td><td style={{ textAlign: "right" }}><span className={`badge ${health.database === "Healthy" ? "active" : "suspended"}`}>{health.database}</span></td></tr>
              <tr><td>API Server</td><td style={{ textAlign: "right" }}><span className="badge active">{health.api_server}</span></td></tr>
              <tr><td>Notification Service (FCM)</td><td style={{ textAlign: "right" }}><span className={`badge ${health.notification_service === "Connected" ? "active" : "suspended"}`}>{health.notification_service}</span></td></tr>
              <tr><td>Server Time</td><td style={{ textAlign: "right" }}>{new Date(health.server_time).toLocaleString()}</td></tr>
            </tbody>
          </table></div>
        )}
        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.6rem" }}>
          CyberNest MDM — Enrollment, Policy, Command, and Compliance modules are functional and covered elsewhere in this dashboard.
        </p>
      </div>
    </section>
  );
}
