// Dashboard overview data: summary KPIs, charts, recent activity, alerts.

import { BASE_URL, authHeaders } from "../../services/apiClient";

export async function getDashboardSummary(token) {
  const res = await fetch(`${BASE_URL}/api/dashboard/summary`, { headers: authHeaders(token) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load dashboard");
  return data;
}

export async function getDashboardCharts(token) {
  const res = await fetch(`${BASE_URL}/api/dashboard/charts`, { headers: authHeaders(token) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load charts");
  return data;
}

export async function getDashboardActivity(token) {
  const res = await fetch(`${BASE_URL}/api/dashboard/activity`, { headers: authHeaders(token) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load activity");
  return data;
}

export async function getDashboardAlerts(token) {
  const res = await fetch(`${BASE_URL}/api/dashboard/alerts`, { headers: authHeaders(token) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load alerts");
  return data;
}
