// Employees CRUD, role/department/status changes, device assignment, passwords.

import { BASE_URL, authHeaders } from "../../services/apiClient";

export async function getEmployees(token, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE_URL}/api/employees?${qs}`, {
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load employees");
  return data;
}

export async function createEmployee(token, payload) {
  const res = await fetch(`${BASE_URL}/api/employees`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to add employee");
  return data;
}

export async function updateEmployee(token, id, payload) {
  const res = await fetch(`${BASE_URL}/api/employees/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update employee");
  return data;
}

export async function changeEmployeeDepartment(token, id, departmentId) {
  const res = await fetch(`${BASE_URL}/api/employees/${id}/department`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ department_id: departmentId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to change department");
  return data;
}

export async function changeEmployeeRole(token, id, role, password) {
  const res = await fetch(`${BASE_URL}/api/employees/${id}/role`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ role, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to change role");
  return data;
}

export async function deleteEmployee(token, id) {
  const res = await fetch(`${BASE_URL}/api/employees/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to delete employee");
  return data;
}

export async function assignEmployeeDevice(token, employeeId, deviceUid) {
  const res = await fetch(`${BASE_URL}/api/employees/${employeeId}/assign-device`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ device_uid: deviceUid }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to assign device");
  return data;
}

export async function setEmployeeStatus(token, employeeId, status) {
  const res = await fetch(`${BASE_URL}/api/employees/${employeeId}/status`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update employee status");
  return data;
}

export async function setEmployeePassword(token, employeeId, password) {
  const res = await fetch(`${BASE_URL}/api/employees/${employeeId}/set-password`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to set password");
  return data;
}
