// Managed applications and direct APK upload / install.

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

// ===================== Direct APK Install =====================

// Uses XMLHttpRequest (not fetch) specifically because fetch has no
// upload-progress API — for a large APK over a slow uplink, that made
// the modal look frozen with zero feedback even when it was working.
export function uploadApkPackage(token, { appName, packageName, versionName, file }, onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("app_name", appName);
    formData.append("package_name", packageName);
    if (versionName) formData.append("version_name", versionName);
    formData.append("apk", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE_URL}/api/applications/packages`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve(data);
        else reject(new Error(data.error || "Failed to upload APK"));
      } catch (err) {
        reject(new Error("Failed to upload APK"));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.ontimeout = () => reject(new Error("Upload timed out"));
    xhr.timeout = 10 * 60 * 1000; // 10 minutes — generous for a slow uplink

    xhr.send(formData);
  });
}

export async function getApkPackages(token, organizationId) {
  const qs = organizationId ? `?organization_id=${organizationId}` : "";
  const res = await fetch(`${BASE_URL}/api/applications/packages${qs}`, { headers: authHeaders(token) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load APK packages");
  return data;
}

export async function deleteApkPackage(token, id) {
  const res = await fetch(`${BASE_URL}/api/applications/packages/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to delete package");
  return data;
}

export async function installApkPackage(token, id, deviceUid) {
  const res = await fetch(`${BASE_URL}/api/applications/packages/${id}/install`, {
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
