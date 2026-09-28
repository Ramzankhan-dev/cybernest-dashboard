// Device commands: send (single / multi), history, status, cancel, retry.

import { BASE_URL, authHeaders } from "../../services/apiClient";

export async function sendCommand(token, deviceUid, commandType, packageName = null) {
  const body = { device_uid: deviceUid, command_type: commandType };
  if (packageName) body.package_name = packageName;

  const res = await fetch(`${BASE_URL}/api/commands/send`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to send command");
  return data;
}

export async function getCommandHistory(token, deviceUid) {
  const res = await fetch(`${BASE_URL}/api/commands/${deviceUid}`, {
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load command history");
  return data;
}

export async function getActivityLogs(token, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE_URL}/api/commands?${qs}`, {
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load activity logs");
  return data;
}

export async function sendCommandMulti(token, deviceUids, commandType, packageName = null) {
  const body = { device_uids: deviceUids, command_type: commandType };
  if (packageName) body.package_name = packageName;
  const res = await fetch(`${BASE_URL}/api/commands/send`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to send command");
  return data;
}

export async function cancelCommand(token, id) {
  const res = await fetch(`${BASE_URL}/api/commands/${id}/cancel`, {
    method: "PATCH",
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to cancel command");
  return data;
}

export async function retryCommand(token, id) {
  const res = await fetch(`${BASE_URL}/api/commands/${id}/retry`, {
    method: "POST",
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to retry command");
  return data;
}

export async function getCommandStatus(token, commandId) {
  const res = await fetch(`${BASE_URL}/api/commands/${commandId}/status`, { headers: authHeaders(token) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to check install status");
  return data;
}
