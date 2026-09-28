// Number helpers.

export function percentOf(part, whole) {
  const p = Number(part) || 0;
  const w = Number(whole) || 0;
  if (w <= 0) return null;
  return Math.round((p / w) * 100);
}
