// Modal: push a silent APK install to a device and track its status.

import { useEffect, useState } from "react";
import { IconX } from "../../components/icons";
import { getCommandStatus } from "../commands/commandService";
import { getDevices } from "../devices/deviceService";
import { isDeviceOnline } from "../devices/deviceUtils";
import { InstallProgress } from "./InstallProgress";
import { installApplication } from "./applicationService";

export function InstallApkModal({ app, token, organizationId, onClose, showToast }) {
  const [devices, setDevices] = useState([]);
  const [deviceUid, setDeviceUid] = useState("");
  const [deviceSearch, setDeviceSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [commandId, setCommandId] = useState(null);
  const [status, setStatus] = useState(null); // 'sent' | 'executed' | 'failed'
  const [statusError, setStatusError] = useState("");

  useEffect(() => {
    getDevices(token, { organization_id: organizationId, limit: 200 }).then((d) => setDevices(d.devices)).catch(() => {});
  }, []);

  // Polls every 3s once a command is pushed, up to 2 minutes — the
  // device has to receive the FCM push, download the APK, and run the
  // silent install, so this isn't instant.
  useEffect(() => {
    if (!commandId || status === "executed" || status === "failed") return;
    const start = Date.now();
    const interval = setInterval(async () => {
      if (Date.now() - start > 120000) {
        clearInterval(interval);
        return;
      }
      try {
        const cmd = await getCommandStatus(token, commandId);
        setStatus(cmd.status);
        if (cmd.status === "failed") setStatusError(cmd.error_message || "Install failed");
        if (cmd.status === "executed" || cmd.status === "failed") clearInterval(interval);
      } catch (err) {
        // transient — keep polling
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [commandId, status]);

  const q = deviceSearch.trim().toLowerCase();
  const filteredDevices = devices.filter((d) =>
    !q || [d.model, d.employee_name, d.device_uid].some((v) => v && String(v).toLowerCase().includes(q))
  );

  async function handleSubmit(e) {
    e.preventDefault();
    if (!deviceUid) { setError("Select a device"); return; }
    setSaving(true);
    setError("");
    try {
      const result = await installApplication(token, app.id, deviceUid);
      setCommandId(result.command_id);
      setStatus("sent");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function statusLabel() {
    if (status === "sent") return "📡 Sent to device — waiting for download & install…";
    if (status === "executed") return "✅ Installed successfully";
    if (status === "failed") return `❌ Failed: ${statusError}`;
    return null;
  }

  return (
    <div className="modal-overlay" onClick={() => onClose(status === "executed")}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" aria-label="Close dialog" title="Close" onClick={() => onClose(status === "executed")}><IconX size={16} /></button>
        <h3 style={{ marginTop: 0 }}>Install "{app.name}"</h3>
        <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "0 0 0.8rem" }}>
          Pushes a silent install command to the device — no user confirmation needed, since it's already Device Owner managed.
        </p>
        <form onSubmit={handleSubmit} className="modal-form">
          <label>Device</label>
          <input
            type="text"
            placeholder="Search by model, employee or device ID…"
            value={deviceSearch}
            onChange={(e) => setDeviceSearch(e.target.value)}
            disabled={commandId !== null}
          />
          <div style={{ maxHeight: "220px", overflowY: "auto", border: "1px solid var(--border)", borderRadius: "8px", marginTop: "0.4rem" }}>
            {filteredDevices.length === 0 && (
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "0.8rem", textAlign: "center" }}>No devices found.</p>
            )}
            {filteredDevices.map((d) => {
              const online = isDeviceOnline(d);
              return (
                <label
                  key={d.id}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.55rem 0.7rem",
                    cursor: commandId !== null ? "default" : "pointer",
                    background: deviceUid === d.device_uid ? "var(--surface-alt)" : "transparent",
                    borderBottom: "1px solid var(--border)", margin: 0,
                  }}
                >
                  <input
                    type="radio"
                    name="install-device"
                    checked={deviceUid === d.device_uid}
                    onChange={() => setDeviceUid(d.device_uid)}
                    disabled={commandId !== null}
                    style={{ width: "auto", margin: 0 }}
                  />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: "0.85rem" }}>{d.model || d.device_uid}</span>
                    <span style={{ display: "block", fontSize: "0.7rem", color: "var(--text-muted)" }}>
                      {d.employee_name || "Unassigned"} · {d.device_uid}
                    </span>
                  </span>
                  <span className={`badge ${online ? "active" : "setup"}`}>{online ? "Online" : "Offline"}</span>
                </label>
              );
            })}
          </div>
          {error && <p className="error-text">{error}</p>}

          {commandId && <InstallProgress token={token} commandIds={[commandId]} />}

          {statusLabel() && (
            <p style={{
              fontSize: "0.8rem", marginTop: "0.8rem", padding: "0.6rem",
              borderRadius: "6px", background: "var(--surface-alt)",
              color: status === "failed" ? "var(--alert)" : status === "executed" ? "var(--teal)" : "var(--text-muted)",
            }}>
              {statusLabel()}
            </p>
          )}

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
            {!commandId && <button type="submit" disabled={saving}>{saving ? "Sending..." : "Push Install"}</button>}
            <button type="button" className="ghost-dark" onClick={() => onClose(status === "executed")}>
              {status === "executed" || status === "failed" ? "Close" : "Cancel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
