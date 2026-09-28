// Device card with quick commands (lock/unlock, sync), QR and remove.

import { useState } from "react";
import { sendCommand } from "../commands/commandService";
import { EnrollmentQrModal } from "./EnrollmentQrModal";
import { removeDevice } from "./deviceService";
import { isDeviceOnline } from "./deviceUtils";

export function DeviceCard({ device, token, onView, onCommandSent, onRemoved, readOnly }) {
  const online = isDeviceOnline(device);
  const [sending, setSending] = useState(null);
  const [isLocked, setIsLocked] = useState(!!device.is_locked);
  const [showQr, setShowQr] = useState(false);

  async function quickCommand(cmd) {
    setSending(cmd);
    try {
      await sendCommand(token, device.device_uid, cmd);
      onCommandSent(`${cmd} sent to ${device.model || device.device_uid}`);
      if (cmd === "lock") setIsLocked(true);
      if (cmd === "unlock") setIsLocked(false);
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
      <div className="table-scroll"><table style={{ marginTop: "0.6rem", marginBottom: "0.8rem" }}>
        <tbody>
          <tr><td>UID</td><td className="mono" style={{ textAlign: "right", fontSize: "0.72rem" }}>{device.device_uid}</td></tr>
          <tr><td>IMEI</td><td className="mono" style={{ textAlign: "right" }}>{device.imei || "—"}</td></tr>
          <tr><td>Android</td><td style={{ textAlign: "right" }}>{device.android_version || "—"}</td></tr>
          <tr><td>Battery</td><td style={{ textAlign: "right" }}>{device.battery_level != null ? `${device.battery_level}%` : "—"}</td></tr>
          <tr><td>User</td><td style={{ textAlign: "right" }}>{device.assigned_employee_name || device.employee_name || "Unassigned"}</td></tr>
        </tbody>
      </table></div>
      <div className="actions">
        <button onClick={() => onView(device.device_uid)}>View</button>
        {!readOnly && (
          <>
            <button className={isLocked ? "" : "danger"} disabled={sending !== null} onClick={() => quickCommand(isLocked ? "unlock" : "lock")}>
              {sending === (isLocked ? "unlock" : "lock") ? "..." : (isLocked ? "Unlock" : "Lock")}
            </button>
            <button disabled={sending !== null} onClick={() => quickCommand("sync")}>
              {sending === "sync" ? "..." : "Sync"}
            </button>
          </>
        )}
        {!device.fcm_token && (
          <button className="ghost-dark" onClick={() => setShowQr(true)}>Show QR</button>
        )}
        {!readOnly && (
          <button className="danger" onClick={handleRemove}>Remove</button>
        )}
      </div>
      {showQr && <EnrollmentQrModal device={device} onClose={() => setShowQr(false)} />}
    </div>
  );
}
