// Alerts page: security / compliance alerts derived from compliance and audit data.

import { useEffect, useState } from "react";
import { getAuditLogs } from "../audit/auditService";
import { getCompliance } from "../compliance/complianceService";
import { isDeviceOnline } from "../devices/deviceUtils";

export function AlertsView({ devices, token, organizationId }) {
  const [complianceRows, setComplianceRows] = useState([]);
  const [criticalEvents, setCriticalEvents] = useState([]);
  const [sourceFilter, setSourceFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getCompliance(token, { organization_id: organizationId, limit: 200 }),
      getAuditLogs(token, { organization_id: organizationId, limit: 100 }),
    ])
      .then(([c, a]) => {
        setComplianceRows(c.compliance);
        const critical = a.logs.filter((l) =>
          ["device_removed", "policy_deleted", "organization_suspended", "login_failed"].includes(l.action)
        );
        setCriticalEvents(critical);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [organizationId]);

  const alerts = [];

  // Device-level alerts (battery/offline/root) — straight from live device data
  devices.forEach((d) => {
    const name = d.employee_name || d.device_uid;
    if (d.battery_level != null && d.battery_level < 15) {
      alerts.push({
        key: `battery-${d.id}`, source: "Device",
        title: `Battery low — ${name}`,
        desc: `Device battery is at ${d.battery_level}%.`,
        time: d.last_seen ? new Date(d.last_seen).toLocaleString() : "—",
      });
    }
    if (d.last_seen && !isDeviceOnline(d)) {
      alerts.push({
        key: `offline-${d.id}`, source: "Device",
        title: `Device offline — ${name}`,
        desc: `No check-in since ${new Date(d.last_seen).toLocaleString()}.`,
        time: new Date(d.last_seen).toLocaleString(),
      });
    }
    if (d.is_rooted) {
      alerts.push({
        key: `root-${d.id}`, source: "Device",
        title: `Root access detected — ${name}`,
        desc: `Device flagged as rooted — this may bypass policy enforcement.`,
        time: d.last_seen ? new Date(d.last_seen).toLocaleString() : "—",
      });
    }
  });

  // Compliance-level alerts (SRS-011) — policy failures & non-compliance
  complianceRows.forEach((r) => {
    if (r.compliance_status === "Policy Failed" || r.compliance_status === "Non-Compliant") {
      alerts.push({
        key: `compliance-${r.id}`, source: "Compliance",
        title: `${r.compliance_status} — ${r.model || r.device_uid}`,
        desc: `Policy "${r.policy_name || "—"}" — ${r.compliance_status === "Policy Failed" ? "one or more commands failed to apply" : "device hasn't synced recently"}.`,
        time: r.last_seen ? new Date(r.last_seen).toLocaleString() : "Never",
      });
    }
  });

  // Audit-level alerts (SRS-016) — critical security events
  criticalEvents.forEach((e) => {
    alerts.push({
      key: `audit-${e.id}`, source: "Audit",
      title: `${e.action.replace(/_/g, " ")} — ${e.user_name || e.user_email || "System"}`,
      desc: e.details || "Critical security event recorded.",
      time: new Date(e.created_at).toLocaleString(),
    });
  });

  const filteredAlerts = sourceFilter ? alerts.filter((a) => a.source === sourceFilter) : alerts;

  return (
    <section>
      <div className="dash-header-row">
        <h2 style={{ border: "none", margin: 0 }}>Alerts {alerts.length > 0 && `· ${alerts.length} active`}</h2>
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
          <option value="">All sources</option>
          <option value="Device">Device</option>
          <option value="Compliance">Compliance</option>
          <option value="Audit">Audit / Security</option>
        </select>
      </div>
      {loading && <p>Loading...</p>}
      {!loading && filteredAlerts.length === 0 && <p className="empty-state">No active alerts — everything looks normal.</p>}
      {!loading && filteredAlerts.map((a) => (
        <div key={a.key} className="alert-card">
          <div style={{ flex: 1 }}>
            <div className="alert-title">{a.title}</div>
            <div className="alert-desc">{a.desc}</div>
            <div className="alert-time">{a.time}</div>
          </div>
          <span className="badge setup" style={{ height: "fit-content" }}>{a.source}</span>
        </div>
      ))}
    </section>
  );
}
