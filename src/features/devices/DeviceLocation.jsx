// Device details -> Location tab: live location, geofence, exit history.

import { useEffect, useState } from "react";
import { sendCommand } from "../commands/commandService";
import { getDevices, getGeofenceAlerts, removeGeofence, setGeofence } from "./deviceService";

export function LocationPanel({ device, token, onCommandSent, readOnly }) {
  const [lastLat, setLastLat] = useState(device.last_lat);
  const [lastLng, setLastLng] = useState(device.last_lng);
  const [lastAt, setLastAt] = useState(device.last_location_at);
  const [locating, setLocating] = useState(false);

  const [geoLat, setGeoLat] = useState(device.geofence_lat ?? "");
  const [geoLng, setGeoLng] = useState(device.geofence_lng ?? "");
  const [geoRadius, setGeoRadius] = useState(device.geofence_radius_meters ?? "");
  const [geoEnabled, setGeoEnabled] = useState(!!device.geofence_enabled);
  const [savingGeo, setSavingGeo] = useState(false);
  const [geoError, setGeoError] = useState("");

  const [alerts, setAlerts] = useState([]);

  function loadAlerts() {
    getGeofenceAlerts(token, device.device_uid).then(setAlerts).catch(() => {});
  }

  useEffect(() => {
    loadAlerts();
    // Also catches alerts that arrive while this tab is open — polling
    // every 15s is cheap and means the admin doesn't have to leave and
    // re-enter the tab to see a fresh exit.
    const interval = setInterval(loadAlerts, 15000);
    return () => clearInterval(interval);
  }, []);

  async function handleLocate() {
    setLocating(true);
    try {
      await sendCommand(token, device.device_uid, "locate_device");
      onCommandSent("Locate command sent — location will update below shortly");
      const sentAt = Date.now();
      const poll = setInterval(async () => {
        if (Date.now() - sentAt > 30000) { clearInterval(poll); return; }
        try {
          const data = await getDevices(token, { organization_id: device.organization_id, limit: 200 });
          const updated = data.devices.find((d) => d.device_uid === device.device_uid);
          if (updated && updated.last_location_at && updated.last_location_at !== lastAt) {
            setLastLat(updated.last_lat);
            setLastLng(updated.last_lng);
            setLastAt(updated.last_location_at);
            clearInterval(poll);
          }
        } catch (err) {
          // transient — keep polling
        }
      }, 3000);
    } catch (err) {
      onCommandSent(`Failed: ${err.message}`, true);
    } finally {
      setLocating(false);
    }
  }

  async function handleSaveGeofence(e) {
    e.preventDefault();
    if (!geoLat || !geoLng || !geoRadius) { setGeoError("Latitude, longitude, and radius are all required"); return; }
    setSavingGeo(true);
    setGeoError("");
    try {
      await setGeofence(token, device.device_uid, { lat: parseFloat(geoLat), lng: parseFloat(geoLng), radiusMeters: parseInt(geoRadius, 10) });
      setGeoEnabled(true);
      onCommandSent("Geofence saved");
    } catch (err) {
      setGeoError(err.message);
    } finally {
      setSavingGeo(false);
    }
  }

  async function handleRemoveGeofence() {
    if (!window.confirm("Remove this device's geofence?")) return;
    try {
      await removeGeofence(token, device.device_uid);
      setGeoEnabled(false);
      onCommandSent("Geofence removed");
    } catch (err) {
      onCommandSent(`Failed: ${err.message}`, true);
    }
  }

  const hasLocation = lastLat != null && lastLng != null;
  const osmSrc = hasLocation
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lastLng - 0.01}%2C${lastLat - 0.01}%2C${lastLng + 0.01}%2C${lastLat + 0.01}&layer=mapnik&marker=${lastLat}%2C${lastLng}`
    : null;
  const googleMapsUrl = hasLocation ? `https://www.google.com/maps?q=${lastLat},${lastLng}` : null;

  return (
    <div>
      <div className="dash-header-row">
        <h3 style={{ margin: 0 }}>Live Location</h3>
        {!readOnly && (
          <button onClick={handleLocate} disabled={locating}>{locating ? "Locating..." : "Locate Device"}</button>
        )}
      </div>

      {hasLocation ? (
        <>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0.4rem 0 0.8rem" }}>
            Last reported: {lastAt ? new Date(lastAt).toLocaleString() : "—"} — <span className="mono">{lastLat.toFixed(5)}, {lastLng.toFixed(5)}</span>
            {" "}· <a href={googleMapsUrl} target="_blank" rel="noreferrer">Open in Google Maps</a>
          </p>
          <iframe
            title="Device location"
            src={osmSrc}
            style={{ width: "100%", height: "280px", border: "1px solid var(--border)", borderRadius: "8px" }}
          />
        </>
      ) : (
        <p className="empty-state">No location reported yet. Click "Locate Device" to request one.</p>
      )}

      <h3 style={{ marginTop: "1.6rem" }}>Geofence</h3>
      <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "0 0 0.8rem" }}>
        Circular area — enter coordinates manually (copy from Google Maps) and a radius in meters. An alert is logged if the device leaves this area.
      </p>
      {readOnly ? (
        geoEnabled && geoLat && geoLng ? (
          <p style={{ fontSize: "0.78rem", color: "var(--teal)" }}>
            ✓ Active — {geoRadius}m radius around {parseFloat(geoLat).toFixed(5)}, {parseFloat(geoLng).toFixed(5)}
          </p>
        ) : (
          <p className="empty-state">No geofence configured.</p>
        )
      ) : (
        <form onSubmit={handleSaveGeofence} className="modal-form" style={{ maxWidth: "360px" }}>
          <label>Center latitude</label>
          <input value={geoLat} onChange={(e) => setGeoLat(e.target.value)} placeholder="e.g. 33.6844" />
          <label>Center longitude</label>
          <input value={geoLng} onChange={(e) => setGeoLng(e.target.value)} placeholder="e.g. 73.0479" />
          <label>Radius (meters)</label>
          <input value={geoRadius} onChange={(e) => setGeoRadius(e.target.value)} placeholder="e.g. 200" type="number" />
          {geoRadius && Number(geoRadius) < 100 && (
            <p style={{ fontSize: "0.74rem", color: "var(--amber)", margin: "0.3rem 0 0" }}>
              ⚠️ Android's geofencing isn't reliable below ~100m — GPS/Wi-Fi location accuracy alone can be off by 20-50m, so smaller radii often won't trigger.
            </p>
          )}
          {geoError && <p className="error-text">{geoError}</p>}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.8rem" }}>
            <button type="submit" disabled={savingGeo}>{savingGeo ? "Saving..." : "Save Geofence"}</button>
            {geoEnabled && <button type="button" className="danger" onClick={handleRemoveGeofence}>Remove Geofence</button>}
          </div>
        </form>
      )}
      {!readOnly && geoEnabled && geoLat && geoLng && (
        <p style={{ fontSize: "0.78rem", color: "var(--teal)", marginTop: "0.6rem" }}>
          ✓ Active — {geoRadius}m radius around {parseFloat(geoLat).toFixed(5)}, {parseFloat(geoLng).toFixed(5)}
        </p>
      )}

      <div className="dash-header-row" style={{ marginTop: "1.6rem" }}>
        <h3 style={{ margin: 0 }}>Geofence Exit History</h3>
        <button className="ghost-dark" onClick={loadAlerts}>Refresh</button>
      </div>
      {alerts.length > 0 ? (
        <div className="table-scroll"><table>
          <thead><tr><th>When</th><th>Location</th></tr></thead>
          <tbody>
            {alerts.map((a, i) => (
              <tr key={i}>
                <td>{new Date(a.triggered_at).toLocaleString()}</td>
                <td className="mono">{a.lat != null ? `${a.lat.toFixed(5)}, ${a.lng.toFixed(5)}` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      ) : (
        <p className="empty-state">No exits recorded yet.</p>
      )}
    </div>
  );
}
