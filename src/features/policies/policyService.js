// Policies CRUD, assignment (device / department), and per-device policy state.

import { BASE_URL, authHeaders } from "../../services/apiClient";

export async function getPolicies(token, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE_URL}/api/policies?${qs}`, {
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load policies");
  return data;
}

export async function createPolicy(token, policy) {
  const res = await fetch(`${BASE_URL}/api/policies`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(policy),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create policy");
  return data;
}

export async function updatePolicy(token, id, policy) {
  const res = await fetch(`${BASE_URL}/api/policies/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(policy),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update policy");
  return data;
}

export async function duplicatePolicy(token, id) {
  const res = await fetch(`${BASE_URL}/api/policies/${id}/duplicate`, {
    method: "POST",
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to duplicate policy");
  return data;
}

export async function setPolicyStatus(token, id, status) {
  const res = await fetch(`${BASE_URL}/api/policies/${id}/status`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update status");
  return data;
}

export async function deletePolicy(token, id) {
  const res = await fetch(`${BASE_URL}/api/policies/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to delete policy");
  return data;
}

export async function getPolicyVersions(token, id) {
  const res = await fetch(`${BASE_URL}/api/policies/${id}/versions`, { headers: authHeaders(token) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load version history");
  return data;
}

export async function assignPolicyToDepartment(token, policyId, departmentId) {
  const res = await fetch(`${BASE_URL}/api/policies/${policyId}/assign-department`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ department_id: departmentId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to assign policy to department");
  return data;
}

export async function assignPolicy(token, policyId, deviceUid) {
  const res = await fetch(`${BASE_URL}/api/policies/${policyId}/assign`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ device_uid: deviceUid }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to apply policy");
  return data;
}

export async function unassignPolicyFromAll(token, id) {
  const res = await fetch(`${BASE_URL}/api/policies/${id}/unassign`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to unassign policy");
  return data;
}

export async function unassignDevicePolicy(token, deviceUid) {
  const res = await fetch(`${BASE_URL}/api/devices/${deviceUid}/policy`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to unassign policy");
  return data;
}

export async function getCurrentPolicy(token, deviceUid) {
  const res = await fetch(`${BASE_URL}/api/devices/${deviceUid}/current-policy`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load current policy");
  return data;
}

export async function getPolicyHistory(token, deviceUid) {
  const res = await fetch(`${BASE_URL}/api/devices/${deviceUid}/policy-history`, { headers: authHeaders(token) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load policy history");
  return data;
}
