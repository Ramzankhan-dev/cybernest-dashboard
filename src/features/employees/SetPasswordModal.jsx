// Modal: set an employee's agent-login password.

import { useState } from "react";
import { IconX } from "../../components/icons";
import { PASSWORD_HINT, passwordRuleError } from "../../utils/passwordRules";
import { setEmployeePassword } from "./employeeService";

export function SetPasswordModal({ employee, token, onClose, onSaved }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const ruleError = passwordRuleError(password);
    if (ruleError) { setError(ruleError); return; }
    if (password !== confirm) { setError("Passwords don't match"); return; }
    setSaving(true);
    setError("");
    try {
      await setEmployeePassword(token, employee.id, password);
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
        <h3 style={{ marginTop: 0 }}>Set Password — {employee.name}</h3>
        <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "0 0 0.8rem" }}>
          Used for Employee Login on the Android agent . The employee signs in with their Employee ID ({employee.employee_code}) or email.
          {employee.role === "DepartmentManager" && " As a Department Manager, this is also their dashboard login password."}
          {" "}{PASSWORD_HINT}.
        </p>
        <form onSubmit={handleSubmit} className="modal-form">
          <label>New Password *</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <label>Confirm Password *</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />

          {error && <p className="error-text">{error}</p>}

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
            <button type="submit" disabled={saving}>{saving ? "Saving..." : "Set Password"}</button>
            <button type="button" className="ghost-dark" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
