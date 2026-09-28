// Device details -> Apps tab: installed apps with block / allow / uninstall.

import { useEffect, useState } from "react";
import { sendCommand } from "../commands/commandService";
import { getInstalledApps } from "./deviceService";

export function AppsPanel({ deviceUid, token, onClose, onCommandSent, embedded, readOnly }) {
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
        {!readOnly && (
          <button className="ghost-dark" onClick={handleRequestUpdate} disabled={requesting}>
            {requesting ? "Requesting..." : "Request update from device"}
          </button>
        )}
        <button className="ghost-dark" onClick={loadApps}>Refresh list</button>
      </div>
      {loading && <p>Loading...</p>}
      {!loading && apps.length === 0 && (
        <p className="empty-state">
          No apps reported yet — click "Request update from device" first, wait a few seconds, then "Refresh list".
        </p>
      )}
      {!loading && apps.length > 0 && (
        <div className="table-scroll"><table>
          <thead>
            <tr>
              <th>App</th>
              <th>Package</th>
              <th>Status</th>
              {!readOnly && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {apps.map((app) => (
              <tr key={app.id}>
                <td>{app.app_name || "—"}</td>
                <td className="mono">{app.package_name}</td>
                <td>{app.status}</td>
                {!readOnly && (
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
                )}
              </tr>
            ))}
          </tbody>
        </table></div>
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
