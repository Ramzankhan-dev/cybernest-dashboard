// Shared API client pieces used by every feature service.
// Backend's live URL on Render
export const BASE_URL = "https://cybernest-backend-ar04.onrender.com";

export function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}
