// Custom Report Builder for Org Admin and Department Manager (same builder idea as Super Admin).
// Data scope is decided by the backend from the logged-in role.

import { useEffect, useState } from "react";
import { RefreshButton } from "../../components/common/RefreshButton";
import { exportToCSV, exportToPDF } from "../../utils/exportUtils";
import { getManagerReportMeta, runManagerReport } from "./reportService";
import { formatDateTime } from "../../utils/dateFormat";

function formatCell(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "—" : formatDateTime(d);
  }
  return value;
}

export function ManagerCustomReportBuilder({ token }) {
  const [meta, setMeta] = useState(null);
  const [entityKey, setEntityKey] = useState("");
  const [columns, setColumns] = useState([]);
  const [filters, setFilters] = useState({});
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getManagerReportMeta(token)
      .then((m) => {
        setMeta(m);
        if (m.entities.length > 0) {
          setEntityKey(m.entities[0].key);
          setColumns(m.entities[0].defaultColumns);
        }
      })
      .catch((err) => setError(err.message));
  }, []);

  const entity = meta?.entities.find((e) => e.key === entityKey);

  function changeEntity(key) {
    const next = meta.entities.find((e) => e.key === key);
    setEntityKey(key);
    setColumns(next.defaultColumns);
    setFilters({});
    setResult(null);
    setError("");
  }

  function toggleColumn(key) {
    setColumns(columns.includes(key) ? columns.filter((c) => c !== key) : [...columns, key]);
  }

  async function handleRun(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (columns.length === 0) { setError("Select at least one column"); return; }
    setRunning(true);
    setError("");
    try {
      const data = await runManagerReport(token, {
        entity: entityKey,
        columns,
        filters,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      setResult(data);
    } catch (err) {
      setResult(null);
      setError(err.message);
    } finally {
      setRunning(false);
    }
  }

  async function handleRefresh() {
    await getManagerReportMeta(token).then(setMeta).catch(() => {});
    if (result) await handleRun();
  }

  if (!meta) return error ? <p className="error-text">{error}</p> : <p>Loading...</p>;

  const headers = result ? result.columns.map((c) => c.label) : [];
  const rows = result ? result.rows.map((r) => result.columns.map((c) => formatCell(r[c.key]))) : [];
  const title = `${entity.label} — custom report`;
  const filenameBase = `custom-${entityKey}`;
  const labelStyle = { fontSize: "0.8rem", color: "var(--text-muted)", display: "block", margin: "0.8rem 0 0.3rem" };
  const checkStyle = { display: "inline-flex", alignItems: "center", gap: "0.3rem", marginRight: "1rem", fontSize: "0.85rem" };

  return (
    <div>
      <form onSubmit={handleRun} className="policy-panel" style={{ marginBottom: "1.5rem" }}>
        <label style={labelStyle}>Data source</label>
        <select value={entityKey} onChange={(e) => changeEntity(e.target.value)}>
          {meta.entities.map((en) => <option key={en.key} value={en.key}>{en.label}</option>)}
        </select>

        <label style={labelStyle}>Columns</label>
        <div>
          {entity.columns.map((c) => (
            <label key={c.key} style={checkStyle}>
              <input type="checkbox" checked={columns.includes(c.key)} onChange={() => toggleColumn(c.key)} /> {c.label}
            </label>
          ))}
        </div>

        {entity.filters.length > 0 && <label style={labelStyle}>Filters</label>}
        <div className="policy-form">
          {entity.filters.map((f) => (
            f.options ? (
              <select key={f.key} value={filters[f.key] || ""} onChange={(e) => setFilters({ ...filters, [f.key]: e.target.value })}>
                <option value="">{f.label}: any</option>
                {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input key={f.key} type="text" placeholder={f.label} value={filters[f.key] || ""} onChange={(e) => setFilters({ ...filters, [f.key]: e.target.value })} />
            )
          ))}
        </div>

        <label style={labelStyle}>Date range — {entity.dateLabel}</label>
        <div className="policy-form">
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>

        <div style={{ marginTop: "1rem" }}>
          <button type="submit" disabled={running}>{running ? "Running..." : "Run report"}</button>
          {" "}
          <RefreshButton onRefresh={handleRefresh} />
        </div>
        {error && <p className="error-text">{error}</p>}
      </form>

      {result && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div className="dash-header-row">
            <h3 style={{ fontSize: "0.95rem", margin: 0 }}>{entity.label} — preview <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>· {rows.length} rows</span></h3>
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
              <tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody>
            </table></div>
          )}
          {result.truncated && (
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Showing the first {result.limit} rows. Narrow the filters or date range to see the rest.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
