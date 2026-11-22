// Modal: assign an application to one or more departments / specific devices,
// and see / remove the existing assignments.

import { useEffect, useState } from "react";
import { IconX } from "../../components/icons";
import { getDepartments } from "../departments/departmentService";
import { getDevices } from "../devices/deviceService";
import { isDeviceOnline } from "../devices/deviceUtils";
import { InstallProgress } from "./InstallProgress";
import { assignApplication, getApplicationAssignments, unassignApplication } from "./applicationService";

export function ApplicationAssignModal({ app, token, organizationId, onClose }) {
  const [tab, setTab] = useState("assign"); // "assign" | "assigned"
  const [changed, setChanged] = useState(false);

  // ----- Assign tab -----
  const [departments, setDepartments] = useState([]);
  const [allDevices, setAllDevices] = useState([]);
  const [selectedDepts, setSelectedDepts] = useState([]);          // department ids
  const [deptDevices, setDeptDevices] = useState({});              // { deptId: [devices] }
  const [selectedUids, setSelectedUids] = useState([]);            // device_uids to assign
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // ----- Assigned tab -----
  const [assigned, setAssigned] = useState([]);
  const [assignedLoading, setAssignedLoading] = useState(false);
  const [removeUids, setRemoveUids] = useState([]);
  const [removing, setRemoving] = useState(false);
  const [removeMsg, setRemoveMsg] = useState("");

  useEffect(() => {
    getDevices(token, { organization_id: organizationId, limit: 200 }).then((d) => setAllDevices(d.devices)).catch(() => {});
    getDepartments(token, { organization_id: organizationId, limit: 100 }).then((d) => setDepartments(d.departments)).catch(() => {});
  }, []);

  function loadAssigned() {
    setAssignedLoading(true);
    getApplicationAssignments(token, app.id)
      .then(setAssigned)
      .catch((err) => setRemoveMsg(err.message))
      .finally(() => setAssignedLoading(false));
  }
  useEffect(() => { if (tab === "assigned") loadAssigned(); }, [tab]);

  function toggle(list, setList, value) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function toggleDepartment(dept) {
    if (selectedDepts.includes(dept.id)) {
      // Deselecting a department also drops its devices from the selection.
      const uids = (deptDevices[dept.id] || []).map((d) => d.device_uid);
      setSelectedDepts(selectedDepts.filter((id) => id !== dept.id));
      setSelectedUids(selectedUids.filter((u) => !uids.includes(u)));
      return;
    }
    setSelectedDepts([...selectedDepts, dept.id]);
    try {
      const data = await getDevices(token, { organization_id: organizationId, department_id: dept.id, limit: 200 });
      setDeptDevices((prev) => ({ ...prev, [dept.id]: data.devices }));
      // A selected department starts with all of its devices ticked; untick to narrow it down.
      setSelectedUids((prev) => [...new Set([...prev, ...data.devices.map((d) => d.device_uid)])]);
    } catch (err) {
      setError(err.message);
    }
  }

  function setGroup(devices, checked) {
    const uids = devices.map((d) => d.device_uid);
    setSelectedUids(checked ? [...new Set([...selectedUids, ...uids])] : selectedUids.filter((u) => !uids.includes(u)));
  }

  async function handleAssign(e) {
    e.preventDefault();
    if (selectedUids.length === 0) { setError("Select at least one department or device"); return; }
    setSaving(true);
    setError("");
    try {
      const data = await assignApplication(token, app.id, { device_uids: selectedUids });
      setResult(data);
      setChanged(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUnassign(uids) {
    if (uids.length === 0) return;
    setRemoving(true);
    setRemoveMsg("");
    try {
      const data = await unassignApplication(token, app.id, { device_uids: uids });
      setRemoveMsg(data.message);
      setRemoveUids([]);
      setChanged(true);
      loadAssigned();
    } catch (err) {
      setRemoveMsg(err.message);
    } finally {
      setRemoving(false);
    }
  }

  function renderDevice(key, d, checked, onChange, extra) {
    const online = isDeviceOnline(d);
    return (
      <label key={key} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.45rem 0.7rem", borderBottom: "1px solid var(--border)", margin: 0, cursor: "pointer" }}>
        <input type="checkbox" checked={checked} onChange={onChange} style={{ width: "auto", margin: 0 }} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: "0.85rem" }}>{d.model || d.device_uid}</span>
          <span style={{ display: "block", fontSize: "0.7rem", color: "var(--text-muted)" }}>
            {d.employee_name || "Unassigned"} · {d.device_uid}
          </span>
        </span>
        {extra}
        {d.last_seen !== undefined && <span className={`badge ${online ? "active" : "setup"}`}>{online ? "Online" : "Offline"}</span>}
      </label>
    );
  }

  const q = search.trim().toLowerCase();
  const matches = (d) => !q || [d.model, d.employee_name, d.device_uid].some((v) => v && String(v).toLowerCase().includes(q));
  const groups = selectedDepts.length > 0
    ? selectedDepts.map((id) => ({ key: id, name: (departments.find((d) => d.id === id) || {}).name || "Department", devices: (deptDevices[id] || []).filter(matches) }))
    : [{ key: "all", name: "All devices", devices: allDevices.filter(matches) }];

  // Assigned tab grouped by department
  const assignedGroups = [];
  assigned.forEach((a) => {
    const name = a.department_name || "No department";
    let g = assignedGroups.find((x) => x.name === name);
    if (!g) { g = { name, rows: [] }; assignedGroups.push(g); }
    g.rows.push(a);
  });

  const box = { maxHeight: "240px", overflowY: "auto", border: "1px solid var(--border)", borderRadius: "8px", marginTop: "0.4rem" };

  return (
    <div className="modal-overlay" onClick={() => onClose(changed)}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "560px", width: "100%" }}>
        <button type="button" className="modal-close" aria-label="Close dialog" title="Close" onClick={() => onClose(changed)}><IconX size={16} /></button>
        <h3 style={{ marginTop: 0 }}>Assign "{app.name}"</h3>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          <button type="button" className={tab === "assign" ? "" : "ghost-dark"} onClick={() => setTab("assign")}>Assign</button>
          <button type="button" className={tab === "assigned" ? "" : "ghost-dark"} onClick={() => setTab("assigned")}>Assigned ({app.assigned_devices_count ?? assigned.length})</button>
        </div>

        {tab === "assign" && (
          <form onSubmit={handleAssign} className="modal-form">
            <label>Departments (select one or more)</label>
            <div style={box}>
              {departments.length === 0 && <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "0.8rem", textAlign: "center" }}>No departments.</p>}
              {departments.map((d) => (
                <label key={d.id} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.45rem 0.7rem", borderBottom: "1px solid var(--border)", margin: 0, cursor: "pointer" }}>
                  <input type="checkbox" checked={selectedDepts.includes(d.id)} onChange={() => toggleDepartment(d)} disabled={!!result} style={{ width: "auto", margin: 0 }} />
                  <span style={{ fontSize: "0.85rem" }}>{d.name}</span>
                </label>
              ))}
            </div>

            <label style={{ marginTop: "0.8rem" }}>
              Devices {selectedDepts.length > 0 ? "in the selected departments" : "(or pick individual devices)"} — {selectedUids.length} selected
            </label>
            <input type="text" placeholder="Search devices…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <div style={box}>
              {groups.every((g) => g.devices.length === 0) && (
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "0.8rem", textAlign: "center" }}>No devices found.</p>
              )}
              {groups.map((g) => g.devices.length > 0 && (
                <div key={g.key}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "0.35rem 0.7rem", background: "var(--surface-alt)", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    <span>{g.name} ({g.devices.length})</span>
                    <span>
                      <a href="#all" onClick={(e) => { e.preventDefault(); setGroup(g.devices, true); }}>all</a>{" · "}
                      <a href="#none" onClick={(e) => { e.preventDefault(); setGroup(g.devices, false); }}>none</a>
                    </span>
                  </div>
                  {g.devices.map((d) => renderDevice(d.device_uid, d, selectedUids.includes(d.device_uid), () => toggle(selectedUids, setSelectedUids, d.device_uid)))}
                </div>
              ))}
            </div>

            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: "0.5rem 0 0" }}>
              The app is installed on every selected device.{app.install_type === "Required" ? " It is Required — it is reinstalled automatically if the user removes it." : ""}
            </p>
            {error && <p className="error-text">{error}</p>}
            {result && (
              <>
                <p style={{ fontSize: "0.8rem", marginTop: "0.8rem" }}>{result.message}</p>
                <InstallProgress token={token} commandIds={result.command_ids} />
              </>
            )}
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
              {!result && <button type="submit" disabled={saving}>{saving ? "Assigning..." : `Assign to ${selectedUids.length} device(s)`}</button>}
              <button type="button" className="ghost-dark" onClick={() => onClose(changed)}>{result ? "Close" : "Cancel"}</button>
            </div>
          </form>
        )}

        {tab === "assigned" && (
          <div>
            {assignedLoading && <p>Loading...</p>}
            {!assignedLoading && assigned.length === 0 && <p className="empty-state">Not assigned to any device yet.</p>}
            {!assignedLoading && assigned.length > 0 && (
              <div style={box}>
                {assignedGroups.map((g) => (
                  <div key={g.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.35rem 0.7rem", background: "var(--surface-alt)", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      <span>{g.name} ({g.rows.length})</span>
                      <button type="button" className="danger" disabled={removing} style={{ padding: "0.15rem 0.5rem", fontSize: "0.7rem" }} onClick={() => handleUnassign(g.rows.map((r) => r.device_uid))}>
                        Unassign all
                      </button>
                    </div>
                    {g.rows.map((r) => renderDevice(
                      r.device_uid,
                      { device_uid: r.device_uid, model: r.model, employee_name: r.employee_name },
                      removeUids.includes(r.device_uid),
                      () => toggle(removeUids, setRemoveUids, r.device_uid),
                      <span className={`badge ${r.installed ? "active" : "setup"}`}>{r.installed ? "Installed" : "Not installed"}</span>
                    ))}
                  </div>
                ))}
              </div>
            )}
            {removeMsg && <p style={{ fontSize: "0.8rem", marginTop: "0.8rem" }}>{removeMsg}</p>}
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: "0.5rem 0 0" }}>
              Unassigning removes the assignment only — the app stays on the phone unless you delete the application.
            </p>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
              <button type="button" className="danger" disabled={removing || removeUids.length === 0} onClick={() => handleUnassign(removeUids)}>
                {removing ? "Removing..." : `Unassign selected (${removeUids.length})`}
              </button>
              <button type="button" className="ghost-dark" onClick={() => onClose(changed)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
