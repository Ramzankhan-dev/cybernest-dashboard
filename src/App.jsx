import { useState, useEffect } from "react";
import {
  login,
  getDevices,
  generateEnrollmentToken,
  sendCommand,
  getCommandHistory,
  getPolicies,
  createPolicy,
  assignPolicy,
  getInstalledApps,
  getActivityLogs,
} from "./api";

// A device only counts as "online" if it checked in recently — heartbeats
// go out every 30s, so anything older than 90s (missed ~3 beats) means
// it's actually lost connection, not that it's currently reachable.
function isDeviceOnline(device) {
  if (!device.last_seen) return false;
  return Date.now() - new Date(device.last_seen).getTime() < 90_000;
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(email, password);
      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>CyberNest</h1>
        <p className="subtitle">Sign in to manage your devices</p>

        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="error-text">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}

function DeviceRow({ device, onViewDetails }) {
  const online = isDeviceOnline(device);
  return (
    <tr>
      <td>
        <span className={`status-dot ${online ? "online" : "pending"}`} />
        {device.employee_name || "Unassigned"}
      </td>
      <td className="mono">{device.device_uid}</td>
      <td>{device.model || "—"}</td>
      <td>{device.android_version || "—"}</td>
      <td>{device.battery_level != null ? `${device.battery_level}%` : "—"}</td>
      <td>{online ? "online" : "offline"}</td>
      <td className="actions">
        <button onClick={() => onViewDetails(device.device_uid)}>View details</button>
      </td>
    </tr>
  );
}

function PolicyPanel({ token, policies, onPolicyCreated }) {
  const [name, setName] = useState("");
  const [camera, setCamera] = useState(false);
  const [bluetooth, setBluetooth] = useState(false);
  const [wifi, setWifi] = useState(false);
  const [usb, setUsb] = useState(false);
  const [kiosk, setKiosk] = useState(false);
  const [kioskPackage, setKioskPackage] = useState("");
  const [hoursStart, setHoursStart] = useState("");
  const [hoursEnd, setHoursEnd] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      await createPolicy(token, {
        name: name.trim(),
        camera_blocked: camera,
        bluetooth_blocked: bluetooth,
        wifi_restricted: wifi,
        usb_transfer_blocked: usb,
        kiosk_mode: kiosk,
        kiosk_package: kioskPackage || null,
        working_hours_start: hoursStart || null,
        working_hours_end: hoursEnd || null,
      });
      setName("");
      setCamera(false);
      setBluetooth(false);
      setWifi(false);
      setUsb(false);
      setKiosk(false);
      setKioskPackage("");
      setHoursStart("");
      setHoursEnd("");
      onPolicyCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="policy-panel">
      <h2>Policy templates</h2>
      <form onSubmit={handleCreate} className="policy-form">
        <input
          type="text"
          placeholder="Policy name, e.g. Restricted Mode"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <label><input type="checkbox" checked={camera} onChange={(e) => setCamera(e.target.checked)} /> Block camera</label>
        <label><input type="checkbox" checked={bluetooth} onChange={(e) => setBluetooth(e.target.checked)} /> Block Bluetooth</label>
        <label><input type="checkbox" checked={wifi} onChange={(e) => setWifi(e.target.checked)} /> Restrict Wi-Fi config</label>
        <label><input type="checkbox" checked={usb} onChange={(e) => setUsb(e.target.checked)} /> Block USB transfer</label>
        <label><input type="checkbox" checked={kiosk} onChange={(e) => setKiosk(e.target.checked)} /> Kiosk mode</label>
        <input
          type="text"
          placeholder="Kiosk target app package (blank = lock to agent app)"
          value={kioskPackage}
          onChange={(e) => setKioskPackage(e.target.value)}
          style={{ minWidth: "260px" }}
        />
        <label>
          Working hours:
          <input type="time" value={hoursStart} onChange={(e) => setHoursStart(e.target.value)} style={{ marginLeft: "0.4rem" }} />
          –
          <input type="time" value={hoursEnd} onChange={(e) => setHoursEnd(e.target.value)} />
        </label>
        <button type="submit" disabled={saving || !name.trim()}>
          {saving ? "Saving..." : "Save policy"}
        </button>
      </form>
      {error && <p className="error-text">{error}</p>}

      {policies.length > 0 && (
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
      )}
    </section>
  );
}

function AppsPanel({ deviceUid, token, onClose, onCommandSent, embedded }) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [requesting, setRequesting] = useState(false);

  function loadApps() {
    setLoading(true);
    getInstalledApps(token, deviceUid)
      .then(setApps)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadApps();
  }, [deviceUid]);

  async function handleRequestUpdate() {
    setRequesting(true);
    try {
      await sendCommand(token, deviceUid, "list_apps");
      onCommandSent("Requested fresh app list from the device — wait a few seconds, then click Refresh list below.");
    } catch (err) {
      onCommandSent(`Failed: ${err.message}`, true);
    } finally {
      setRequesting(false);
    }
  }

  async function handleAppAction(commandType, packageName) {
    setActing(packageName + commandType);
    try {
      await sendCommand(token, deviceUid, commandType, packageName);
      onCommandSent(`${commandType} sent for ${packageName}`);
    } catch (err) {
      onCommandSent(`Failed: ${err.message}`, true);
    } finally {
      setActing(null);
    }
  }

  const body = (
    <>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <button className="ghost-dark" onClick={handleRequestUpdate} disabled={requesting}>
          {requesting ? "Requesting..." : "Request update from device"}
        </button>
        <button className="ghost-dark" onClick={loadApps}>Refresh list</button>
      </div>
      {loading && <p>Loading...</p>}
      {!loading && apps.length === 0 && (
        <p className="empty-state">
          No apps reported yet — click "Request update from device" first, wait a few seconds, then "Refresh list".
        </p>
      )}
      {!loading && apps.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>App</th>
              <th>Package</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {apps.map((app) => (
              <tr key={app.id}>
                <td>{app.app_name || "—"}</td>
                <td className="mono">{app.package_name}</td>
                <td>{app.status}</td>
                <td className="actions">
                  {app.status === "blocked" ? (
                    <button
                      disabled={acting !== null}
                      onClick={() => handleAppAction("unblock_app", app.package_name)}
                    >
                      {acting === app.package_name + "unblock_app" ? "..." : "Allow"}
                    </button>
                  ) : (
                    <button
                      disabled={acting !== null}
                      onClick={() => handleAppAction("block_app", app.package_name)}
                    >
                      {acting === app.package_name + "block_app" ? "..." : "Block"}
                    </button>
                  )}
                  <button
                    className="danger"
                    disabled={acting !== null}
                    onClick={() => handleAppAction("uninstall_app", app.package_name)}
                  >
                    {acting === app.package_name + "uninstall_app" ? "..." : "Uninstall"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );

  if (embedded) return body;

  return (
    <section className="history-panel">
      <div className="history-header">
        <h2 style={{ border: "none", margin: 0 }}>
          Installed apps — <span className="mono">{deviceUid}</span>
        </h2>
        <button className="ghost-dark" onClick={onClose}>Close</button>
      </div>
      {body}
    </section>
  );
}

function DeviceDetailsView({ device, token, policies, onCommandSent, onClose }) {
  const [tab, setTab] = useState("general");
  const [sending, setSending] = useState(null);
  const [appPackage, setAppPackage] = useState("");
  const [selectedPolicy, setSelectedPolicy] = useState("");

  async function handleCommand(commandType, packageName = null) {
    setSending(commandType);
    try {
      await sendCommand(token, device.device_uid, commandType, packageName);
      onCommandSent(`${commandType} sent to ${device.employee_name || device.device_uid}`);
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
        {["general", "apps", "policy", "commands"].map((t) => (
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
          <table style={{ marginBottom: "1.2rem" }}>
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
          </table>
          <div className="quick-actions">
            <button onClick={() => handleCommand("lock")} disabled={sending !== null}>Lock</button>
            <button onClick={() => handleCommand("ring")} disabled={sending !== null}>Ring</button>
            <button onClick={() => handleCommand("sync")} disabled={sending !== null}>Sync</button>
            <button className="danger" onClick={handleWipe} disabled={sending !== null}>Wipe</button>
          </div>
        </div>
      )}

      {tab === "apps" && (
        <AppsPanel deviceUid={device.device_uid} token={token} onCommandSent={onCommandSent} embedded />
      )}

      {tab === "policy" && (
        <div>
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
          </div>
          {policies.length > 0 && (
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
          )}
        </div>
      )}

      {tab === "commands" && (
        <div>
          <div className="quick-actions" style={{ marginBottom: "1.2rem" }}>
            <button onClick={() => handleCommand("block_camera")} disabled={sending !== null}>Block camera</button>
            <button onClick={() => handleCommand("unblock_camera")} disabled={sending !== null}>Unblock camera</button>
            <button onClick={() => handleCommand("block_bluetooth")} disabled={sending !== null}>Block Bluetooth</button>
            <button onClick={() => handleCommand("unblock_bluetooth")} disabled={sending !== null}>Unblock Bluetooth</button>
            <button onClick={() => handleCommand("lock")} disabled={sending !== null}>Lock</button>
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
          <h2 style={{ fontSize: "0.95rem" }}>Command history</h2>
          <HistoryPanel deviceUid={device.device_uid} token={token} embedded />
        </div>
      )}
    </section>
  );
}

function HistoryPanel({ deviceUid, token, onClose, embedded }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCommandHistory(token, deviceUid)
      .then(setHistory)
      .finally(() => setLoading(false));
  }, [deviceUid]);

  const content = (
    <>
      {loading && <p>Loading...</p>}
      {!loading && history.length === 0 && (
        <p className="empty-state">No commands sent to this device yet.</p>
      )}
      {!loading && history.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Command</th>
              <th>Status</th>
              <th>Issued at</th>
              <th>Executed at</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h) => (
              <tr key={h.id}>
                <td>{h.command_type}</td>
                <td>{h.status}</td>
                <td>{new Date(h.issued_at).toLocaleString()}</td>
                <td>{h.executed_at ? new Date(h.executed_at).toLocaleString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );

  if (embedded) return content;

  return (
    <section className="history-panel">
      <div className="history-header">
        <h2 style={{ border: "none", margin: 0 }}>
          Command history — <span className="mono">{deviceUid}</span>
        </h2>
        <button className="ghost-dark" onClick={onClose}>Close</button>
      </div>
      {content}
    </section>
  );
}

function ActivityLogsView({ token }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getActivityLogs(token)
      .then(setLogs)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <h2>Activity logs</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && logs.length === 0 && <p className="empty-state">No activity yet.</p>}
      {!loading && logs.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Admin</th>
              <th>Action</th>
              <th>Device</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td>{new Date(l.issued_at).toLocaleString()}</td>
                <td>{l.admin_name || "System"}</td>
                <td>{l.command_type}</td>
                <td>{l.employee_name || l.device_uid}</td>
                <td>{l.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function Dashboard({ token, user, onLogout }) {
  const [page, setPage] = useState("devices");
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [generatedUid, setGeneratedUid] = useState(null);
  const [detailsDeviceUid, setDetailsDeviceUid] = useState(null);
  const [policies, setPolicies] = useState([]);

  async function loadPolicies() {
    try {
      const data = await getPolicies(token);
      setPolicies(data);
    } catch (err) {
      // Non-critical — device list still works without policies
    }
  }

  async function loadDevices() {
    setLoading(true);
    try {
      const data = await getDevices(token);
      setDevices(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDevices();
    loadPolicies();
  }, []);

  function showToast(message, isError = false) {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleGenerateToken(e) {
    e.preventDefault();
    try {
      const data = await generateEnrollmentToken(token, newDeviceName);
      setGeneratedUid(data.device.device_uid);
      setNewDeviceName("");
      loadDevices();
    } catch (err) {
      showToast(err.message, true);
    }
  }

  return (
    <div className="dashboard">
      <header className="topbar">
        <h1>CyberNest</h1>
        <nav className="top-nav">
          <button className={page === "devices" ? "active" : ""} onClick={() => setPage("devices")}>Devices</button>
          <button className={page === "activity" ? "active" : ""} onClick={() => setPage("activity")}>Activity Logs</button>
        </nav>
        <div className="topbar-right">
          <span>{user.name}</span>
          <button className="ghost" onClick={onLogout}>Sign out</button>
        </div>
      </header>

      <main>
        {page === "activity" && <ActivityLogsView token={token} />}

        {page === "devices" && (
        <>
        <section className="enroll-panel">
          <h2>Enroll a new device</h2>
          <form onSubmit={handleGenerateToken} className="enroll-form">
            <input
              type="text"
              placeholder="Employee name (optional)"
              value={newDeviceName}
              onChange={(e) => setNewDeviceName(e.target.value)}
            />
            <button type="submit">Generate enrollment code</button>
          </form>
          {generatedUid && (
            <div className="generated-code">
              <p>
                Enrollment code: <span className="mono">{generatedUid}</span>
                <br />
                Scan this QR in the CyberNest Agent app, or enter the code manually.
              </p>
              <img
                className="qr-image"
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${generatedUid}`}
                alt="Enrollment QR code"
              />
            </div>
          )}
        </section>

        <PolicyPanel token={token} policies={policies} onPolicyCreated={loadPolicies} />

        <section>
          <h2>Devices</h2>
          {loading && <p>Loading devices...</p>}
          {error && <p className="error-text">{error}</p>}
          {!loading && devices.length === 0 && (
            <p className="empty-state">No devices enrolled yet.</p>
          )}
          {!loading && devices.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Device UID</th>
                  <th>Model</th>
                  <th>Android</th>
                  <th>Battery</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((d) => (
                  <DeviceRow
                    key={d.id}
                    device={d}
                    onViewDetails={setDetailsDeviceUid}
                  />
                ))}
              </tbody>
            </table>
          )}
        </section>

        {detailsDeviceUid && (
          <DeviceDetailsView
            device={devices.find((d) => d.device_uid === detailsDeviceUid)}
            token={token}
            policies={policies}
            onCommandSent={showToast}
            onClose={() => setDetailsDeviceUid(null)}
          />
        )}
        </>
        )}
      </main>

      {toast && (
        <div className={`toast ${toast.isError ? "toast-error" : ""}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  function handleLogin(newToken, newUser) {
    setToken(newToken);
    setUser(newUser);
  }

  function handleLogout() {
    setToken(null);
    setUser(null);
  }

  if (!token) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <Dashboard token={token} user={user} onLogout={handleLogout} />;
}
