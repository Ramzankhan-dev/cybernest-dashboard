// Departments CRUD and manager assignment.

import { BASE_URL, authHeaders } from "../../services/apiClient";

export async function getDepartments(token, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE_URL}/api/departments?${qs}`, {
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load departments");
  return data;
}

export async function createDepartment(token, payload) {
  const res = await fetch(`${BASE_URL}/api/departments`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create department");
  return data;
}

export async function updateDepartment(token, id, payload) {
  const res = await fetch(`${BASE_URL}/api/departments/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update department");
  return data;
}

export async function assignDepartmentManager(token, id, managerEmployeeId) {
  const res = await fetch(`${BASE_URL}/api/departments/${id}/manager`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ manager_employee_id: managerEmployeeId || null }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to assign manager");
  return data;
}

export async function deleteDepartment(token, id) {
  const res = await fetch(`${BASE_URL}/api/departments/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to delete department");
  return data;
}
