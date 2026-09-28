// Organization settings and system health.

import { BASE_URL, authHeaders } from "../../services/apiClient";

export async function getSettings(token, organizationId = null) {
  const qs = organizationId ? `?organization_id=${organizationId}` : "";
  const res = await fetch(`${BASE_URL}/api/settings${qs}`, { headers: authHeaders(token) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load settings");
  return data;
}

export async function updateSettings(token, payload) {
  const res = await fetch(`${BASE_URL}/api/settings`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update settings");
  return data;
}

export async function resetSettings(token) {
  const res = await fetch(`${BASE_URL}/api/settings/reset`, {
    method: "POST",
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to reset settings");
  return data;
}

export async function getSystemHealth(token) {
  const res = await fetch(`${BASE_URL}/api/settings/health`, { headers: authHeaders(token) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load system health");
  return data;
}
