// Modal: push a silent APK install to a device and track its status.

import { useEffect, useState } from "react";
import { IconX } from "../../components/icons";
import { getCommandStatus } from "../commands/commandService";
import { getDevices } from "../devices/deviceService";
import { installApkPackage } from "./applicationService";

export function InstallApkModal({ pkg, token, organizationId, onClose, showToast }) {
  const [devices, setDevices] = useState([]);
  const [deviceUid, setDeviceUid] = useState("");
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

  async function handleSubmit(e) {
    e.preventDefault();
    if (!deviceUid) { setError("Select a device"); return; }
    setSaving(true);
    setError("");
    try {
      const result = await installApkPackage(token, pkg.id, deviceUid);
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
        <h3 style={{ marginTop: 0 }}>Install "{pkg.app_name}"</h3>
        <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "0 0 0.8rem" }}>
          Pushes a silent install command to the device — no user confirmation needed, since it's already Device Owner managed.
        </p>
        <form onSubmit={handleSubmit} className="modal-form">
          <label>Device</label>
          <select value={deviceUid} onChange={(e) => setDeviceUid(e.target.value)} disabled={commandId !== null}>
            <option value="">Select device…</option>
            {devices.map((d) => <option key={d.id} value={d.device_uid}>{d.model || d.device_uid}</option>)}
          </select>
          {error && <p className="error-text">{error}</p>}

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
