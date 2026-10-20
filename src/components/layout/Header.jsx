// Top header: global search (with results dropdown), theme toggle,
// signed-in user chip and Sign out.
import { useState } from "react";
import { ThemeToggle } from "../common/ThemeToggle";
import { BrandMark, IconLogOut, IconSearch, IconMenu } from "../icons";
import { globalSearch } from "../../services/searchService";

export default function Header({ token, user, roleLabel, userInitials, onLogout, onMenuClick }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);

  async function handleSearchChange(value) {
    setSearchQuery(value);
    if (!value.trim()) {
      setSearchResults(null);
      return;
    }
    try {
      const results = await globalSearch(token, value);
      setSearchResults(results);
    } catch (err) {
      // silent — search is a convenience feature
    }
  }

  return (
    <header className="top-header">
      <button type="button" className="menu-btn" onClick={onMenuClick} aria-label="Open menu">
        <IconMenu size={20} />
      </button>
      <BrandMark size={32} className="header-brand-mark" />

      <div className="search-wrap">
        <IconSearch size={17} className="search-icon" />
        <input
          type="text"
          className="global-search"
          placeholder="Search devices, employees, departments, policies..."
          aria-label="Search devices, employees, departments, policies"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>
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

      {searchResults && (
        <div className="search-results">
          {Object.entries(searchResults).every(([, v]) => v.length === 0) && (
            <div className="search-result-empty">No results</div>
          )}
          {Object.entries(searchResults).map(([type, items]) =>
            items.length > 0 ? (
              <div key={type} className="search-result-group">
                <div className="search-result-heading">{type}</div>
                {items.map((item, i) => (
                  <div key={i} className="search-result-item">{item.name || item.employee_name || item.device_uid}</div>
                ))}
              </div>
            ) : null
          )}
        </div>
      )}
    </header>
  );
}