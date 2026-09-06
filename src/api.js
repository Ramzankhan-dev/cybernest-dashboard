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

export async function forgotPassword(email) {
  const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to send code");
  return data;
}

export async function verifyOtp(email, otp) {
  const res = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Invalid code");
  return data;
}

export async function resetPassword(email, otp, password) {
  const res = await fetch(`${BASE_URL}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to reset password");
  return data;
}

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

export async function globalSearch(token, q) {
  const res = await fetch(`${BASE_URL}/api/dashboard/search?q=${encodeURIComponent(q)}`, { headers: authHeaders(token) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Search failed");
  return data;
}

export async function getDevices(token, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE_URL}/api/devices?${qs}`, {
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load devices");
  return data;
}

export async function getDeviceStats(token, organizationId = null) {
  const qs = organizationId ? `?organization_id=${organizationId}` : "";
  const res = await fetch(`${BASE_URL}/api/devices/stats${qs}`, { headers: authHeaders(token) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load device stats");
  return data;
}

export async function assignDeviceToEmployee(token, deviceUid, employeeId) {
  const res = await fetch(`${BASE_URL}/api/devices/${deviceUid}/assign`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ employee_id: employeeId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to assign device");
  return data;
}

export async function unassignDevice(token, deviceUid) {
  const res = await fetch(`${BASE_URL}/api/devices/${deviceUid}/unassign`, {
    method: "PATCH",
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to unassign device");
  return data;
}

export async function removeDevice(token, deviceUid) {
  const res = await fetch(`${BASE_URL}/api/devices/${deviceUid}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to remove device");
  return data;
}

export async function generateEnrollmentToken(token, employeeName, enrollmentProfileId = null) {
  const res = await fetch(`${BASE_URL}/api/devices/generate-token`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ employee_name: employeeName, enrollment_profile_id: enrollmentProfileId }),
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

export async function getActivityLogs(token, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE_URL}/api/commands?${qs}`, {
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load activity logs");
  return data;
}

export async function sendCommandMulti(token, deviceUids, commandType, packageName = null) {
  const body = { device_uids: deviceUids, command_type: commandType };
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

export async function cancelCommand(token, id) {
  const res = await fetch(`${BASE_URL}/api/commands/${id}/cancel`, {
    method: "PATCH",
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to cancel command");
  return data;
}

export async function retryCommand(token, id) {
  const res = await fetch(`${BASE_URL}/api/commands/${id}/retry`, {
    method: "POST",
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to retry command");
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

export async function changeEmployeeRole(token, id, role) {
  const res = await fetch(`${BASE_URL}/api/employees/${id}/role`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ role }),
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

export async function getApplications(token, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE_URL}/api/applications?${qs}`, { headers: authHeaders(token) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load applications");
  return data;
}

export async function getApplicationStats(token, organizationId = null) {
  const qs = organizationId ? `?organization_id=${organizationId}` : "";
  const res = await fetch(`${BASE_URL}/api/applications/stats${qs}`, { headers: authHeaders(token) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load application stats");
  return data;
}

export async function createApplication(token, payload) {
  const res = await fetch(`${BASE_URL}/api/applications`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to register application");
  return data;
}

export async function updateApplication(token, id, payload) {
  const res = await fetch(`${BASE_URL}/api/applications/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update application");
  return data;
}

export async function assignApplication(token, id, target) {
  const res = await fetch(`${BASE_URL}/api/applications/${id}/assign`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(target),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to assign application");
  return data;
}

export async function blockApplication(token, id) {
  const res = await fetch(`${BASE_URL}/api/applications/${id}/block`, {
    method: "PATCH",
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to block application");
  return data;
}

export async function allowApplication(token, id) {
  const res = await fetch(`${BASE_URL}/api/applications/${id}/allow`, {
    method: "PATCH",
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to allow application");
  return data;
}

export async function deleteApplication(token, id) {
  const res = await fetch(`${BASE_URL}/api/applications/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to delete application");
  return data;
}

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
