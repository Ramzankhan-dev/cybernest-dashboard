// Command history for a single device.

import { useEffect, useState } from "react";
import { getCommandHistory } from "../commands/commandService";

export function HistoryPanel({ deviceUid, token, onClose, embedded }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCommandHistory(token, deviceUid)
      .then(setHistory)
      .finally(() => setLoading(false));
  }, [deviceUid]);

  const content = (
    <>
      {loading && <p>Loading...</p>}
      {!loading && history.length === 0 && (
        <p className="empty-state">No commands sent to this device yet.</p>
      )}
      {!loading && history.length > 0 && (
        <div className="table-scroll"><table>
          <thead>
            <tr>
              <th>Command</th>
              <th>Status</th>
              <th>Issued at</th>
              <th>Executed at</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h) => (
              <tr key={h.id}>
                <td>{h.command_type}</td>
                <td>{h.status}</td>
                <td>{new Date(h.issued_at).toLocaleString()}</td>
                <td>{h.executed_at ? new Date(h.executed_at).toLocaleString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </>
  );

  if (embedded) return content;

  return (
    <section className="history-panel">
      <div className="history-header">
        <h2 style={{ border: "none", margin: 0 }}>
          Command history — <span className="mono">{deviceUid}</span>
        </h2>
        <button className="ghost-dark" onClick={onClose}>Close</button>
      </div>
      {content}
    </section>
  );
}
