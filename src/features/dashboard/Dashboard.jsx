// Dashboard overview: KPIs, fleet hero, charts, security alerts, quick actions, recent activity. Auto-refreshes every 60s.

import { useEffect, useState } from "react";
import { BarChartCard } from "../../components/charts/BarChartCard";
import { DonutChartCard } from "../../components/charts/DonutChartCard";
import { HealthRing } from "../../components/charts/HealthRing";
import { KpiCard } from "../../components/common/KpiCard";
import {
  IconActivity,
  IconAlertTriangle,
  IconArrowRight,
  IconBarChart,
  IconBell,
  IconBuilding,
  IconClock,
  IconMegaphone,
  IconRefresh,
  IconShieldAlert,
  IconShieldCheck,
  IconSmartphone,
  IconSparkles,
  IconUserPlus,
  IconWifi,
  IconWifiOff,
  IconZap,
} from "../../components/icons";
import { useChartTheme } from "../../hooks/useChartTheme";
import { percentOf } from "../../utils/numbers";
import {
  getDashboardActivity,
  getDashboardAlerts,
  getDashboardCharts,
  getDashboardSummary,
} from "./dashboardService";

export function DashboardOverview({ token, user, onNavigate }) {
  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState(null);
  const [activity, setActivity] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const chartTheme = useChartTheme();

  async function loadAll() {
    try {
      const [s, c, a, al] = await Promise.all([
        getDashboardSummary(token),
        getDashboardCharts(token),
        getDashboardActivity(token),
        getDashboardAlerts(token),
      ]);
      setSummary(s);
      setCharts(c);
      setActivity(a);
      setAlerts(al);
      setLastUpdated(new Date());
      setError("");
    } catch (err) {
      setError("Unable to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // FR-06: auto refresh every 60 seconds
    const interval = setInterval(loadAll, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <section aria-busy="true">
        <h2>Dashboard</h2>
        <p className="dash-updated" style={{ marginBottom: "1rem" }}>Loading dashboard...</p>
        <div className="dash-loading">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" />)}
        </div>
      </section>
    );
  }
  if (error) return <section><h2>Dashboard</h2><p className="error-text">{error}</p></section>;

  const deviceStatusData = charts ? [
    { name: "Online", value: charts.device_status.online },
    { name: "Offline", value: charts.device_status.offline },
  ] : [];
  const complianceData = charts ? [
    { name: "Compliant", value: charts.policy_compliance.compliant },
    { name: "Non-Compliant", value: charts.policy_compliance.non_compliant },
  ] : [];

  const roleLabel = user.is_super_admin ? "Super Admin" : user.role === "DepartmentManager" ? "Department Manager" : "Organization Admin";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const onlinePct = percentOf(summary.online_devices, summary.total_devices);
  const offlinePct = percentOf(summary.offline_devices, summary.total_devices);
  const compliancePct = charts ? percentOf(charts.policy_compliance.compliant, (Number(charts.policy_compliance.compliant) || 0) + (Number(charts.policy_compliance.non_compliant) || 0)) : null;
  const avgBattery = charts?.device_health?.avg_battery;

  return (
    <section>
      <div className="dash-header-row">
        <div className="dash-greeting">
          <h2>{greeting}, {user.name}<IconSparkles size={20} className="greeting-spark" /></h2>
          <p className="dash-role-line">
            <span className="role-pill">{roleLabel}</span>
            {user.department_name && <span>{user.department_name}</span>}
            {!user.is_super_admin && user.organization_name && <span>· {user.organization_name}</span>}
          </p>
          {lastUpdated && (
            <p className="dash-updated" style={{ margin: "0.45rem 0 0" }}>
              <IconClock size={13} /> Last updated {lastUpdated.toLocaleTimeString()} · auto-refreshes every minute
            </p>
          )}
        </div>
        <button className="ghost-dark" onClick={loadAll}><IconRefresh size={15} /> Refresh</button>
      </div>

      <div className="kpi-grid">
        <KpiCard label="Total Devices" value={summary.total_devices} icon={IconSmartphone} tone="violet" onClick={() => onNavigate("devices")} />
        <KpiCard label="Online Devices" value={summary.online_devices} icon={IconWifi} tone="mint" hint={onlinePct != null ? `${onlinePct}% of fleet` : null} onClick={() => onNavigate("devices")} />
        <KpiCard label="Offline Devices" value={summary.offline_devices} icon={IconWifiOff} tone="rose" hint={offlinePct != null ? `${offlinePct}% of fleet` : null} onClick={() => onNavigate("devices")} />
        <KpiCard label="Active Policies" value={summary.active_policies} icon={IconShieldCheck} tone="indigo" onClick={() => onNavigate("policies")} />
        <KpiCard label="Policy Violations" value={summary.policy_violations} icon={IconShieldAlert} tone="red" onClick={() => onNavigate("alerts")} />
        <KpiCard label="Pending Commands" value={summary.pending_commands} icon={IconZap} tone="amber" onClick={() => onNavigate("activity")} />
        <KpiCard label="Today's Alerts" value={summary.todays_alerts} icon={IconBell} tone="peach" onClick={() => onNavigate("alerts")} />
        <KpiCard label="Organizations" value={summary.total_organizations} icon={IconBuilding} tone="cyan" onClick={() => onNavigate("org")} />
      </div>

      <div className="dash-layout">
        <div className="dash-main-col">
          {/* Fleet overview hero — includes the Device Health (avg battery) figure */}
          <div className="dash-hero">
            <div>
              <div className="hero-eyebrow"><IconActivity size={14} /> Fleet overview</div>
              <h3>Your devices at a glance</h3>
              <p>Live status of your managed fleet, refreshed automatically from CyberNest.</p>
              <div className="hero-stats">
                <div className="hero-stat">
                  <strong>{summary.online_devices ?? "—"} / {summary.total_devices ?? "—"}</strong>
                  <span>Devices online</span>
                </div>
                <div className="hero-stat">
                  <strong>{compliancePct != null ? `${compliancePct}%` : "—"}</strong>
                  <span>Policy compliant</span>
                </div>
                <div className="hero-stat">
                  <strong>{summary.pending_commands ?? "—"}</strong>
                  <span>Pending commands</span>
                </div>
              </div>
              <div className="hero-actions">
                <button className="hero-btn" onClick={() => onNavigate("devices")}>View devices <IconArrowRight size={15} /></button>
                <button className="hero-link" onClick={() => onNavigate("reports")}>Reports</button>
              </div>
            </div>
            <HealthRing value={avgBattery} label="Average battery across fleet" chartTheme={chartTheme} />
          </div>

          <div className="chart-grid">
            <DonutChartCard
              title="Device Status"
              subtitle="Online vs offline right now"
              data={deviceStatusData}
              colors={chartTheme.series}
              centerLabel="devices"
            />
            <DonutChartCard
              title="Policy Compliance"
              subtitle="Across assigned devices"
              data={complianceData}
              colors={chartTheme.series}
              centerLabel="checked"
            />
            <BarChartCard
              title="Android Versions"
              subtitle="Devices per OS version"
              data={charts.android_versions}
              dataKeyX="version"
              gradientId="cnBarAndroid"
              gradient={chartTheme.barPrimary}
              chartTheme={chartTheme}
            />
            <BarChartCard
              title="Device Distribution (by Department)"
              subtitle="Devices per department"
              data={charts.device_distribution}
              dataKeyX="department"
              gradientId="cnBarDept"
              gradient={chartTheme.barSecondary}
              chartTheme={chartTheme}
            />
          </div>
        </div>

        <div className="dash-side-col">
          <div className="dash-card">
            <div className="card-header">
              <div>
                <h3>Security Alerts</h3>
                <p className="card-subtitle">{alerts.length > 0 ? `${alerts.length} active` : "All clear"}</p>
              </div>
              <button className="card-link" onClick={() => onNavigate("alerts")}>View all</button>
            </div>
            {alerts.length === 0 && <p className="empty-state">No active alerts.</p>}
            <div className="alert-scroll">
              {alerts.slice(0, 8).map((a, i) => (
                <div key={i} className="alert-card" style={{ marginBottom: "0.5rem" }}>
                  <span className="alert-icon"><IconAlertTriangle size={16} /></span>
                  <div>
                    <div className="alert-title">{a.device}</div>
                    <div className="alert-desc">{a.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="dash-card">
            <div className="card-header">
              <h3>Quick Actions</h3>
            </div>
            <div className="quick-actions qa-tiles">
              <button className="tone-violet" onClick={() => onNavigate("devices")}><span className="qa-icon"><IconSmartphone size={19} /></span>Enroll Device</button>
              <button className="tone-mint" onClick={() => onNavigate("employees")}><span className="qa-icon"><IconUserPlus size={19} /></span>Add Employee</button>
              <button className="tone-indigo" onClick={() => onNavigate("departments")}><span className="qa-icon"><IconShieldCheck size={19} /></span>Create Policy</button>
              <button className="tone-rose" onClick={() => onNavigate("notifications")}><span className="qa-icon"><IconMegaphone size={19} /></span>Send Notification</button>
              <button className="tone-cyan" onClick={loadAll}><span className="qa-icon"><IconRefresh size={19} /></span>Refresh Dashboard</button>
              <button className="tone-amber" onClick={() => onNavigate("reports")}><span className="qa-icon"><IconBarChart size={19} /></span>Generate Report</button>
            </div>
          </div>
        </div>
      </div>

      <div className="dash-card">
        <div className="card-header">
          <div>
            <h3>Recent Activities</h3>
            <p className="card-subtitle">Latest commands issued to devices</p>
          </div>
        </div>
        {activity.length === 0 && <p className="empty-state">No recent activity.</p>}
        {activity.length > 0 && (
          <div className="table-scroll"><table>
            <thead><tr><th>Time</th><th>Activity</th><th>Device</th></tr></thead>
            <tbody>
              {activity.map((a) => (
                <tr key={a.id}>
                  <td className="mono" style={{ color: "var(--text-muted)" }}>{new Date(a.issued_at).toLocaleTimeString()}</td>
                  <td><span className="badge">{a.command_type}</span></td>
                  <td>{a.employee_name || a.device_uid}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </div>
    </section>
  );
}
