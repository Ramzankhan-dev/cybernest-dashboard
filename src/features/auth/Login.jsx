// Login screen (role + email + password) and entry to the forgot-password flow.

import { useState } from "react";
import { ThemeToggle } from "../../components/common/ThemeToggle";
import { BrandMark } from "../../components/icons";
import { ForgotPasswordFlow } from "./ForgotPassword";
import { LoginAside } from "./LoginBrandPanel";
import { login } from "./authService";

export function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("OrganizationAdmin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(email, password, role);
      onLogin(data.token, data.user, data.refreshToken);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (showForgot) {
    return (
      <div className="login-screen">
        <ThemeToggle className="login-theme-toggle" />
        <div className="login-shell">
          <LoginAside />
          <ForgotPasswordFlow onBackToLogin={() => setShowForgot(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="login-screen">
      <ThemeToggle className="login-theme-toggle" />
      <div className="login-shell">
      <LoginAside />
      <form className="login-card" onSubmit={handleSubmit}>
        <h1><BrandMark size={34} /><span>Cyber<span className="brand-accent">Nest</span></span></h1>
        <p className="subtitle">Sign in to manage your devices</p>

        <label>Role</label>
        <select value={role} onChange={(e) => setRole(e.target.value)} required>
          <option value="SuperAdmin">Super Admin</option>
          <option value="OrganizationAdmin">Organization Admin</option>
          <option value="DepartmentManager">Department Manager</option>
        </select>

        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="error-text">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p
          className="forgot-link"
          role="button"
          tabIndex={0}
          onClick={() => setShowForgot(true)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setShowForgot(true); } }}
        >Forgot password?</p>
      </form>
      </div>
    </div>
  );
}
