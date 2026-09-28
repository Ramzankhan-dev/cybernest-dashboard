// Organizations (Super Admin) and the current admin's own organization.

import { BASE_URL, authHeaders } from "../../services/apiClient";

export async function getMyOrganization(token) {
  const res = await fetch(`${BASE_URL}/api/organizations/me`, {
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load organization");
  return data;
}

export async function updateMyOrganization(token, name) {
  const res = await fetch(`${BASE_URL}/api/organizations/me`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update organization");
  return data;
}

export async function getAllOrganizations(token, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE_URL}/api/organizations?${qs}`, { headers: authHeaders(token) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load organizations");
  return data;
}

export async function createOrganization(token, payload) {
  const res = await fetch(`${BASE_URL}/api/organizations`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create organization");
  return data;
}

export async function updateOrganization(token, id, payload) {
  const res = await fetch(`${BASE_URL}/api/organizations/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update organization");
  return data;
}

export async function setOrganizationStatus(token, id, status) {
  const res = await fetch(`${BASE_URL}/api/organizations/${id}/status`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update status");
  return data;
}

export async function deleteOrganization(token, id) {
  const res = await fetch(`${BASE_URL}/api/organizations/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to delete organization");
  return data;
}
