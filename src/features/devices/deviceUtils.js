// Device helpers shared across device views.

export function isDeviceOnline(device) {
  if (!device.last_seen) return false;
  return Date.now() - new Date(device.last_seen).getTime() < 90_000;
}
