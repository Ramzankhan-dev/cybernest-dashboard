// Modal: add an application (APK upload + details in one step) or edit one.

import { useState } from "react";
import { IconX } from "../../components/icons";
import { createApplication, updateApplication } from "./applicationService";

export function ApplicationFormModal({ initial, token, organizationId, onClose, onSaved }) {
  const [form, setForm] = useState(
    initial
      ? { name: initial.name, version: initial.version || "", category: initial.category, install_type: initial.install_type }
      : { name: "", package_name: "", version: "", category: "Public", install_type: "Optional" }
  );
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  function set(field, value) { setForm({ ...form, [field]: value }); }

  function pickFile(f) {
    if (!f) return;
    if (!/\.apk$/i.test(f.name)) { setError("Please choose an .apk file"); return; }
    setError("");
    setFile(f);
    // Convenience: default the name from the filename if none typed yet.
    if (!form.name) setForm((prev) => ({ ...prev, name: f.name.replace(/\.apk$/i, "") }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!initial && !file) { setError("Choose an APK file first"); return; }
    setSaving(true);
    setProgress(0);
    setError("");
    try {
      const data = initial
        ? await updateApplication(token, initial.id, form, file, setProgress)
        : await createApplication(token, { ...form, organization_id: organizationId }, file, setProgress);
      onSaved(data);
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
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); pickFile(e.dataTransfer.files[0]); }}
            onClick={() => document.getElementById("apk-file-input").click()}
            style={{
              border: `2px dashed ${dragOver ? "var(--teal)" : "var(--border)"}`,
              borderRadius: "8px", padding: "1.2rem", textAlign: "center",
              cursor: "pointer", marginBottom: "0.9rem", fontSize: "0.82rem",
              color: "var(--text-muted)",
            }}
          >
            {file
              ? `📦 ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`
              : initial
                ? "Optional: drop an .apk here to attach or replace it (the package name is corrected from the APK if it differs)"
                : "Drag & drop an .apk here, or click to browse *"}
            <input
              id="apk-file-input"
              type="file"
              accept=".apk"
              style={{ display: "none" }}
              onChange={(e) => pickFile(e.target.files[0])}
            />
          </div>

          <label>Application Name *</label>
          <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} required />

          {!initial && (
            <>
              <label>Package Name (optional — read from the APK; must match it if entered)</label>
              <input type="text" value={form.package_name} onChange={(e) => set("package_name", e.target.value)} placeholder="com.example.app" />
            </>
          )}

          <label>Version (optional — read from the APK if blank)</label>
          <input type="text" value={form.version} onChange={(e) => set("version", e.target.value)} placeholder="1.0.0" />

          <label>Category</label>
          <select value={form.category} onChange={(e) => set("category", e.target.value)}>
            <option value="Enterprise">Enterprise</option>
            <option value="Public">Public</option>
          </select>

          <label>Install Type</label>
          <select value={form.install_type} onChange={(e) => set("install_type", e.target.value)}>
            <option value="Required">Required</option>
            <option value="Optional">Optional</option>
          </select>

          {error && <p className="error-text">{error}</p>}
          {saving && file && (
            <div style={{ margin: "0.8rem 0" }}>
              <div style={{ background: "var(--border)", borderRadius: "4px", height: "8px", overflow: "hidden" }}>
                <div style={{ background: "var(--teal)", height: "100%", width: `${progress}%`, transition: "width 0.2s" }} />
              </div>
              <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "0.3rem 0 0" }}>
                {progress < 100 ? `Uploading… ${progress}%` : "Checking APK on server — this can take a moment for large files…"}
              </p>
            </div>
          )}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
            <button type="submit" disabled={saving}>{saving ? "Saving..." : initial ? "Save" : "Add Application"}</button>
            <button type="button" className="ghost-dark" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
