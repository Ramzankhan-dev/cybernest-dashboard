// Devices: listing, stats, assignment, removal, enrollment tokens, installed apps, geofencing.

import { BASE_URL, authHeaders } from "../../services/apiClient";

export async function getDevices(token, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE_URL}/api/devices?${qs}`, {
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load devices");
  return data;
}

export async function getDeviceStats(token, organizationId = null) {
  const qs = organizationId ? `?organization_id=${organizationId}` : "";
  const res = await fetch(`${BASE_URL}/api/devices/stats${qs}`, { headers: authHeaders(token) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load device stats");
  return data;
}

export async function assignDeviceToEmployee(token, deviceUid, employeeId) {
  const res = await fetch(`${BASE_URL}/api/devices/${deviceUid}/assign`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ employee_id: employeeId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to assign device");
  return data;
}

export async function unassignDevice(token, deviceUid) {
  const res = await fetch(`${BASE_URL}/api/devices/${deviceUid}/unassign`, {
    method: "PATCH",
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to unassign device");
  return data;
}

export async function removeDevice(token, deviceUid) {
  const res = await fetch(`${BASE_URL}/api/devices/${deviceUid}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to remove device");
  return data;
}

export async function generateEnrollmentToken(token, employeeName, enrollmentProfileId = null, departmentId = null) {
  const res = await fetch(`${BASE_URL}/api/devices/generate-token`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ employee_name: employeeName, enrollment_profile_id: enrollmentProfileId, department_id: departmentId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to generate token");
  return data;
}

export async function getInstalledApps(token, deviceUid) {
  const res = await fetch(`${BASE_URL}/api/devices/${deviceUid}/apps`, {
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load apps");
  return data;
}

export async function setGeofence(token, deviceUid, { lat, lng, radiusMeters }) {
  const res = await fetch(`${BASE_URL}/api/devices/${deviceUid}/geofence`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ lat, lng, radius_meters: radiusMeters }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to save geofence");
  return data;
}

export async function removeGeofence(token, deviceUid) {
  const res = await fetch(`${BASE_URL}/api/devices/${deviceUid}/geofence`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to remove geofence");
  return data;
}

export async function getGeofenceAlerts(token, deviceUid) {
  const res = await fetch(`${BASE_URL}/api/devices/${deviceUid}/geofence-alerts`, { headers: authHeaders(token) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load geofence alerts");
  return data;
}
