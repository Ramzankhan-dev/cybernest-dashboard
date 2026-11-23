// Reports page for Organization Admin / Department Manager: pick a report, see it on the page,
// then download it as PDF or Excel (CSV). Includes a Custom Report Builder tab.
// (Super Admin has its own platform-wide page in SuperAdminReports.jsx.)

import { useEffect, useState } from "react";
import { RefreshButton } from "../../components/common/RefreshButton";
import { exportToCSV, exportToPDF } from "../../utils/exportUtils";
import { getApplications } from "../applications/applicationService";
import { getActivityLogs } from "../commands/commandService";
import { getCompliance } from "../compliance/complianceService";
import { getDepartments } from "../departments/departmentService";
import { isDeviceOnline } from "../devices/deviceUtils";
import { getEmployees } from "../employees/employeeService";
import { ManagerCustomReportBuilder } from "./ManagerCustomReport";
import { formatDateTime } from "../../utils/dateFormat";

function ReportTable({ title, headers, rows, filenameBase }) {
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div className="dash-header-row">
        <h3 style={{ fontSize: "0.95rem", margin: 0 }}>{title} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>· {rows.length} rows</span></h3>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="ghost-dark" disabled={rows.length === 0} onClick={() => exportToPDF(filenameBase, title, headers, rows)}>PDF</button>
          <button className="ghost-dark" disabled={rows.length === 0} onClick={() => exportToCSV(filenameBase, headers, rows)}>Excel</button>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="empty-state">No data.</p>
      ) : (
        <div className="table-scroll"><table>
          <thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
            ))}
          </tbody>
        </table></div>
      )}
    </div>
  );
}

export function ReportsView({ devices, policies, token, organizationId, onRefreshShared, isManager = false }) {
  const [tab, setTab] = useState("reports");
  const [reportKey, setReportKey] = useState("inventory");
  const [logs, setLogs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [complianceRows, setComplianceRows] = useState([]);
  const [applications, setApplications] = useState([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  function loadDateFiltered() {
    const params = { limit: 500 };
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    return getActivityLogs(token, params).then((data) => setLogs(data.commands)).catch(() => {});
  }

  // Re-fetches every report source; devices/policies live in the app shell, so they are refreshed through onRefreshShared.
  function loadAll() {
    return Promise.all([
      onRefreshShared ? onRefreshShared() : null,
      loadDateFiltered(),
      isManager ? null : getDepartments(token, { organization_id: organizationId, limit: 100 }).then((data) => setDepartments(data.departments)).catch(() => {}),
      getEmployees(token, { organization_id: organizationId, limit: 500 }).then((data) => setEmployees(data.employees)).catch(() => {}),
      getCompliance(token, { organization_id: organizationId, limit: 500 }).then((data) => setComplianceRows(data.compliance)).catch(() => {}),
      isManager ? null : getApplications(token, { organization_id: organizationId, limit: 500 }).then((data) => setApplications(data.applications)).catch(() => {}),
    ]);
  }

  useEffect(() => { loadAll(); }, [organizationId]);

  // Security issues (same logic as the Alerts page)
  const securityRows = [];
  devices.forEach((d) => {
    const name = d.employee_name || d.device_uid;
    if (d.is_rooted) securityRows.push([name, "Root access detected", formatDateTime(d.last_seen)]);
    if (d.last_seen && !isDeviceOnline(d)) securityRows.push([name, "Device offline", formatDateTime(d.last_seen)]);
  });

  const batteryRows = devices.filter((d) => d.battery_level != null).map((d) => [d.employee_name || "Unassigned", d.device_uid, d.battery_level]);
  const avgBattery = batteryRows.length > 0 ? Math.round(batteryRows.reduce((sum, r) => sum + r[2], 0) / batteryRows.length) : "—";

  const REPORTS = [
    {
      key: "inventory", title: "Device Inventory", description: "Every device with model, Android version and online status.",
      headers: ["Employee", "Device UID", "Model", "Manufacturer", "Android", "IMEI", "Battery %", "Status"],
      rows: devices.map((d) => [d.employee_name || "Unassigned", d.device_uid, d.model || "—", d.manufacturer || "—", d.android_version || "—", d.imei || "—", d.battery_level ?? "—", isDeviceOnline(d) ? "online" : "offline"]),
    },
    {
      key: "departments", title: "Department Usage", description: "Employees and devices per department.", orgOnly: true,
      headers: ["Department", "Default policy", "Employees", "Devices assigned"],
      rows: departments.map((d) => [d.name, d.policy_name || "—", d.employee_count, d.device_count]),
    },
    {
      key: "employees", title: "Employee Report", description: isManager ? "Employees of your department and their devices." : "All employees with department and device.",
      headers: ["Name", "Code", "Department", "Device", "Status"],
      rows: employees.map((e) => [e.name, e.employee_code || "—", e.department_name, e.device_uid ? (e.model || e.device_uid) : "Unassigned", e.status]),
    },
    {
      key: "policies", title: "Policy Report", description: "Restrictions configured in each policy.", orgOnly: true,
      headers: ["Name", "Camera", "Bluetooth", "Wi-Fi", "USB", "Kiosk", "Working hours"],
      rows: policies.map((p) => [
        p.name, p.camera_blocked ? "Blocked" : "—", p.bluetooth_blocked ? "Blocked" : "—", p.wifi_restricted ? "Restricted" : "—",
        p.usb_transfer_blocked ? "Blocked" : "—", p.kiosk_mode ? (p.kiosk_package || "Agent app") : "—",
        p.working_hours_start && p.working_hours_end ? `${p.working_hours_start.slice(0, 5)}–${p.working_hours_end.slice(0, 5)}` : "—",
      ]),
    },
    {
      key: "compliance", title: "Compliance Report", description: "Policy compliance status of every assigned device.",
      headers: ["Device", "Employee", "Department", "Policy", "Status", "Last Sync"],
      rows: complianceRows.map((r) => [r.model || r.device_uid, r.assigned_employee_name || r.employee_name || "—", r.department_name || "—", r.policy_name || "—", r.compliance_status, r.last_seen ? formatDateTime(r.last_seen) : "Never"]),
    },
    {
      key: "applications", title: "Application Report", description: "Allowed / blocked apps with assigned and installed counts.", orgOnly: true,
      headers: ["Name", "Package", "Category", "Status", "Assigned Devices", "Installed"],
      rows: applications.map((a) => [a.name, a.package_name, a.category, a.status === "active" ? "Allowed" : "Blocked", a.assigned_devices_count, a.installed_count]),
    },
    {
      key: "security", title: "Security Report", description: "Rooted and offline devices.",
      headers: ["Device", "Issue", "Detected at"], rows: securityRows,
    },
    {
      key: "battery", title: "Battery Health", description: `Battery level of each device (average ${avgBattery}${avgBattery === "—" ? "" : "%"}).`,
      headers: ["Employee", "Device UID", "Battery %"], rows: batteryRows,
    },
    {
      key: "storage", title: "Storage Report", description: "Used and total storage per device.",
      headers: ["Employee", "Device UID", "Used GB", "Total GB"],
      rows: devices.filter((d) => d.storage_used_gb != null).map((d) => [d.employee_name || "Unassigned", d.device_uid, d.storage_used_gb, d.storage_total_gb]),
    },
    {
      key: "activity", title: isManager ? "Command Activity Report" : "Activity Report", description: "Commands issued to devices (filter by date).", dates: true,
      headers: ["Time", "Admin", "Command", "Device", "Status"],
      rows: logs.map((l) => [formatDateTime(l.issued_at), l.admin_name || "System", l.command_type, l.employee_name || l.device_uid, l.status]),
    },
  ].filter((r) => !(isManager && r.orgOnly));

  const report = REPORTS.find((r) => r.key === reportKey) || REPORTS[0];

  return (
    <section>
      <div className="dash-header-row">
        <h2 style={{ border: "none", margin: 0 }}>Reports</h2>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.2rem" }}>
        <button type="button" className={tab === "reports" ? "" : "ghost-dark"} onClick={() => setTab("reports")}>{isManager ? "Department Reports" : "Organization Reports"}</button>
        <button type="button" className={tab === "custom" ? "" : "ghost-dark"} onClick={() => setTab("custom")}>Custom Report Builder</button>
      </div>

      {tab === "custom" ? (
        <ManagerCustomReportBuilder token={token} />
      ) : (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.8rem" }}>
            <RefreshButton onRefresh={loadAll} />
          </div>
          <div className="report-grid" style={{ marginBottom: "1.2rem" }}>
            {REPORTS.map((r) => (
              <div
                key={r.key}
                className="report-card"
                style={{ cursor: "pointer", outline: r.key === report.key ? "2px solid var(--teal)" : "none" }}
                onClick={() => setReportKey(r.key)}
              >
                <h4>{r.title}</h4>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "0.3rem 0 0" }}>{r.description}</p>
              </div>
            ))}
          </div>

          {report.dates && (
            <form className="policy-form" style={{ marginBottom: "1rem" }} onSubmit={(e) => { e.preventDefault(); loadDateFiltered(); }}>
              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>From</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>To</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              <button type="submit">Apply</button>
            </form>
          )}

          <ReportTable title={report.title} headers={report.headers} rows={report.rows} filenameBase={`${report.key}-report`} />
        </div>
      )}
    </section>
  );
}
