// Modal: assign a policy to a device or a whole department.

import { useEffect, useState } from "react";
import { IconX } from "../../components/icons";
import { getDepartments } from "../departments/departmentService";
import { getDevices } from "../devices/deviceService";
import { assignPolicy, assignPolicyToDepartment } from "./policyService";

export function PolicyAssignModal({ policy, token, onClose, showToast }) {
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
        <button type="button" className="modal-close" aria-label="Close dialog" title="Close" onClick={() => onClose(false)}><IconX size={16} /></button>
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
