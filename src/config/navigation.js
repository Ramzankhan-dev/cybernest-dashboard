// Sidebar navigation configuration.
//
// getNavItems(): every page, its label, icon and which roles may see it.
//   `key` is the page id used by the router (routes/AppRoutes.jsx) and the
//   URL hash (#devices, #policies ...). Role visibility is enforced here.
// NAV_LAYOUT: how visible items are arranged in the sidebar - standalone
//   entries and collapsible groups. Purely visual; a group only shows the
//   children the current role is allowed to see.

import {
  IconAlertTriangle,
  IconBarChart,
  IconBuilding,
  IconCheckCircle,
  IconDashboard,
  IconFolder,
  IconMegaphone,
  IconPackage,
  IconScroll,
  IconSettings,
  IconShieldCheck,
  IconSmartphone,
  IconUser,
  IconUsers,
  IconZap,
  IconLayers,
  IconLock,
  IconSliders,
} from "../components/icons";
import { ROLES, getRoleName } from "./roles";

export function getNavItems(user) {
  return [
    { key: "overview", label: "Dashboard", icon: IconDashboard, roles: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.DEPT_MANAGER] },
    { key: "org", label: `${user.is_super_admin ? "Organizations" : "Organization"}`, icon: IconBuilding, roles: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN] },
    { key: "departments", label: "Departments", icon: IconFolder, roles: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN] },
    { key: "employees", label: "Employees", icon: IconUsers, roles: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.DEPT_MANAGER] },
    { key: "devices", label: "Devices", icon: IconSmartphone, roles: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.DEPT_MANAGER] },
    { key: "policies", label: "Policies", icon: IconShieldCheck, roles: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN] },
    { key: "activity", label: "Audit Logs", icon: IconScroll, roles: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN] },
    { key: "commands", label: "Commands", icon: IconZap, roles: [ROLES.ORG_ADMIN, ROLES.DEPT_MANAGER] },
    { key: "compliance", label: "Compliance", icon: IconCheckCircle, roles: [ROLES.ORG_ADMIN, ROLES.DEPT_MANAGER] },
    { key: "applications", label: "Applications", icon: IconPackage, roles: [ROLES.ORG_ADMIN] },
    { key: "alerts", label: "Alerts", icon: IconAlertTriangle, roles: [ROLES.ORG_ADMIN, ROLES.DEPT_MANAGER] },
    { key: "notifications", label: "Notifications", icon: IconMegaphone, roles: [ROLES.ORG_ADMIN, ROLES.DEPT_MANAGER] },
    { key: "reports", label: "Reports", icon: IconBarChart, roles: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.DEPT_MANAGER] },
    { key: "profile", label: "Profile", icon: IconUser, roles: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.DEPT_MANAGER] },
    { key: "settings", label: "Settings", icon: IconSettings, roles: [ROLES.ORG_ADMIN] },
  ];
}

// Items the given user is allowed to see (same rule as before the refactor).
export function getVisibleNavItems(user) {
  const roleName = getRoleName(user);
  return getNavItems(user).filter((item) => item.roles.includes(roleName));
}

// Display layout. Strings are nav item keys (routes unchanged).
export const NAV_LAYOUT = [
  "overview",
  { id: "management", label: "Management", icon: IconLayers, children: ["org", "departments", "employees", "devices"] },
  { id: "security", label: "Security", icon: IconLock, children: ["policies", "compliance", "alerts", "activity"] },
  { id: "operations", label: "Operations", icon: IconSliders, children: ["commands", "applications", "notifications"] },
  "reports",
  "profile",
  "settings",
];

export const GROUP_OF = {};
NAV_LAYOUT.forEach((entry) => {
  if (typeof entry !== "string") entry.children.forEach((k) => { GROUP_OF[k] = entry.id; });
});
