// Progress bar (0 -> 100%) for one or more install commands. Polls each
// command's status: queued 15%, delivered to the device 50%, finished 100%.

import { useEffect, useState } from "react";
import { getCommandStatus } from "../commands/commandService";

const STAGE = { pending: 15, sent: 50, executed: 100, failed: 100, cancelled: 100 };

export function InstallProgress({ token, commandIds, onDone }) {
  const [statuses, setStatuses] = useState({});

  useEffect(() => {
    if (!commandIds || commandIds.length === 0) return;
    let stopped = false;
    const start = Date.now();

    async function poll() {
      const next = {};
      await Promise.all(commandIds.map(async (id) => {
        try { next[id] = await getCommandStatus(token, id); } catch (e) { /* keep polling */ }
      }));
      if (stopped) return;
      setStatuses((prev) => ({ ...prev, ...next }));
      const all = commandIds.every((id) => {
        const st = (next[id] || {}).status;
        return st === "executed" || st === "failed" || st === "cancelled";
      });
      if (all && onDone) onDone();
      return all;
    }

    poll();
    const interval = setInterval(async () => {
      if (Date.now() - start > 180000) { clearInterval(interval); return; }
      if (await poll()) clearInterval(interval);
    }, 2000);
    return () => { stopped = true; clearInterval(interval); };
  }, [commandIds && commandIds.join(",")]);

  if (!commandIds || commandIds.length === 0) return null;

  const list = commandIds.map((id) => statuses[id]);
  const percent = Math.round(list.reduce((sum, c) => sum + (c ? STAGE[c.status] ?? 15 : 15), 0) / commandIds.length);
  const done = list.filter((c) => c && c.status === "executed").length;
  const failed = list.filter((c) => c && c.status === "failed").length;
  const finished = percent === 100;

  return (
    <div style={{ margin: "0.8rem 0" }}>
      <div style={{ background: "var(--border)", borderRadius: "4px", height: "8px", overflow: "hidden" }}>
        <div style={{ background: failed ? "var(--alert)" : "var(--teal)", height: "100%", width: `${percent}%`, transition: "width 0.4s" }} />
      </div>
      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "0.3rem 0 0" }}>
        {finished
          ? `Finished — ${done} installed${failed ? `, ${failed} failed` : ""}`
          : `Installing… ${percent}% (${done}/${commandIds.length} done)`}
      </p>
    </div>
  );
}
