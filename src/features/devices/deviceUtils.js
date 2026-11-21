// Device helpers shared across device views.

export function isDeviceOnline(device) {
  if (!device.last_seen) return false;
  return Date.now() - new Date(device.last_seen).getTime() < 90_000;
}

// How the device was enrolled. The backend sends enrollment_type; older responses fall back to the profile id.
export function enrollmentTypeLabel(device) {
  if (device.enrollment_type) return device.enrollment_type;
  return device.enrollment_profile_id ? "Profile Enrollment" : "Normal Enrollment";
}
