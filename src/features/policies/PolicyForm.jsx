// Modal: create / edit a policy (restrictions, password, apps, kiosk, network, security).

import { useState } from "react";
import { IconX } from "../../components/icons";
import { createPolicy, updatePolicy } from "./policyService";

export function PolicyFormModal({ initial, token, organizationId, onClose, onSaved }) {
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
      <div className="modal-card" style={{ width: "100%", maxWidth: "560px" }} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" aria-label="Close dialog" title="Close" onClick={onClose}><IconX size={16} /></button>
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
