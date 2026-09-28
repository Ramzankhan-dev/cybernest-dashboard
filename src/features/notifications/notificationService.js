// Push notifications: send, schedule, cancel, resend, stats, history.

import { BASE_URL, authHeaders } from "../../services/apiClient";

export async function sendNotification(token, payload) {
  const res = await fetch(`${BASE_URL}/api/notifications/send`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to send notification");
  return data;
}

export async function scheduleNotification(token, payload) {
  const res = await fetch(`${BASE_URL}/api/notifications/schedule`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to schedule notification");
  return data;
}

export async function cancelNotification(token, id) {
  const res = await fetch(`${BASE_URL}/api/notifications/${id}/cancel`, {
    method: "PATCH",
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to cancel notification");
  return data;
}

export async function resendNotification(token, id) {
  const res = await fetch(`${BASE_URL}/api/notifications/${id}/resend`, {
    method: "POST",
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to resend notification");
  return data;
}

export async function getNotificationStats(token) {
  const res = await fetch(`${BASE_URL}/api/notifications/stats`, { headers: authHeaders(token) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load notification stats");
  return data;
}

export async function getNotifications(token, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE_URL}/api/notifications?${qs}`, {
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load notifications");
  return data;
}
