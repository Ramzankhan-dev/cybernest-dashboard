// Modal: create / edit an organization (Super Admin).

import { useState } from "react";
import { IconX } from "../../components/icons";
import { createOrganization, updateOrganization } from "./organizationService";

export function OrgFormModal({ initial, onClose, onSaved, token, isEdit }) {
  const [form, setForm] = useState(initial || {
    name: "", code: "", industry: "", email: "", contact_number: "", country: "", city: "", address: "",
    admin_name: "", admin_email: "", admin_password: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(field, value) { setForm({ ...form, [field]: value }); }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (isEdit) {
        await updateOrganization(token, initial.id, form);
      } else {
        await createOrganization(token, form);
      }
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
        <h3 style={{ marginTop: 0 }}>{isEdit ? "Edit Organization" : "Create Organization"}</h3>
        <form onSubmit={handleSubmit} className="modal-form">
          <label>Organization Name *</label>
          <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} required />

          {!isEdit && (
            <>
              <label>Organization Code * (e.g. ACME001)</label>
              <input type="text" value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} required />
            </>
          )}

          <label>Industry *</label>
          <input type="text" value={form.industry} onChange={(e) => set("industry", e.target.value)} required />

          <label>Email *</label>
          <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />

          <label>Contact Number</label>
          <input type="text" value={form.contact_number} onChange={(e) => set("contact_number", e.target.value)} />

          <label>Country *</label>
          <input type="text" value={form.country} onChange={(e) => set("country", e.target.value)} required />

          <label>City</label>
          <input type="text" value={form.city} onChange={(e) => set("city", e.target.value)} />

          <label>Address</label>
          <input type="text" value={form.address} onChange={(e) => set("address", e.target.value)} />

          {!isEdit && (
            <>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "0.8rem 0 0.3rem" }}>
                Optional: create the first Organization Admin for this org now
              </p>
              <label>Admin Name</label>
              <input type="text" value={form.admin_name} onChange={(e) => set("admin_name", e.target.value)} />
              <label>Admin Email</label>
              <input type="email" value={form.admin_email} onChange={(e) => set("admin_email", e.target.value)} />
              <label>Admin Password</label>
              <input type="password" value={form.admin_password} onChange={(e) => set("admin_password", e.target.value)} />
            </>
          )}

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
