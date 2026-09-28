// Reports page: report cards with PDF / Excel (CSV) export.

import { useEffect, useState } from "react";
import { exportToCSV, exportToPDF } from "../../utils/exportUtils";
import { getApplications } from "../applications/applicationService";
import { getActivityLogs } from "../commands/commandService";
import { getCompliance } from "../compliance/complianceService";
import { getDepartments } from "../departments/departmentService";
import { isDeviceOnline } from "../devices/deviceUtils";
import { getEmployees } from "../employees/employeeService";

export function ReportCard({ title, stat, headers, rows, filenameBase }) {
  return (
    <div className="report-card">
      <h4>{title}</h4>
      <div className="report-stat">{stat}</div>
      <div className="report-actions">
        <button onClick={() => exportToPDF(filenameBase, title, headers, rows)}>PDF</button>
        <button onClick={() => exportToCSV(filenameBase, headers, rows)}>Excel</button>
      </div>
    </div>
  );
}

export function ReportsView({ devices, policies, token, organizationId }) {
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
    getActivityLogs(token, params).then((data) => setLogs(data.commands)).catch(() => {});
  }

  useEffect(() => {
    loadDateFiltered();
    getDepartments(token, { organization_id: organizationId, limit: 100 }).then((data) => setDepartments(data.departments)).catch(() => {});
    getEmployees(token, { organization_id: organizationId, limit: 500 }).then((data) => setEmployees(data.employees)).catch(() => {});
    getCompliance(token, { organization_id: organizationId, limit: 500 }).then((data) => setComplianceRows(data.compliance)).catch(() => {});
    getApplications(token, { organization_id: organizationId, limit: 500 }).then((data) => setApplications(data.applications)).catch(() => {});
  }, [organizationId]);

  // 1. Device Inventory
  const inventoryHeaders = ["Employee", "Device UID", "Model", "Manufacturer", "Android", "IMEI", "Battery %", "Status"];
  const inventoryRows = devices.map((d) => [
    d.employee_name || "Unassigned", d.device_uid, d.model || "—", d.manufacturer || "—",
    d.android_version || "—", d.imei || "—", d.battery_level ?? "—", isDeviceOnline(d) ? "online" : "offline",
  ]);

  // 2. Policy Report
  const policyHeaders = ["Name", "Camera", "Bluetooth", "Wi-Fi", "USB", "Kiosk", "Working hours"];
  const policyRows = policies.map((p) => [
    p.name,
    p.camera_blocked ? "Blocked" : "—",
    p.bluetooth_blocked ? "Blocked" : "—",
    p.wifi_restricted ? "Restricted" : "—",
    p.usb_transfer_blocked ? "Blocked" : "—",
    p.kiosk_mode ? (p.kiosk_package || "Agent app") : "—",
    p.working_hours_start && p.working_hours_end ? `${p.working_hours_start.slice(0,5)}–${p.working_hours_end.slice(0,5)}` : "—",
  ]);

  // 3. Security Report (reuses the same alert logic as the Alerts page)
  const securityRows = [];
  devices.forEach((d) => {
    const name = d.employee_name || d.device_uid;
    if (d.is_rooted) securityRows.push([name, "Root access detected", new Date(d.last_seen).toLocaleString()]);
    if (d.last_seen && !isDeviceOnline(d)) securityRows.push([name, "Device offline", new Date(d.last_seen).toLocaleString()]);
  });
  const securityHeaders = ["Device", "Issue", "Detected at"];

  // 4. Battery Health
  const batteryHeaders = ["Employee", "Device UID", "Battery %"];
  const batteryRows = devices.filter((d) => d.battery_level != null).map((d) => [d.employee_name || "Unassigned", d.device_uid, d.battery_level]);
  const avgBattery = batteryRows.length > 0 ? Math.round(batteryRows.reduce((sum, r) => sum + r[2], 0) / batteryRows.length) : "—";

  // 5. Storage Report
  const storageHeaders = ["Employee", "Device UID", "Used GB", "Total GB"];
  const storageRows = devices.filter((d) => d.storage_used_gb != null).map((d) => [d.employee_name || "Unassigned", d.device_uid, d.storage_used_gb, d.storage_total_gb]);

  // 6. Activity / Command Report (date-range filterable)
  const activityHeaders = ["Time", "Admin", "Command", "Device", "Status"];
  const activityRows = logs.map((l) => [
    new Date(l.issued_at).toLocaleString(), l.admin_name || "System", l.command_type, l.employee_name || l.device_uid, l.status,
  ]);

  // 7. Department Usage
  const deptHeaders = ["Department", "Default policy", "Employees", "Devices assigned"];
  const deptRows = departments.map((d) => [d.name, d.policy_name || "—", d.employee_count, d.device_count]);

  // 8. Employee Report
  const employeeHeaders = ["Name", "Code", "Department", "Device", "Status"];
  const employeeRows = employees.map((e) => [
    e.name, e.employee_code || "—", e.department_name, e.device_uid ? (e.model || e.device_uid) : "Unassigned", e.status,
  ]);

  // 9. Compliance Report (SRS-015)
  const complianceHeaders = ["Device", "Employee", "Department", "Policy", "Status", "Last Sync"];
  const complianceReportRows = complianceRows.map((r) => [
    r.model || r.device_uid, r.assigned_employee_name || r.employee_name || "—", r.department_name || "—",
    r.policy_name || "—", r.compliance_status, r.last_seen ? new Date(r.last_seen).toLocaleString() : "Never",
  ]);

  // 10. Application Report (SRS-015)
  const appHeaders = ["Name", "Package", "Category", "Status", "Assigned Devices", "Installed"];
  const appRows = applications.map((a) => [
    a.name, a.package_name, a.category, a.status === "active" ? "Allowed" : "Blocked", a.assigned_devices_count, a.installed_count,
  ]);

  return (
    <section>
      <h2>Reports</h2>

      <div className="policy-form" style={{ marginBottom: "1rem" }}>
        <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Date range for Activity Report:</label>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        <button type="button" onClick={loadDateFiltered}>Apply</button>
      </div>

      <div className="report-grid">
        <ReportCard title="Device Inventory" stat={`${devices.length} devices`} headers={inventoryHeaders} rows={inventoryRows} filenameBase="device-inventory" />
        <ReportCard title="Department Usage" stat={`${departments.length} departments`} headers={deptHeaders} rows={deptRows} filenameBase="department-usage" />
        <ReportCard title="Employee Report" stat={`${employees.length} employees`} headers={employeeHeaders} rows={employeeRows} filenameBase="employee-report" />
        <ReportCard title="Policy Report" stat={`${policies.length} policies`} headers={policyHeaders} rows={policyRows} filenameBase="policy-report" />
        <ReportCard title="Compliance Report" stat={`${complianceReportRows.length} assigned`} headers={complianceHeaders} rows={complianceReportRows} filenameBase="compliance-report" />
        <ReportCard title="Application Report" stat={`${applications.length} apps`} headers={appHeaders} rows={appRows} filenameBase="application-report" />
        <ReportCard title="Security Report" stat={`${securityRows.length} issues`} headers={securityHeaders} rows={securityRows} filenameBase="security-report" />
        <ReportCard title="Battery Health" stat={`Avg. ${avgBattery}%`} headers={batteryHeaders} rows={batteryRows} filenameBase="battery-health" />
        <ReportCard title="Storage Report" stat={`${storageRows.length} devices`} headers={storageHeaders} rows={storageRows} filenameBase="storage-report" />
        <ReportCard title="Activity Report" stat={`${logs.length} events`} headers={activityHeaders} rows={activityRows} filenameBase="activity-report" />
      </div>
    </section>
  );
}
