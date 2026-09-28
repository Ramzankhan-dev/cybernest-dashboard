// Modal: upload an APK with progress.

import { useState } from "react";
import { IconX } from "../../components/icons";
import { uploadApkPackage } from "./applicationService";

export function UploadApkModal({ token, organizationId, onClose, showToast }) {
  const [appName, setAppName] = useState("");
  const [packageName, setPackageName] = useState("");
  const [versionName, setVersionName] = useState("");
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  function pickFile(f) {
    if (!f) return;
    setFile(f);
    // Convenience: derive a default app name from the filename if the
    // admin hasn't typed one yet.
    if (!appName) setAppName(f.name.replace(/\.apk$/i, ""));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) { setError("Choose an APK file first"); return; }
    setSaving(true);
    setProgress(0);
    setError("");
    try {
      await uploadApkPackage(token, { appName, packageName, versionName, file }, setProgress);
      showToast("APK uploaded");
      onClose(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={() => onClose(false)}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" aria-label="Close dialog" title="Close" onClick={() => onClose(false)}><IconX size={16} /></button>
        <h3 style={{ marginTop: 0 }}>Upload APK</h3>
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
            {file ? `📦 ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)` : "Drag & drop an .apk here, or click to browse"}
            <input
              id="apk-file-input"
              type="file"
              accept=".apk"
              style={{ display: "none" }}
              onChange={(e) => pickFile(e.target.files[0])}
            />
          </div>

          <label>App Name *</label>
          <input value={appName} onChange={(e) => setAppName(e.target.value)} required />
          <label>Package Name *</label>
          <input value={packageName} onChange={(e) => setPackageName(e.target.value)} placeholder="com.example.app" required />
          <label>Version (optional)</label>
          <input value={versionName} onChange={(e) => setVersionName(e.target.value)} placeholder="1.0.0" />

          {error && <p className="error-text">{error}</p>}
          {saving && (
            <div style={{ margin: "0.8rem 0" }}>
              <div style={{ background: "var(--border)", borderRadius: "4px", height: "8px", overflow: "hidden" }}>
                <div style={{ background: "var(--teal)", height: "100%", width: `${progress}%`, transition: "width 0.2s" }} />
              </div>
              <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "0.3rem 0 0" }}>
                {progress < 100 ? `Uploading… ${progress}%` : "Processing on server — this can take a moment for large files…"}
              </p>
            </div>
          )}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
            <button type="submit" disabled={saving}>{saving ? `Uploading... ${progress}%` : "Upload"}</button>
            <button type="button" className="ghost-dark" onClick={() => onClose(false)}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
