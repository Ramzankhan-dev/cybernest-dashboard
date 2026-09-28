// App root: holds the signed-in session and switches between the login
// screen and the authenticated app shell. Global providers (theme) are
// applied in main.jsx.
import { useState } from "react";
import { LoginScreen } from "./features/auth/Login";
import MainLayout from "./components/layout/MainLayout";

export default function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);

  function handleLogin(newToken, newUser, newRefreshToken) {
    setToken(newToken);
    setUser(newUser);
    setRefreshToken(newRefreshToken);
  }

  function handleLogout() {
    setToken(null);
    setUser(null);
    setRefreshToken(null);
  }

  if (!token) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <MainLayout token={token} user={user} onLogout={handleLogout} />;
}
