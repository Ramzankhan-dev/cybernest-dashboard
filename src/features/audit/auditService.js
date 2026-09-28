// Audit log listing and stats.

import { BASE_URL, authHeaders } from "../../services/apiClient";

export async function getAuditLogs(token, params = {}) {
  const cleanParams = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== ""));
  const qs = new URLSearchParams(cleanParams).toString();
  const res = await fetch(`${BASE_URL}/api/audit-logs?${qs}`, { headers: authHeaders(token) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load audit logs");
  return data;
}

export async function getAuditLogStats(token, organizationId = null) {
  const qs = organizationId ? `?organization_id=${organizationId}` : "";
  const res = await fetch(`${BASE_URL}/api/audit-logs/stats${qs}`, { headers: authHeaders(token) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load audit log stats");
  return data;
}
