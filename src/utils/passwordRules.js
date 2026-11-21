// Password rule for employee / manager passwords: at least 8 characters, with both letters and numbers.
// Returns a user-friendly message, or "" when the password is fine. (Keep in sync with the backend utils/passwordRules.js.)

export const PASSWORD_HINT = "Minimum 8 characters, with both letters and numbers";

export function passwordRuleError(password) {
  if (!password || password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Za-z]/.test(password)) return "Password must include at least one letter (A-Z)";
  if (!/\d/.test(password)) return "Password must include at least one number (0-9)";
  return "";
}
