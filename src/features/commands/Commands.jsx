// Command center: send commands to selected devices; pending / completed / failed history with cancel / retry.

import { useEffect, useState } from "react";
import { getDepartments } from "../departments/departmentService";
import { getDevices } from "../devices/deviceService";
import { getAllOrganizations } from "../organizations/organizationService";
import { cancelCommand, getActivityLogs, retryCommand, sendCommandMulti } from "./commandService";

export function CommandCenterView({ token, organizationId, isSuperAdmin, showToast }) {
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

      {!isSuperAdmin ? (
        <div className="policy-panel" style={{ marginBottom: "1.2rem" }}>
          <form onSubmit={handleSendCommand}>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.8rem" }}>
              <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
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
      ) : (
        <div className="policy-panel" style={{ marginBottom: "1.2rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.8rem" }}>
            <select value={orgFilter} onChange={(e) => setOrgFilter(e.target.value)}>
              <option value="">Select organization…</option>
              {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
          <p className="empty-state" style={{ margin: 0 }}>
            Read-only — Super Admin can view command history below but cannot send, cancel, or retry commands.
          </p>
        </div>
      )}

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
        <div className="table-scroll"><table>
          <thead>
            <tr><th>ID</th><th>Command</th><th>Device</th><th>Employee</th><th>Sent By</th><th>Sent Time</th><th>Status</th>{!isSuperAdmin && <th>Actions</th>}</tr>
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
                {!isSuperAdmin && (
                  <td className="actions">
                    {c.status === "pending" && <button disabled={acting !== null} onClick={() => handleCancel(c)}>Cancel</button>}
                    {c.status === "failed" && <button disabled={acting !== null} onClick={() => handleRetry(c)}>Retry</button>}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table></div>
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
