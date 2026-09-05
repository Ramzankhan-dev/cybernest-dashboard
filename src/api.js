// Backend's live URL on Render
const BASE_URL = "https://cybernest-backend-ar04.onrender.com";

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  return data; // { token, user }
}

export async function getDevices(token) {
  const res = await fetch(`${BASE_URL}/api/devices`, {
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load devices");
  return data;
}

export async function generateEnrollmentToken(token, employeeName) {
  const res = await fetch(`${BASE_URL}/api/devices/generate-token`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ employee_name: employeeName }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to generate token");
  return data;
}

export async function sendCommand(token, deviceUid, commandType, packageName = null) {
  const body = { device_uid: deviceUid, command_type: commandType };
  if (packageName) body.package_name = packageName;

  const res = await fetch(`${BASE_URL}/api/commands/send`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to send command");
  return data;
}

export async function getCommandHistory(token, deviceUid) {
  const res = await fetch(`${BASE_URL}/api/commands/${deviceUid}`, {
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load command history");
  return data;
}

export async function getInstalledApps(token, deviceUid) {
  const res = await fetch(`${BASE_URL}/api/devices/${deviceUid}/apps`, {
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load apps");
  return data;
}

export async function getActivityLogs(token) {
  const res = await fetch(`${BASE_URL}/api/commands`, {
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load activity logs");
  return data;
}

export async function changePassword(token, currentPassword, newPassword) {
  const res = await fetch(`${BASE_URL}/api/auth/change-password`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to change password");
  return data;
}

export async function generateApiKey(token) {
  const res = await fetch(`${BASE_URL}/api/auth/api-keys`, {
    method: "POST",
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to generate API key");
  return data;
}

export async function getApiKeys(token) {
  const res = await fetch(`${BASE_URL}/api/auth/api-keys`, {
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load API keys");
  return data;
}

export async function sendNotification(token, message, target = {}) {
  const body = { message, ...target };

  const res = await fetch(`${BASE_URL}/api/notifications/send`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to send notification");
  return data;
}

export async function getNotifications(token) {
  const res = await fetch(`${BASE_URL}/api/notifications`, {
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load notifications");
  return data;
}

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

export async function getDepartments(token) {
  const res = await fetch(`${BASE_URL}/api/departments`, {
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load departments");
  return data;
}

export async function createDepartment(token, name, defaultPolicyId) {
  const res = await fetch(`${BASE_URL}/api/departments`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ name, default_policy_id: defaultPolicyId || null }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create department");
  return data;
}

export async function getEmployees(token) {
  const res = await fetch(`${BASE_URL}/api/employees`, {
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load employees");
  return data;
}

export async function createEmployee(token, name, employeeCode, departmentId) {
  const res = await fetch(`${BASE_URL}/api/employees`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ name, employee_code: employeeCode || null, department_id: departmentId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to add employee");
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

export async function getPolicies(token) {
  const res = await fetch(`${BASE_URL}/api/policies`, {
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
