// Global search used by the top header.

import { BASE_URL, authHeaders } from "./apiClient";

export async function globalSearch(token, q) {
  const res = await fetch(`${BASE_URL}/api/dashboard/search?q=${encodeURIComponent(q)}`, { headers: authHeaders(token) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Search failed");
  return data;
}
