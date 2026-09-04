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
} from "./api";

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

function DeviceRow({ device, token, onCommandSent, onViewHistory, onViewApps, policies }) {
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
      onCommandSent(`Policy applied to ${device.employee_name || device.device_uid} (${data.commands_sent.length} rules)`);
    } catch (err) {
      onCommandSent(`Failed: ${err.message}`, true);
    } finally {
      setSending(null);
    }
  }

  return (
    <>
    <tr>
      <td>
        <span className={`status-dot ${device.status}`} />
        {device.employee_name || "Unassigned"}
      </td>
      <td className="mono">{device.device_uid}</td>
      <td>{device.model || "—"}</td>
      <td>{device.android_version || "—"}</td>
      <td>{device.battery_level != null ? `${device.battery_level}%` : "—"}</td>
      <td>{device.status}</td>
      <td className="actions">
        <button
          onClick={() => handleCommand("block_camera")}
          disabled={sending !== null}
        >
          {sending === "block_camera" ? "..." : "Block camera"}
        </button>
        <button
          onClick={() => handleCommand("unblock_camera")}
          disabled={sending !== null}
        >
          {sending === "unblock_camera" ? "..." : "Unblock camera"}
        </button>
        <button
          onClick={() => handleCommand("block_bluetooth")}
          disabled={sending !== null}
        >
          {sending === "block_bluetooth" ? "..." : "Block Bluetooth"}
        </button>
        <button
          onClick={() => handleCommand("unblock_bluetooth")}
          disabled={sending !== null}
        >
          {sending === "unblock_bluetooth" ? "..." : "Unblock Bluetooth"}
        </button>
        <button
          className="danger"
          onClick={() => handleCommand("lock")}
          disabled={sending !== null}
        >
          {sending === "lock" ? "..." : "Lock"}
        </button>
        <button
          onClick={() => handleCommand("ring")}
          disabled={sending !== null}
        >
          {sending === "ring" ? "..." : "Ring"}
        </button>
        <button
          onClick={() => handleCommand("sync")}
          disabled={sending !== null}
        >
          {sending === "sync" ? "..." : "Sync"}
        </button>
        <button
          onClick={() => handleCommand("refresh_policy")}
          disabled={sending !== null}
        >
          {sending === "refresh_policy" ? "..." : "Refresh Policy"}
        </button>
        <button
          onClick={() => handleCommand("restart")}
          disabled={sending !== null}
        >
          {sending === "restart" ? "..." : "Restart"}
        </button>
        <button
          className="danger"
          onClick={handleWipe}
          disabled={sending !== null}
        >
          {sending === "wipe" ? "..." : "Wipe"}
        </button>
        <button onClick={() => onViewHistory(device.device_uid)}>
          History
        </button>
        <button onClick={() => onViewApps(device.device_uid)}>
          Apps
        </button>
      </td>
    </tr>
    <tr className="app-block-row">
      <td colSpan={7}>
        <span className="app-block-label">App control:</span>
        <input
          type="text"
          placeholder="Package name, e.g. com.whatsapp"
          value={appPackage}
          onChange={(e) => setAppPackage(e.target.value)}
        />
        <button
          disabled={sending !== null || !appPackage.trim()}
          onClick={() => handleCommand("block_app", appPackage.trim())}
        >
          {sending === "block_app" ? "..." : "Block app"}
        </button>
        <button
          disabled={sending !== null || !appPackage.trim()}
          onClick={() => handleCommand("unblock_app", appPackage.trim())}
        >
          {sending === "unblock_app" ? "..." : "Unblock app"}
        </button>
      </td>
    </tr>
    <tr className="app-block-row">
      <td colSpan={7}>
        <span className="app-block-label">Apply policy:</span>
        <select value={selectedPolicy} onChange={(e) => setSelectedPolicy(e.target.value)}>
          <option value="">Select a saved policy…</option>
          {policies.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <button
          disabled={sending !== null || !selectedPolicy}
          onClick={handleApplyPolicy}
        >
          {sending === "apply_policy" ? "Applying..." : "Apply policy"}
        </button>
      </td>
    </tr>
    </>
  );
}

function PolicyPanel({ token, policies, onPolicyCreated }) {
  const [name, setName] = useState("");
  const [camera, setCamera] = useState(false);
  const [bluetooth, setBluetooth] = useState(false);
  const [wifi, setWifi] = useState(false);
  const [usb, setUsb] = useState(false);
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
      });
      setName("");
      setCamera(false);
      setBluetooth(false);
      setWifi(false);
      setUsb(false);
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
                {p.usb_transfer_blocked && "USB"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AppsPanel({ deviceUid, token, onClose, onCommandSent }) {
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

  return (
    <section className="history-panel">
      <div className="history-header">
        <h2 style={{ border: "none", margin: 0 }}>
          Installed apps — <span className="mono">{deviceUid}</span>
        </h2>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="ghost-dark" onClick={handleRequestUpdate} disabled={requesting}>
            {requesting ? "Requesting..." : "Request update from device"}
          </button>
          <button className="ghost-dark" onClick={loadApps}>Refresh list</button>
          <button className="ghost-dark" onClick={onClose}>Close</button>
        </div>
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
    </section>
  );
}

function HistoryPanel({ deviceUid, token, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCommandHistory(token, deviceUid)
      .then(setHistory)
      .finally(() => setLoading(false));
  }, [deviceUid]);

  return (
    <section className="history-panel">
      <div className="history-header">
        <h2 style={{ border: "none", margin: 0 }}>
          Command history — <span className="mono">{deviceUid}</span>
        </h2>
        <button className="ghost-dark" onClick={onClose}>Close</button>
      </div>
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
    </section>
  );
}

function Dashboard({ token, user, onLogout }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [generatedUid, setGeneratedUid] = useState(null);
  const [historyDeviceUid, setHistoryDeviceUid] = useState(null);
  const [appsDeviceUid, setAppsDeviceUid] = useState(null);
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
        <div className="topbar-right">
          <span>{user.name}</span>
          <button className="ghost" onClick={onLogout}>Sign out</button>
        </div>
      </header>

      <main>
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
                    token={token}
                    onCommandSent={showToast}
                    onViewHistory={setHistoryDeviceUid}
                    onViewApps={setAppsDeviceUid}
                    policies={policies}
                  />
                ))}
              </tbody>
            </table>
          )}
        </section>

        {historyDeviceUid && (
          <HistoryPanel
            deviceUid={historyDeviceUid}
            token={token}
            onClose={() => setHistoryDeviceUid(null)}
          />
        )}

        {appsDeviceUid && (
          <AppsPanel
            deviceUid={appsDeviceUid}
            token={token}
            onClose={() => setAppsDeviceUid(null)}
            onCommandSent={showToast}
          />
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
