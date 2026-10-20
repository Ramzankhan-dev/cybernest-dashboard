// Sidebar with an expanded / collapsed (icon-only) state and collapsible
// navigation groups.
//
// Navigation items, their labels and role filtering come from
// config/navigation.js (via MainLayout) — this component only arranges the
// items it receives, so role-based visibility is unchanged. Grouping is
// purely visual: a child is only shown if the caller passed it in, and any
// item not listed in NAV_LAYOUT is still rendered as a standalone entry.
// Persisted state (collapsed, open groups) lives in hooks/useSidebar.js.

import { useEffect, useRef, useState } from "react";
import { BrandMark, IconChevronLeft, IconChevronRight, IconChevronDown, IconX } from "../icons";
import { NAV_LAYOUT, GROUP_OF } from "../../config/navigation";
import { SIDEBAR_GROUPS_STORAGE_KEY } from "../../config/constants";
import { useSidebarCollapsed, readOpenGroups } from "../../hooks/useSidebar";

// Builds the rendered structure from the role-filtered items.
function buildNav(items) {
  const byKey = new Map(items.map((it) => [it.key, it]));
  const used = new Set();
  const out = [];
  NAV_LAYOUT.forEach((entry) => {
    if (typeof entry === "string") {
      if (byKey.has(entry)) { out.push({ type: "item", item: byKey.get(entry) }); used.add(entry); }
      return;
    }
    const children = entry.children.filter((k) => byKey.has(k)).map((k) => byKey.get(k));
    children.forEach((c) => used.add(c.key));
    if (children.length > 0) out.push({ type: "group", group: entry, children });
  });
  // Safety net: never drop an item that isn't in the layout.
  items.forEach((it) => { if (!used.has(it.key)) out.push({ type: "item", item: it }); });
  return out;
}

const isMobile = () => window.matchMedia && window.matchMedia("(max-width: 640px)").matches;

export default function Sidebar({ items, activeKey, onNavigate, mobileOpen, onMobileClose, userName, roleLabel, userInitials }) {
  const [collapsed, setCollapsed] = useSidebarCollapsed();
  const [openGroups, setOpenGroups] = useState(() => {
    const initial = new Set(readOpenGroups());
    if (GROUP_OF[activeKey]) initial.add(GROUP_OF[activeKey]);
    return initial;
  });
  // Tooltip (standalone items) and flyout (groups) are position:fixed so the
  // sidebar's own scroll container can't clip them. Only used while collapsed.
  const [tip, setTip] = useState(null);
  const [flyout, setFlyout] = useState(null); // { id, top, left }
  const closeTimer = useRef(null);

  const nav = buildNav(items);
  const activeGroup = GROUP_OF[activeKey];

  // Active page always opens its parent group.
  useEffect(() => {
    if (!activeGroup) return;
    setOpenGroups((prev) => (prev.has(activeGroup) ? prev : new Set(prev).add(activeGroup)));
  }, [activeKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_GROUPS_STORAGE_KEY, JSON.stringify([...openGroups]));
    } catch {
      // Non-critical.
    }
  }, [openGroups]);

  useEffect(() => { if (!collapsed) { setTip(null); setFlyout(null); } }, [collapsed]);

  // Close the flyout on Escape or a click outside it.
  useEffect(() => {
    if (!flyout) return;
    function onKey(e) { if (e.key === "Escape") setFlyout(null); }
    function onDown(e) { if (!e.target.closest?.(".nav-group")) setFlyout(null); }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onDown); };
  }, [flyout]);

  function toggleGroup(id) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function showTip(e, label) {
    if (!collapsed || isMobile()) return;
    const r = e.currentTarget.getBoundingClientRect();
    setTip({ label, top: r.top + r.height / 2, left: r.right + 10 });
  }
  const hideTip = () => setTip(null);

  function openFlyout(e, id) {
    if (!collapsed || isMobile()) return;
    clearTimeout(closeTimer.current);
    setTip(null);
    const r = e.currentTarget.getBoundingClientRect();
    setFlyout({ id, top: r.top, left: r.right + 10 });
  }
  function scheduleFlyoutClose() {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setFlyout(null), 160);
  }
  const cancelFlyoutClose = () => clearTimeout(closeTimer.current);

  function navigate(key) {
    hideTip();
    setFlyout(null);
    onNavigate(key);
  }

  function renderItem(item, extraClass = "") {
    const NavIcon = item.icon;
    return (
      <button
        key={item.key}
        className={`${activeKey === item.key ? "active" : ""} ${extraClass}`.trim()}
        aria-current={activeKey === item.key ? "page" : undefined}
        aria-label={collapsed ? item.label : undefined}
        onClick={() => navigate(item.key)}
        onMouseEnter={(e) => showTip(e, item.label)}
        onMouseLeave={hideTip}
        onFocus={(e) => showTip(e, item.label)}
        onBlur={hideTip}
      >
        <NavIcon size={18} className="nav-icon" />
        <span className="nav-label">{item.label}</span>
      </button>
    );
  }

  const toggleLabel = collapsed ? "Expand sidebar" : "Collapse sidebar";

  return (
    <aside className={`sidebar ${collapsed ? "is-collapsed" : ""}`} onScroll={() => { hideTip(); setFlyout(null); }}>
      <div className="sidebar-brand">
        <BrandMark size={38} />
        <div className="sidebar-brand-text">
          <h1 className="sidebar-logo">Cyber<span className="brand-accent">Nest</span></h1>
          <span className="brand-tagline">MDM Console</span>
        </div>
        <button
          type="button"
          className="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={toggleLabel}
          aria-expanded={!collapsed}
          title={toggleLabel}
        >
          {collapsed ? <IconChevronRight size={16} /> : <IconChevronLeft size={16} />}
        </button>
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {nav.map((entry) => {
          if (entry.type === "item") return renderItem(entry.item);

          const { group, children } = entry;
          const GroupIcon = group.icon;
          const isOpen = openGroups.has(group.id);
          const hasActive = children.some((c) => c.key === activeKey);
          const panelId = `nav-group-${group.id}`;
          const flyoutOpen = collapsed && flyout?.id === group.id;

          return (
            <div
              key={group.id}
              className={`nav-group ${isOpen ? "is-open" : ""} ${hasActive ? "has-active" : ""}`.trim()}
              onMouseLeave={collapsed ? scheduleFlyoutClose : undefined}
              onMouseEnter={collapsed ? cancelFlyoutClose : undefined}
            >
              <button
                type="button"
                className={`nav-group-header ${collapsed && hasActive ? "active" : ""}`.trim()}
                aria-expanded={collapsed ? flyoutOpen : isOpen}
                aria-controls={collapsed ? undefined : panelId}
                aria-haspopup={collapsed ? "menu" : undefined}
                aria-label={collapsed ? `${group.label} menu` : undefined}
                onClick={(e) => {
                  if (collapsed && !isMobile()) {
                    if (flyoutOpen) setFlyout(null); else openFlyout(e, group.id);
                  } else {
                    toggleGroup(group.id);
                  }
                }}
                onMouseEnter={(e) => openFlyout(e, group.id)}
              >
                <GroupIcon size={18} className="nav-icon" />
                <span className="nav-label">{group.label}</span>
                <span className="nav-group-chevron" aria-hidden="true">
                  {isOpen ? <IconChevronDown size={15} /> : <IconChevronRight size={15} />}
                </span>
              </button>

              {/* Inline children (sidebar expanded; flattened on mobile) */}
              <div className="nav-group-children" id={panelId} role="group" aria-label={group.label}>
                <div className="nav-group-inner">
                  {children.map((child) => renderItem(child, "nav-child"))}
                </div>
              </div>

              {/* Flyout (sidebar collapsed / icon-only) */}
              {flyoutOpen && (
                <div
                  className="nav-flyout"
                  role="menu"
                  aria-label={group.label}
                  style={{ top: flyout.top, left: flyout.left }}
                  onMouseEnter={cancelFlyoutClose}
                  onMouseLeave={scheduleFlyoutClose}
                >
                  <div className="nav-flyout-title">{group.label}</div>
                  {children.map((child) => {
                    const ChildIcon = child.icon;
                    return (
                      <button
                        key={child.key}
                        type="button"
                        role="menuitem"
                        className={`nav-flyout-item ${activeKey === child.key ? "active" : ""}`.trim()}
                        aria-current={activeKey === child.key ? "page" : undefined}
                        onClick={() => navigate(child.key)}
                      >
                        <ChildIcon size={16} className="nav-icon" />
                        <span>{child.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div
          className="sidebar-user"
          onMouseEnter={(e) => showTip(e, `${userName} · ${roleLabel}`)}
          onMouseLeave={hideTip}
        >
          <span className="avatar" aria-hidden="true">{userInitials}</span>
          <div className="user-meta">
            <span className="user-name">{userName}</span>
            <span className="user-role">{roleLabel}</span>
          </div>
        </div>
      </div>

      {collapsed && tip && (
        <div className="sidebar-tooltip" role="tooltip" style={{ top: tip.top, left: tip.left }}>
          {tip.label}
        </div>
      )}
    </aside>
  );
}
