// Top header: theme toggle,
// signed-in user chip and Sign out.
import { ThemeToggle } from "../common/ThemeToggle";
import { BrandMark, IconLogOut, IconMenu } from "../icons";

export default function Header({ token, user, roleLabel, userInitials, onLogout, onMenuClick }) {
  return (
    <header className="top-header">
      <button type="button" className="menu-btn" onClick={onMenuClick} aria-label="Open menu">
        <IconMenu size={20} />
      </button>
      <BrandMark size={32} className="header-brand-mark" />

      <div className="topbar-right">
        <ThemeToggle />
        <div className="user-chip" title={`${user.name} · ${roleLabel}`}>
          <span className="avatar" aria-hidden="true">{userInitials}</span>
          <div className="user-meta">
            <span className="user-name">{user.name}</span>
            <span className="user-role">{roleLabel}</span>
          </div>
        </div>
        <button className="ghost-dark signout-btn" onClick={onLogout} aria-label="Sign out" title="Sign out">
          <IconLogOut size={16} /><span>Sign out</span>
        </button>
      </div>

    </header>
  );
}