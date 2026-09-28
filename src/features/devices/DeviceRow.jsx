// Table-row presentation of a device.

import { useState } from "react";
import { removeDevice } from "./deviceService";
import { isDeviceOnline } from "./deviceUtils";

export function DeviceRow({ device, onViewDetails, token, onRemoved }) {
  const online = isDeviceOnline(device);
  const [removing, setRemoving] = useState(false);

  async function handleRemove() {
    if (!window.confirm(`Remove device "${device.employee_name || device.device_uid}"? This unenrolls it and clears all its policy associations.`)) return;
    setRemoving(true);
    try {
      await removeDevice(token, device.device_uid);
      onRemoved();
    } catch (err) {
      alert(err.message);
    } finally {
      setRemoving(false);
    }
  }

  return (
    <tr>
      <td>
        <span className={`status-dot ${online ? "online" : "pending"}`} />
        {device.assigned_employee_name || device.employee_name || "Unassigned"}
      </td>
      <td>{device.department_name || "—"}</td>
      <td className="mono">{device.device_uid}</td>
      <td>{device.model || "—"}</td>
      <td>{device.android_version || "—"}</td>
      <td>{device.battery_level != null ? `${device.battery_level}%` : "—"}</td>
      <td>{online ? "online" : "offline"}</td>
      <td className="actions">
        <button onClick={() => onViewDetails(device.device_uid)}>View details</button>
        <button className="danger" disabled={removing} onClick={handleRemove}>Remove</button>
      </td>
    </tr>
  );
}
