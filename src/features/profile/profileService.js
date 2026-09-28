// Current admin account: password change and API keys.

import { BASE_URL, authHeaders } from "../../services/apiClient";

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
