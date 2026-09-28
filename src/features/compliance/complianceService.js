// Compliance records, summary and forced sync.

import { BASE_URL, authHeaders } from "../../services/apiClient";

export async function getCompliance(token, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE_URL}/api/compliance?${qs}`, { headers: authHeaders(token) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load compliance data");
  return data;
}

export async function getComplianceSummary(token, organizationId = null) {
  const qs = organizationId ? `?organization_id=${organizationId}` : "";
  const res = await fetch(`${BASE_URL}/api/compliance/summary${qs}`, { headers: authHeaders(token) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load compliance summary");
  return data;
}

export async function forceSyncDevice(token, deviceUid) {
  const res = await fetch(`${BASE_URL}/api/compliance/sync`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ device_uid: deviceUid }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to sync device");
  return data;
}
