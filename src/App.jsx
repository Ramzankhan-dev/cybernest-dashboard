import { useState, useEffect } from "react";
import { login, getDevices, generateEnrollmentToken, sendCommand, getCommandHistory } from "./api";

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

function DeviceRow({ device, token, onCommandSent, onViewHistory }) {
  const [sending, setSending] = useState(null);
  const [appPackage, setAppPackage] = useState("");

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
        <button onClick={() => onViewHistory(device.device_uid)}>
          History
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
    </>
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
