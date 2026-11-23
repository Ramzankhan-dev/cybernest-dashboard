// App root: holds the signed-in session and switches between the login
// screen and the authenticated app shell. Global providers (theme) are
// applied in main.jsx.
//
// The session is kept in sessionStorage so a browser reload (Ctrl+R / F5)
// doesn't send the user back to the login page. It is cleared on sign-out
// and when the tab is closed.
import { useEffect, useState } from "react";
import { LoginScreen } from "./features/auth/Login";
import MainLayout from "./components/layout/MainLayout";
import { SESSION_STORAGE_KEY } from "./config/constants";

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.exp ? payload.exp * 1000 <= Date.now() : false;
  } catch {
    return true;
  }
}

function loadSession() {
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(SESSION_STORAGE_KEY));
    if (saved && saved.token && saved.user && !isTokenExpired(saved.token)) return saved;
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // storage unavailable — fall back to a normal login
  }
  return null;
}

function saveSession(session) {
  try {
    if (session) window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    else window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export default function App() {
  const [session] = useState(loadSession);
  const [token, setToken] = useState(session ? session.token : null);
  const [user, setUser] = useState(session ? session.user : null);
  const [refreshToken, setRefreshToken] = useState(session ? session.refreshToken : null);

  function handleLogin(newToken, newUser, newRefreshToken) {
    // A fresh login always lands on the Dashboard, never on a page left in the URL / history.
    try { window.history.replaceState({ page: "overview" }, "", "#overview"); } catch { /* ignore */ }
    setToken(newToken);
    setUser(newUser);
    setRefreshToken(newRefreshToken);
    saveSession({ token: newToken, user: newUser, refreshToken: newRefreshToken });
  }

  function handleLogout() {
    setToken(null);
    setUser(null);
    setRefreshToken(null);
    saveSession(null);
  }

  // End the session as soon as the login token expires (Settings → Security → Session timeout).
  useEffect(() => {
    if (!token) return undefined;
    const timer = setInterval(() => { if (isTokenExpired(token)) handleLogout(); }, 15000);
    return () => clearInterval(timer);
  }, [token]);

  if (!token) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <MainLayout token={token} user={user} onLogout={handleLogout} />;
}
