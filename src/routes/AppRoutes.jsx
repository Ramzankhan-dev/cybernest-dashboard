// Page router: maps the current page key (see config/navigation.js) to its
// feature view. Super Admins get an organization picker first on several
// pages. To add a page: create features/<name>/, add a nav item in
// config/navigation.js, and add a line here.
import { AlertsView } from "../features/alerts/Alerts";
import { ApplicationsView } from "../features/applications/Applications";
import { AuditLogsOrgCardsView, AuditLogsView } from "../features/audit/AuditLogs";
import { CommandCenterView } from "../features/commands/Commands";
import { ComplianceView } from "../features/compliance/Compliance";
import { DashboardOverview } from "../features/dashboard/Dashboard";
import { DepartmentsOrgCardsView, DepartmentsView } from "../features/departments/Departments";
import { DevicesDeptCardsView, DevicesOrgCardsView } from "../features/devices/Devices";
import { EmployeesOrgCardsView, EmployeesView } from "../features/employees/Employees";
import { NotificationCenterView } from "../features/notifications/Notifications";
import { OrganizationView, OrganizationsAdminView } from "../features/organizations/Organizations";
import { PoliciesOrgCardsView, PoliciesPageView } from "../features/policies/Policies";
import { ProfileView } from "../features/profile/Profile";
import { ReportsView } from "../features/reports/Reports";
import { SettingsView } from "../features/settings/Settings";

export default function AppRoutes({ page, setPage, token, user, devices, policies, loadPolicies, showToast }) {
  return (
    <main>
      {page === "overview" && <DashboardOverview token={token} user={user} onNavigate={setPage} />}
      {page === "org" && (user.is_super_admin ? <OrganizationsAdminView token={token} /> : <OrganizationView token={token} />)}
      {page === "departments" && (user.is_super_admin
        ? <DepartmentsOrgCardsView token={token} policies={policies} />
        : <DepartmentsView token={token} policies={policies} user={user} />)}
      {page === "employees" && (user.is_super_admin
        ? <EmployeesOrgCardsView token={token} />
        : <EmployeesView token={token} organizationId={user.organization_id} user={user} />)}
      {page === "activity" && (user.is_super_admin
        ? <AuditLogsOrgCardsView token={token} />
        : <AuditLogsView token={token} organizationId={user.organization_id} />)}
      {page === "commands" && <CommandCenterView token={token} organizationId={user.organization_id} isSuperAdmin={user.is_super_admin} showToast={showToast} />}
      {page === "compliance" && <ComplianceView token={token} organizationId={user.organization_id} isSuperAdmin={user.is_super_admin} showToast={showToast} />}
      {page === "applications" && <ApplicationsView token={token} organizationId={user.organization_id} showToast={showToast} />}
      {page === "alerts" && <AlertsView devices={devices} token={token} organizationId={user.organization_id} />}
      {page === "profile" && <ProfileView token={token} user={user} />}
      {page === "settings" && <SettingsView token={token} organizationId={user.organization_id} policies={policies} showToast={showToast} />}
      {page === "notifications" && <NotificationCenterView token={token} devices={devices} organizationId={user.organization_id} />}
      {page === "reports" && <ReportsView devices={devices} policies={policies} token={token} organizationId={user.organization_id} />}

      {page === "devices" && (user.is_super_admin
        ? <DevicesOrgCardsView token={token} policies={policies} showToast={showToast} user={user} />
        : <DevicesDeptCardsView token={token} policies={policies} organizationId={user.organization_id} showToast={showToast} user={user} />)}
      {page === "policies" && (user.is_super_admin
        ? <PoliciesOrgCardsView token={token} showToast={showToast} onGlobalRefresh={loadPolicies} />
        : <PoliciesPageView token={token} organizationId={user.organization_id} showToast={showToast} onGlobalRefresh={loadPolicies} />)}
    </main>
  );
}
