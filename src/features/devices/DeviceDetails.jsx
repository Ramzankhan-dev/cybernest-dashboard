// Device details panel: General / Location / Apps / Policy / Commands tabs.

import { useEffect, useState } from "react";
import { sendCommand } from "../commands/commandService";
import {
  assignPolicy,
  getCurrentPolicy,
  getPolicyHistory,
  unassignDevicePolicy,
} from "../policies/policyService";
import { AppsPanel } from "./DeviceApps";
import { HistoryPanel } from "./DeviceCommandHistory";
import { LocationPanel } from "./DeviceLocation";
import { isDeviceOnline } from "./deviceUtils";

export function DeviceDetailsView({ device, token, policies, onCommandSent, onClose, readOnly }) {
  const [tab, setTab] = useState("general");
  const [sending, setSending] = useState(null);
  const [isLocked, setIsLocked] = useState(!!device.is_locked);
  const [appPackage, setAppPackage] = useState("");
  const [selectedPolicy, setSelectedPolicy] = useState("");
  const [currentPolicy, setCurrentPolicy] = useState(null);
  const [loadingCurrentPolicy, setLoadingCurrentPolicy] = useState(false);
  const [policyHistory, setPolicyHistory] = useState([]);

  function loadCurrentPolicy() {
    setLoadingCurrentPolicy(true);
    getCurrentPolicy(token, device.device_uid)
      .then((data) => setCurrentPolicy(data.policy))
      .catch(() => setCurrentPolicy(null))
      .finally(() => setLoadingCurrentPolicy(false));
    getPolicyHistory(token, device.device_uid)
      .then((data) => setPolicyHistory(data.history || []))
      .catch(() => setPolicyHistory([]));
  }

  useEffect(() => { loadCurrentPolicy(); }, [device.device_uid]);

  async function handleCommand(commandType, packageName = null) {
    setSending(commandType);
    try {
      await sendCommand(token, device.device_uid, commandType, packageName);
      onCommandSent(`${commandType} sent to ${device.employee_name || device.device_uid}`);
      if (commandType === "lock") setIsLocked(true);
      if (commandType === "unlock") setIsLocked(false);
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
      loadCurrentPolicy();
    } catch (err) {
      onCommandSent(`Failed: ${err.message}`, true);
    } finally {
      setSending(null);
    }
  }

  async function handleUnassignPolicy() {
    if (!window.confirm(`Remove the current policy from this device and reverse its restrictions (camera, Wi-Fi, kiosk, etc.)?`)) return;
    setSending("unassign_policy");
    try {
      const data = await unassignDevicePolicy(token, device.device_uid);
      onCommandSent(data.message);
      loadCurrentPolicy();
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
        {["general", "location", "apps", "policy", "commands"].map((t) => (
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
          <div className="table-scroll"><table style={{ marginBottom: "1.2rem" }}>
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
          </table></div>
          <div className="quick-actions">
            {!readOnly ? (
              <>
                <button onClick={() => handleCommand(isLocked ? "unlock" : "lock")} disabled={sending !== null}>{isLocked ? "Unlock" : "Lock"}</button>
                <button onClick={() => handleCommand("ring")} disabled={sending !== null}>Ring</button>
                <button onClick={() => handleCommand("sync")} disabled={sending !== null}>Sync</button>
                <button className="danger" onClick={handleWipe} disabled={sending !== null}>Wipe</button>
              </>
            ) : (
              <p className="empty-state" style={{ margin: 0 }}>Read-only — Super Admin cannot send commands to devices.</p>
            )}
          </div>
        </div>
      )}

      {tab === "location" && (
        <LocationPanel device={device} token={token} onCommandSent={onCommandSent} readOnly={readOnly} />
      )}

      {tab === "apps" && (
        <AppsPanel deviceUid={device.device_uid} token={token} onCommandSent={onCommandSent} embedded readOnly={readOnly} />
      )}

      {tab === "policy" && (
        <div>
          <div className="dash-header-row" style={{ marginBottom: "0.8rem" }}>
            <div className="app-block-label" style={{ margin: 0 }}>Currently assigned policy:</div>
            <button className="ghost-dark" onClick={loadCurrentPolicy} disabled={loadingCurrentPolicy}>
              {loadingCurrentPolicy ? "Refreshing..." : "Refresh"}
            </button>
          </div>
          <div className="policy-panel" style={{ marginBottom: "1.2rem" }}>
            {loadingCurrentPolicy && <p style={{ margin: 0 }}>Loading...</p>}
            {!loadingCurrentPolicy && !currentPolicy && <p className="empty-state" style={{ margin: 0 }}>No policy currently assigned to this device.</p>}
            {!loadingCurrentPolicy && currentPolicy && (
              <div>
                <strong>{currentPolicy.name}</strong>
                <span className="policy-flags" style={{ marginLeft: "0.5rem" }}>
                  {currentPolicy.camera_blocked && "Camera "}
                  {currentPolicy.bluetooth_blocked && "Bluetooth "}
                  {currentPolicy.wifi_restricted && "Wi-Fi "}
                  {currentPolicy.usb_transfer_blocked && "USB "}
                  {currentPolicy.kiosk_mode && "Kiosk "}
                </span>
              </div>
            )}
          </div>

          {policyHistory.length > 1 && (
            <>
              <div className="app-block-label" style={{ marginBottom: "0.6rem" }}>Assignment history (all policies ever applied to this device):</div>
              <ul className="policy-list" style={{ marginBottom: "1.2rem" }}>
                {policyHistory.map((p, i) => (
                  <li key={`${p.id}-${p.assigned_at}`}>
                    <span>
                      <strong>{p.name}</strong>{i === 0 && <span style={{ color: "var(--teal)", marginLeft: "0.4rem" }}>(active)</span>}
                      <span className="policy-flags" style={{ marginLeft: "0.5rem" }}>
                        {p.camera_blocked && "Camera "}
                        {p.bluetooth_blocked && "Bluetooth "}
                        {p.wifi_restricted && "Wi-Fi "}
                        {p.usb_transfer_blocked && "USB "}
                        {p.kiosk_mode && "Kiosk "}
                      </span>
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{new Date(p.assigned_at).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {!readOnly && (
            <>
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
                <button disabled={sending !== null} onClick={handleUnassignPolicy}>
                  {sending === "unassign_policy" ? "Removing..." : "Unassign current policy"}
                </button>
              </div>
            </>
          )}
          {policies.length > 0 && (
            <>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "0 0 0.4rem" }}>
                All policies in your organization (not necessarily applied to this device — use "Apply policy" above to assign one):
              </p>
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
            </>
          )}
        </div>
      )}

      {tab === "commands" && (
        <div>
          {!readOnly ? (
            <>
              <div className="quick-actions" style={{ marginBottom: "1.2rem" }}>
                <button onClick={() => handleCommand("block_camera")} disabled={sending !== null}>Block camera</button>
                <button onClick={() => handleCommand("unblock_camera")} disabled={sending !== null}>Unblock camera</button>
                <button onClick={() => handleCommand("block_bluetooth")} disabled={sending !== null}>Block Bluetooth</button>
                <button onClick={() => handleCommand("unblock_bluetooth")} disabled={sending !== null}>Unblock Bluetooth</button>
                <button onClick={() => handleCommand(isLocked ? "unlock" : "lock")} disabled={sending !== null}>{isLocked ? "Unlock" : "Lock"}</button>
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
            </>
          ) : (
            <p className="empty-state">Read-only — Super Admin cannot send commands to devices.</p>
          )}
          <h2 style={{ fontSize: "0.95rem" }}>Command history</h2>
          <HistoryPanel deviceUid={device.device_uid} token={token} embedded />
        </div>
      )}
    </section>
  );
}
