// Admin profile: change password, API keys, appearance.

import { useEffect, useState } from "react";
import { ThemeSegmented } from "../../components/common/ThemeToggle";
import { changePassword, generateApiKey, getApiKeys } from "./profileService";

export function ProfileView({ token, user }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState("");
  const [pwError, setPwError] = useState("");

  const [apiKeys, setApiKeys] = useState([]);
  const [newKey, setNewKey] = useState(null);
  const [keyLoading, setKeyLoading] = useState(false);

  function loadKeys() {
    getApiKeys(token).then(setApiKeys).catch(() => {});
  }

  useEffect(() => {
    loadKeys();
  }, []);

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwSaving(true);
    setPwMessage("");
    setPwError("");
    try {
      await changePassword(token, currentPassword, newPassword);
      setPwMessage("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwSaving(false);
    }
  }

  async function handleGenerateKey() {
    setKeyLoading(true);
    try {
      const data = await generateApiKey(token);
      setNewKey(data.key);
      loadKeys();
    } catch (err) {
      // silently ignore, keys list stays as-is
    } finally {
      setKeyLoading(false);
    }
  }

  return (
    <section>
      <h2>Admin profile</h2>
      <p style={{ marginBottom: "1.2rem", fontSize: "0.9rem" }}>
        <strong>{user.name}</strong> — <span className="mono">{user.email}</span>
      </p>

      <div className="policy-panel" style={{ marginBottom: "1.5rem" }}>
        <div className="appearance-row">
          <div>
            <h3 style={{ fontSize: "0.95rem", margin: 0 }}>Appearance</h3>
            <p>Choose the dashboard theme. Your choice is saved on this browser.</p>
          </div>
          <ThemeSegmented />
        </div>
      </div>

      <div className="policy-panel" style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ fontSize: "0.95rem", marginBottom: "0.8rem" }}>Change password</h3>
        <form onSubmit={handleChangePassword} className="policy-form">
          <input
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button type="submit" disabled={pwSaving || !currentPassword || !newPassword}>
            {pwSaving ? "Updating..." : "Update password"}
          </button>
        </form>
        {pwMessage && <p style={{ color: "var(--teal)", fontSize: "0.85rem", marginTop: "0.5rem" }}>{pwMessage}</p>}
        {pwError && <p className="error-text">{pwError}</p>}
      </div>
    </section>
  );
}
