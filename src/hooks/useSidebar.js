// Persisted sidebar UI state (localStorage):
//  - collapsed / expanded sidebar  (key: sidebarCollapsed, default expanded)
//  - which navigation groups are open (key: sidebarOpenGroups)
import { useEffect, useState } from "react";
import { SIDEBAR_STORAGE_KEY, SIDEBAR_GROUPS_STORAGE_KEY } from "../config/constants";

function readCollapsed() {
  try {
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
  } catch {
    return false; // default for first-time users: expanded
  }
}

export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(readCollapsed);
  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? "true" : "false");
    } catch {
      // Non-critical — state still applies for this session.
    }
  }, [collapsed]);
  return [collapsed, setCollapsed];
}

export function readOpenGroups() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SIDEBAR_GROUPS_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((g) => typeof g === "string") : [];
  } catch {
    return [];
  }
}
