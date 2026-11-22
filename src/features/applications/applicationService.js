// Managed applications (APK upload + install) and install history.

import { BASE_URL, authHeaders } from "../../services/apiClient";

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

// Multipart upload via XMLHttpRequest (not fetch) because fetch has no
// upload-progress API — for a large APK over a slow uplink the modal would
// look frozen even when it was working. Used for both add and edit.
function sendApplicationForm(token, method, url, fields, file, onProgress, fallbackError) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    Object.entries(fields).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") formData.append(k, v);
    });
    if (file) formData.append("apk", file);

    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve(data);
        else reject(new Error(data.error || fallbackError));
      } catch (err) {
        reject(new Error(fallbackError));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.ontimeout = () => reject(new Error("Upload timed out"));
    xhr.timeout = 10 * 60 * 1000; // 10 minutes — generous for a slow uplink
    xhr.send(formData);
  });
}

export function createApplication(token, fields, file, onProgress) {
  return sendApplicationForm(token, "POST", `${BASE_URL}/api/applications`, fields, file, onProgress, "Failed to add application");
}

export function updateApplication(token, id, fields, file, onProgress) {
  return sendApplicationForm(token, "PUT", `${BASE_URL}/api/applications/${id}`, fields, file, onProgress, "Failed to update application");
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

export async function getApplicationAssignments(token, id) {
  const res = await fetch(`${BASE_URL}/api/applications/${id}/assignments`, { headers: authHeaders(token) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load assignments");
  return data;
}

export async function unassignApplication(token, id, target) {
  const res = await fetch(`${BASE_URL}/api/applications/${id}/unassign`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(target),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to unassign application");
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

// ===================== Install to device =====================

export async function installApplication(token, id, deviceUid) {
  const res = await fetch(`${BASE_URL}/api/applications/${id}/install`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ device_uid: deviceUid }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to push install");
  return data;
}

export async function getInstallHistory(token, organizationId) {
  const qs = organizationId ? `?organization_id=${organizationId}` : "";
  const res = await fetch(`${BASE_URL}/api/applications/packages/installs${qs}`, { headers: authHeaders(token) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load install history");
  return data;
}

// ===================== Location & Geofencing =====================
