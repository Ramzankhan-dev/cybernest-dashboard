// Enrollment profiles and enrollment history.

import { BASE_URL, authHeaders } from "../../services/apiClient";

export async function createEnrollmentProfile(token, payload) {
  const res = await fetch(`${BASE_URL}/api/enrollment/profiles`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create profile");
  return data;
}

export async function getEnrollmentProfiles(token, organizationId) {
  const res = await fetch(`${BASE_URL}/api/enrollment/profiles?organization_id=${organizationId}`, { headers: authHeaders(token) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load profiles");
  return data;
}

export async function deleteEnrollmentProfile(token, id) {
  const res = await fetch(`${BASE_URL}/api/enrollment/profiles/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to delete profile");
  return data;
}

export async function getEnrollmentHistory(token, organizationId) {
  const res = await fetch(`${BASE_URL}/api/enrollment/history?organization_id=${organizationId}`, { headers: authHeaders(token) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load enrollment history");
  return data;
}
