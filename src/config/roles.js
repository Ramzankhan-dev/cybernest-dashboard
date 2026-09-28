// Role identifiers used for navigation visibility, and their display labels.
// These strings come from the backend (user.role / user.is_super_admin) —
// do not rename them.

export const ROLES = {
  SUPER_ADMIN: "SuperAdmin",
  ORG_ADMIN: "OrganizationAdmin",
  DEPT_MANAGER: "DepartmentManager",
};

// Role key used for permission checks (Super Admins are flagged separately).
export function getRoleName(user) {
  return user.is_super_admin ? "SuperAdmin" : user.role;
}

// Human-readable role shown in the header / sidebar.
export function getRoleLabel(user) {
  return user.is_super_admin ? "Super Admin" : user.role === "DepartmentManager" ? "Department Manager" : "Organization Admin";
}
