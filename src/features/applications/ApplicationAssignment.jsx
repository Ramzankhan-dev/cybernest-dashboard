// Modal: assign an application to a device or department.

import { useEffect, useState } from "react";
import { IconX } from "../../components/icons";
import { getDepartments } from "../departments/departmentService";
import { getDevices } from "../devices/deviceService";
import { assignApplication } from "./applicationService";

export function ApplicationAssignModal({ app, token, organizationId, onClose, showToast }) {
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
        <button type="button" className="modal-close" aria-label="Close dialog" title="Close" onClick={() => onClose(false)}><IconX size={16} /></button>
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
