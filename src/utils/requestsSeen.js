// Tracks which device requests (unenroll / support) the logged-in admin or manager has already looked at,
// so the dashboard can flag new ones. Stored per user in this browser.

function key(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return `cybernest_seen_request_${payload.id}`;
  } catch {
    return "cybernest_seen_request";
  }
}

function getSeenId(token) {
  try { return parseInt(localStorage.getItem(key(token)) || "0", 10) || 0; } catch { return 0; }
}

export function countUnseenRequests(token, requests) {
  const seen = getSeenId(token);
  return (requests || []).filter((r) => Number(r.id) > seen).length;
}

export function markRequestsSeen(token, requests) {
  const max = Math.max(0, ...(requests || []).map((r) => Number(r.id) || 0));
  try { if (max > getSeenId(token)) localStorage.setItem(key(token), String(max)); } catch { /* storage unavailable */ }
}
