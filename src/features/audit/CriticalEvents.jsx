// Critical Security Events (Super Admin): every critical audit event across all organizations.
// Uses GET /api/reports/security-events (same critical-action list as the Audit Logs filter).

import { useEffect, useMemo, useState } from "react";
import { KpiCard } from "../../components/common/KpiCard";
import { exportToCSV, exportToPDF } from "../../utils/exportUtils";
import { getAllOrganizations } from "../organizations/organizationService";
import { getPlatformReport } from "../reports/reportService";

const PAGE_SIZE = 50;
const fmt = (d) => {
  const date = d ? new Date(d) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : "—";
};

export function CriticalEventsView({ token }) {
  const [events, setEvents] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [orgId, setOrgId] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    setError("");
    getPlatformReport(token, "security-events", { organization_id: orgId, date_from: dateFrom, date_to: dateTo, limit: 1000 })
      .then((d) => { setEvents(Array.isArray(d.rows) ? d.rows : []); setPage(1); })
      .catch((err) => { setEvents([]); setError(err.message); })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    getAllOrganizations(token, { limit: 100 }).then((d) => setOrgs(d.organizations || [])).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [orgId]);

  const categories = useMemo(() => [...new Set(events.map((e) => e.category).filter(Boolean))].sort(), [events]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((e) => {
      if (category && e.category !== category) return false;
      if (!q) return true;
      return [e.organization, e.user_name, e.user_email, e.action, e.details].some((v) => String(v || "").toLowerCase().includes(q));
    });
  }, [events, category, search]);

  const counts = useMemo(() => {
    const byCat = {};
    events.forEach((e) => { byCat[e.category] = (byCat[e.category] || 0) + 1; });
    return byCat;
  }, [events]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const who = (e) => e.user_name || e.user_email || "System";
  const exportRows = filtered.map((e) => [fmt(e.created_at), e.organization || "Platform", who(e), e.category, e.action, e.status || "—", e.details || "—"]);
  const exportHeaders = ["Time", "Organization", "User", "Category", "Action", "Status", "Details"];

  return (
    <section>
      <h2>Critical Security Events</h2>
      <p className="card-subtitle" style={{ marginBottom: "1rem" }}>
        Every critical event across all organizations: failed logins, remote wipe/lock, suspensions, deletions and more.
      </p>

      <div className="kpi-grid" style={{ marginBottom: "1.2rem" }}>
        <KpiCard label="Total Critical Events" value={events.length} />
        {Object.entries(counts).slice(0, 3).map(([name, n]) => <KpiCard key={name} label={name} value={n} />)}
      </div>

      <form className="policy-form" style={{ marginBottom: "1rem" }} onSubmit={(e) => { e.preventDefault(); load(); }}>
        <input type="text" placeholder="Search organization, user, action..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <select value={orgId} onChange={(e) => setOrgId(e.target.value)}>
          <option value="">All organizations</option>
          {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        <button type="submit">Filter</button>
        <button type="button" className="ghost-dark" onClick={load}>Refresh</button>
        <button type="button" className="ghost-dark" disabled={filtered.length === 0} onClick={() => exportToCSV("critical-security-events", exportHeaders, exportRows)}>Export CSV</button>
        <button type="button" className="ghost-dark" disabled={filtered.length === 0} onClick={() => exportToPDF("critical-security-events", "Critical Security Events", exportHeaders, exportRows)}>Export PDF</button>
      </form>

      {loading && <p>Loading...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && !error && filtered.length === 0 && <p className="empty-state">No critical security events found.</p>}
      {!loading && filtered.length > 0 && (
        <div className="table-scroll"><table>
          <thead>
            <tr><th>Time</th><th>Organization</th><th>User</th><th>Category</th><th>Action</th><th>Status</th><th>Details</th></tr>
          </thead>
          <tbody>
            {visible.map((e) => (
              <tr key={e.id}>
                <td>{fmt(e.created_at)}</td>
                <td>{e.organization || "Platform"}</td>
                <td>{who(e)}</td>
                <td><span className="badge suspended">{e.category}</span></td>
                <td>{e.action}</td>
                <td><span className={`badge ${e.status === "success" ? "active" : e.status ? "suspended" : "setup"}`}>{e.status || "—"}</span></td>
                <td style={{ maxWidth: "320px" }}>
                  {e.details && e.details.length > 60 && expandedId !== e.id ? (
                    <>{e.details.slice(0, 60)}… <button className="card-link" type="button" onClick={() => setExpandedId(e.id)}>More</button></>
                  ) : (e.details || "—")}
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}

      {filtered.length > PAGE_SIZE && (
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", justifyContent: "center" }}>
          <button className="ghost-dark" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Page {page} of {pages} · {filtered.length} events</span>
          <button className="ghost-dark" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </section>
  );
}
