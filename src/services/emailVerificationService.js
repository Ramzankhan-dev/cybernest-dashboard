// Email OTP verification — send a code to an email, then confirm it.

import { BASE_URL, authHeaders } from "./apiClient";

export async function sendEmailCode(token, email) {
  const res = await fetch(`${BASE_URL}/api/email-verification/send`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to send code");
  return data;
}

export async function confirmEmailCode(token, email, otp) {
  const res = await fetch(`${BASE_URL}/api/email-verification/confirm`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ email, otp }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to verify code");
  return data;
}
