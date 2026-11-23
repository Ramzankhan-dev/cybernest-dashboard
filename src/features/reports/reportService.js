// Platform-wide (Super Admin) reports and the custom report builder.

import { BASE_URL, authHeaders } from "../../services/apiClient";

export async function getPlatformReport(token, name, params = {}) {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v !== null && v !== undefined));
  const qs = new URLSearchParams(clean).toString();
  const res = await fetch(`${BASE_URL}/api/reports/${name}${qs ? `?${qs}` : ""}`, { headers: authHeaders(token) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load report");
  return data;
}

export async function getCustomReportMeta(token) {
  const res = await fetch(`${BASE_URL}/api/reports/custom/meta`, { headers: authHeaders(token) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load report builder");
  return data;
}

export async function runCustomReport(token, payload) {
  const res = await fetch(`${BASE_URL}/api/reports/custom`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to run report");
  return data;
}

// Department Manager custom report builder (always limited to the manager's own department).
export async function getManagerReportMeta(token) {
  const res = await fetch(`${BASE_URL}/api/manager-reports/custom/meta`, { headers: authHeaders(token) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load report builder");
  return data;
}

export async function runManagerReport(token, payload) {
  const res = await fetch(`${BASE_URL}/api/manager-reports/custom`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to run report");
  return data;
}
