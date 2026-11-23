// Modal: Organization Admin edits an employee's details (name, email, phone, designation) and optionally the password.

import { useState } from "react";
import { IconX } from "../../components/icons";
import { PASSWORD_HINT, passwordRuleError } from "../../utils/passwordRules";
import { updateEmployee } from "./employeeService";
import { EmailVerify } from "../../components/common/EmailVerify";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+()\-\s]{7,20}$/;

export function EditEmployeeModal({ employee, token, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: employee.name || "",
    email: employee.email || "",
    phone_number: employee.phone_number || "",
    designation: employee.designation || "",
    password: "",
    confirm: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  // A changed email must be verified; the current one is kept as is
  const emailChanged = form.email.trim().toLowerCase() !== String(employee.email || "").trim().toLowerCase();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name is required"); return; }
    if (!EMAIL_REGEX.test(form.email.trim())) { setError("Enter a valid email address"); return; }
    if (emailChanged && !emailVerified) { setError("Please verify the new email (Send Code, then enter the code)"); return; }
    if (form.phone_number.trim() && !PHONE_REGEX.test(form.phone_number.trim())) { setError("Enter a valid phone number"); return; }
    if (form.password) {
      const ruleError = passwordRuleError(form.password);
      if (ruleError) { setError(ruleError); return; }
      if (form.password !== form.confirm) { setError("Passwords don't match"); return; }
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone_number: form.phone_number.trim(),
      designation: form.designation.trim(),
    };
    if (form.password) payload.password = form.password; // left out = password unchanged

    setSaving(true);
    setError("");
    try {
      await updateEmployee(token, employee.id, payload);
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
        <h3 style={{ marginTop: 0 }}>Edit Employee — {employee.employee_code}</h3>
        <form onSubmit={handleSubmit} className="modal-form" noValidate>
          <label>Name *</label>
          <input type="text" value={form.name} onChange={set("name")} />
          <label>Email *</label>
          <input type="email" value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); setEmailVerified(false); }} />
          {emailChanged && (
            <EmailVerify token={token} email={form.email} verified={emailVerified} onVerified={setEmailVerified} />
          )}
          <label>Phone number</label>
          <input type="text" value={form.phone_number} onChange={set("phone_number")} />
          <label>Designation / Description</label>
          <input type="text" value={form.designation} onChange={set("designation")} />

          <label>New password (optional)</label>
          <input type="password" placeholder="Leave blank to keep the current password" value={form.password} onChange={set("password")} autoComplete="new-password" />
          {form.password && (
            <>
              <label>Confirm new password</label>
              <input type="password" value={form.confirm} onChange={set("confirm")} autoComplete="new-password" />
            </>
          )}
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "0.2rem 0 0" }}>
            {PASSWORD_HINT}.{employee.role === "DepartmentManager" && " Also updates the manager's dashboard login (email and password)."}
          </p>

          {error && <p className="error-text">{error}</p>}

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
            <button type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</button>
            <button type="button" className="ghost-dark" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
