// Display formatting helpers.

// Up to two initials from the user's name (falls back to email), e.g. "EC".
export function getUserInitials(user) {
  return (user.name || user.email || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}
