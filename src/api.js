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
