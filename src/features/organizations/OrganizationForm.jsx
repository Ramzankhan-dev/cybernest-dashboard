// Modal: create / edit an organization (Super Admin).

import { useState } from "react";
import { IconX } from "../../components/icons";
import { createOrganization, updateOrganization } from "./organizationService";

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

function EyeIcon({ off }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
      {off && <line x1="3" y1="3" x2="21" y2="21" />}
    </svg>
  );
}

function PasswordInput({ value, onChange, placeholder, autoComplete }) {
  const [visible, setVisible] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        style={{ width: "100%", paddingRight: "2.6rem", boxSizing: "border-box" }}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        title={visible ? "Hide password" : "Show password"}
        style={{
          position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)",
          background: "none", border: "none", padding: "0.2rem", cursor: "pointer",
          color: "var(--text-muted)", display: "flex", alignItems: "center",
        }}
      >
        <EyeIcon off={visible} />
      </button>
    </div>
  );
}

export function OrgFormModal({ initial, onClose, onSaved, token, isEdit }) {
  const [form, setForm] = useState(initial || {
    name: "", code: "", industry: "", email: "", contact_number: "", country: "", city: "", address: "",
    admin_name: "", admin_password: "", admin_confirm_password: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  function set(field, value) {
    setForm({ ...form, [field]: value });
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate() {
    const errors = {};
    const email = (form.email || "").trim();
    if (!isEdit) {
      if (!email) errors.email = "Email is required";
      else if (!EMAIL_REGEX.test(email)) errors.email = "Enter a valid email, e.g. name@example.com";
    }

    if (!isEdit) {
      const wantsAdmin = !!((form.admin_name || "").trim() || form.admin_password || form.admin_confirm_password);
      if (wantsAdmin) {
        if (!(form.admin_name || "").trim()) errors.admin_name = "Admin name is required";
        if (!form.admin_password) {
          errors.admin_password = "Password is required";
        } else if (!PASSWORD_REGEX.test(form.admin_password)) {
          errors.admin_password = "Minimum 8 characters, with both letters and numbers";
        }
        if (!form.admin_confirm_password) {
          errors.admin_confirm_password = "Please confirm the password";
        } else if (form.admin_password !== form.admin_confirm_password) {
          errors.admin_confirm_password = "Passwords do not match";
        }
      }
    }
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, email: (form.email || "").trim() };
      if (isEdit) {
        delete payload.email; // email is locked after creation
        await updateOrganization(token, initial.id, payload);
      } else {
        await createOrganization(token, payload);
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
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            required
            disabled={isEdit}
            readOnly={isEdit}
            style={isEdit ? { opacity: 0.7, cursor: "not-allowed" } : undefined}
          />
          {isEdit && (
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "0.2rem 0 0" }}>
              Email cannot be changed.
            </p>
          )}
          {fieldErrors.email && <p className="error-text" style={{ margin: "0.2rem 0 0" }}>{fieldErrors.email}</p>}
          {!isEdit && (
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "0.2rem 0 0" }}>
              Also used as the Organization Admin's login email.
            </p>
          )}

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
              {fieldErrors.admin_name && <p className="error-text" style={{ margin: "0.2rem 0 0" }}>{fieldErrors.admin_name}</p>}
              <label>Admin Password</label>
              <PasswordInput value={form.admin_password} onChange={(e) => set("admin_password", e.target.value)} autoComplete="new-password" />
              {fieldErrors.admin_password && <p className="error-text" style={{ margin: "0.2rem 0 0" }}>{fieldErrors.admin_password}</p>}
              <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "0.2rem 0 0" }}>
                Minimum 8 characters, containing both letters and numbers.
              </p>
              <label>Confirm Admin Password</label>
              <PasswordInput value={form.admin_confirm_password} onChange={(e) => set("admin_confirm_password", e.target.value)} autoComplete="new-password" />
              {fieldErrors.admin_confirm_password && <p className="error-text" style={{ margin: "0.2rem 0 0" }}>{fieldErrors.admin_confirm_password}</p>}
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
