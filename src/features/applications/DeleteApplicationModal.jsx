// Confirmation popup shown before an application (and its APK) is deleted.

import { useState } from "react";
import { IconX } from "../../components/icons";

export function DeleteApplicationModal({ app, onConfirm, onClose }) {
  const [deleting, setDeleting] = useState(false);

  async function handleConfirm() {
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={() => !deleting && onClose()}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" aria-label="Close dialog" title="Close" disabled={deleting} onClick={onClose}><IconX size={16} /></button>
        <h3 style={{ marginTop: 0 }}>Delete "{app.name}"?</h3>
        <p style={{ fontSize: "0.88rem", lineHeight: 1.5 }}>
          If you delete this APK/application, it will also be removed/uninstalled from all devices.
          Are you sure you want to continue?
        </p>
        <p className="mono" style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "0 0 0.5rem" }}>{app.package_name}</p>
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
          <button type="button" className="danger" disabled={deleting} onClick={handleConfirm}>{deleting ? "Deleting..." : "Yes, Delete"}</button>
          <button type="button" className="ghost-dark" disabled={deleting} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
