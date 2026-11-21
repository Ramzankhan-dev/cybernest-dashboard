// Shared "Refresh" button: re-fetches the current screen's data and shows a busy state while it runs.

import { useState } from "react";
import { IconRefresh } from "../icons";

export function RefreshButton({ onRefresh, label = "Refresh", className = "ghost-dark" }) {
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (busy) return;
    setBusy(true);
    try {
      await onRefresh();
    } catch (err) {
      // each screen shows its own load errors
    } finally {
      setTimeout(() => setBusy(false), 400); // keep the busy state visible long enough to notice
    }
  }

  return (
    <button type="button" className={className} onClick={handleClick} disabled={busy}>
      <IconRefresh size={15} /> {busy ? "Refreshing..." : label}
    </button>
  );
}
