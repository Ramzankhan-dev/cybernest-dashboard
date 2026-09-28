// Modal: add / edit a managed application.

import { useState } from "react";
import { IconX } from "../../components/icons";
import { createApplication, updateApplication } from "./applicationService";

export function ApplicationFormModal({ initial, token, organizationId, onClose, onSaved }) {
  const [form, setForm] = useState(initial || { name: "", package_name: "", version: "", category: "Public", install_type: "Optional" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(field, value) { setForm({ ...form, [field]: value }); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (initial) await updateApplication(token, initial.id, form);
      else await createApplication(token, { ...form, organization_id: organizationId });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" aria-label="Close dialog" title="Close" onClick={onClose}><IconX size={16} /></button>
        <h3 style={{ marginTop: 0 }}>{initial ? "Edit Application" : "Add Application"}</h3>
        <form onSubmit={handleSubmit} className="modal-form">
          <label>Application Name *</label>
          <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} required />

          {!initial && (
            <>
              <label>Package Name * (e.g. com.whatsapp)</label>
              <input type="text" value={form.package_name} onChange={(e) => set("package_name", e.target.value)} required />
            </>
          )}

          <label>Version</label>
          <input type="text" value={form.version || ""} onChange={(e) => set("version", e.target.value)} />

          <label>Category</label>
          <select value={form.category} onChange={(e) => set("category", e.target.value)}>
            <option value="Enterprise">Enterprise</option>
            <option value="Public">Public</option>
            <option value="Restricted">Restricted</option>
          </select>

          <label>Install Type</label>
          <select value={form.install_type} onChange={(e) => set("install_type", e.target.value)}>
            <option value="Required">Required</option>
            <option value="Optional">Optional</option>
            <option value="Blocked">Blocked</option>
          </select>

          {error && <p className="error-text">{error}</p>}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
            <button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
            <button type="button" className="ghost-dark" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
