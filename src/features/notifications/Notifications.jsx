// Notification center: send / schedule notifications, stats, history with cancel / resend.

import { useEffect, useState } from "react";
import { KpiCard } from "../../components/common/KpiCard";
import { getDepartments } from "../departments/departmentService";
import {
  cancelNotification,
  getNotificationStats,
  getNotifications,
  resendNotification,
  scheduleNotification,
  sendNotification,
} from "./notificationService";

export function NotificationCenterView({ token, devices, organizationId }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [notifType, setNotifType] = useState("Custom Message");
  const [priority, setPriority] = useState("Medium");
  const [target, setTarget] = useState(""); // "" = everyone, "dept:ID", "device:UID"
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [departments, setDepartments] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  function load() {
    const params = { page, limit: 30 };
    if (statusFilter) params.status = statusFilter;
    Promise.all([getNotifications(token, params), getNotificationStats(token)])
      .then(([n, s]) => { setSent(n.notifications); setTotal(n.total); setStats(s); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    getDepartments(token, { organization_id: organizationId, limit: 100 }).then((data) => setDepartments(data.departments)).catch(() => {});
  }, [page, statusFilter]);

  function targetPayload() {
    if (target.startsWith("dept:")) return { target_department_id: target.slice(5) };
    if (target.startsWith("device:")) return { target_device_uid: target.slice(7) };
    return {};
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    setError("");
    try {
      const base = { title: title.trim(), message: message.trim(), notification_type: notifType, priority, ...targetPayload() };
      if (scheduleEnabled) {
        if (!scheduledAt) { setError("Pick a schedule date/time"); setSending(false); return; }
        // The <input type="datetime-local"> value has no timezone info —
        // JS parses it as the browser's LOCAL time, so converting to a
        // proper UTC ISO string here keeps the actual delivery moment
        // correct (and matching what's displayed later).
        const scheduledAtUtc = new Date(scheduledAt).toISOString();
        await scheduleNotification(token, { ...base, scheduled_at: scheduledAtUtc });
      } else {
        await sendNotification(token, base);
      }
      setTitle(""); setMessage(""); setTarget(""); setScheduleEnabled(false); setScheduledAt("");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  async function handleCancel(n) {
    setActing(n.id);
    try {
      await cancelNotification(token, n.id);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setActing(null);
    }
  }

  async function handleResend(n) {
    setActing(n.id);
    try {
      await resendNotification(token, n.id);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setActing(null);
    }
  }

  function statusBadgeClass(status) {
    if (status === "delivered") return "active";
    if (status === "failed" || status === "cancelled") return "suspended";
    return "setup";
  }

  return (
    <section>
      <h2>Notification center</h2>

      {stats && (
        <div className="kpi-grid" style={{ marginBottom: "1.2rem" }}>
          <KpiCard label="Total Notifications" value={stats.total_notifications} />
          <KpiCard label="Sent Today" value={stats.sent_today} />
          <KpiCard label="Scheduled" value={stats.scheduled} />
          <KpiCard label="Delivered" value={stats.delivered} />
          <KpiCard label="Failed" value={stats.failed} />
          <KpiCard label="Acknowledged" value={stats.acknowledged} />
        </div>
      )}

      <div className="policy-panel" style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ fontSize: "0.95rem", marginBottom: "0.8rem" }}>Send notification</h3>
        <form onSubmit={handleSend}>
          <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%", marginBottom: "0.6rem" }} />
          <textarea
            className="notif-textarea"
            placeholder="Write your message to employees..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.6rem", flexWrap: "wrap" }}>
            <select value={notifType} onChange={(e) => setNotifType(e.target.value)}>
              <option value="Announcement">Announcement</option>
              <option value="Security Alert">Security Alert</option>
              <option value="Policy Update">Policy Update</option>
              <option value="Maintenance Notice">Maintenance Notice</option>
              <option value="Emergency Alert">Emergency Alert</option>
              <option value="Custom Message">Custom Message</option>
            </select>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="Low">Low priority</option>
              <option value="Medium">Medium priority</option>
              <option value="High">High priority</option>
              <option value="Critical">Critical priority</option>
            </select>
            <select value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="">Everyone</option>
              <optgroup label="Departments">
                {departments.map((d) => (
                  <option key={`dept-${d.id}`} value={`dept:${d.id}`}>{d.name}</option>
                ))}
              </optgroup>
              <optgroup label="Devices">
                {devices.map((d) => (
                  <option key={`device-${d.id}`} value={`device:${d.device_uid}`}>{d.employee_name || d.device_uid}</option>
                ))}
              </optgroup>
            </select>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.6rem", fontSize: "0.85rem" }}>
            <input type="checkbox" checked={scheduleEnabled} onChange={(e) => setScheduleEnabled(e.target.checked)} />
            Schedule for later
          </label>
          {scheduleEnabled && (
            <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} style={{ marginTop: "0.4rem" }} />
          )}
          <div style={{ marginTop: "0.8rem" }}>
            <button type="submit" disabled={sending || !title.trim() || !message.trim()}>
              {sending ? "Sending..." : scheduleEnabled ? "Schedule notification" : "Send notification"}
            </button>
          </div>
        </form>
        {error && <p className="error-text">{error}</p>}
      </div>

      <div className="dash-header-row">
        <h3 style={{ fontSize: "0.95rem", margin: 0 }}>Notification history</h3>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="delivered">Delivered</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading && <p>Loading...</p>}
      {!loading && sent.length === 0 && <p className="empty-state">No notifications sent yet.</p>}
      {!loading && sent.length > 0 && (
        <div className="table-scroll"><table>
          <thead>
            <tr>
              <th>Title</th><th>Type</th><th>Target</th><th>Priority</th><th>Sent By</th><th>Sent Time</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sent.map((n) => (
              <tr key={n.id}>
                <td>{n.title || n.message.slice(0, 40)}</td>
                <td>{n.notification_type}</td>
                <td>{n.target_device_uid || n.department_name || "Everyone"}</td>
                <td>{n.priority}</td>
                <td>{n.sent_by_name || "—"}</td>
                <td>{n.status === "scheduled" ? `Scheduled: ${new Date(n.scheduled_at).toLocaleString()}` : n.sent_at ? new Date(n.sent_at).toLocaleString() : "—"}</td>
                <td><span className={`badge ${statusBadgeClass(n.status)}`}>{n.status}{n.device_count != null && n.status === "delivered" ? ` (${n.device_count})` : ""}</span></td>
                <td className="actions">
                  {n.status === "scheduled" && <button disabled={acting !== null} onClick={() => handleCancel(n)}>Cancel</button>}
                  {(n.status === "delivered" || n.status === "failed") && <button disabled={acting !== null} onClick={() => handleResend(n)}>Resend</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}

      {total > 30 && (
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", justifyContent: "center" }}>
          <button className="ghost-dark" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Page {page} of {Math.ceil(total / 30)}</span>
          <button className="ghost-dark" disabled={page >= Math.ceil(total / 30)} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </section>
  );
}
