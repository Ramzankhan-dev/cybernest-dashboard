// Authenticated app shell: sidebar + header + current page + toast.
//
// Also owns the data several pages share (device list and policies) and
// the toast used for command / action feedback.
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import AppRoutes from "../../routes/AppRoutes";
import { usePageNavigation } from "../../hooks/usePageNavigation";
import { getVisibleNavItems } from "../../config/navigation";
import { getRoleLabel } from "../../config/roles";
import { getUserInitials } from "../../utils/formatters";
import { getDevices, getDeviceStats } from "../../features/devices/deviceService";
import { getPolicies } from "../../features/policies/policyService";

export default function MainLayout({ token, user, onLogout }) {
  const [page, setPage] = usePageNavigation();

  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [navOpen, setNavOpen] = useState(false);

  async function loadPolicies() {
    try {
      const data = await getPolicies(token, { organization_id: user.organization_id, limit: 200 });
      setPolicies(data.policies);
    } catch (err) {
      // Non-critical — device list still works without policies
    }
  }

  const [deviceSearch, setDeviceSearch] = useState("");
  const [deviceStats, setDeviceStats] = useState(null);

  async function loadDevices(searchOverride) {
    setLoading(true);
    try {
      const params = { organization_id: user.organization_id, limit: 200 };
      const s = searchOverride !== undefined ? searchOverride : deviceSearch;
      if (s) params.search = s;
      const data = await getDevices(token, params);
      setDevices(data.devices);
      const stats = await getDeviceStats(token, user.organization_id);
      setDeviceStats(stats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDevices();
    loadPolicies();
  }, []);

  // Mobile drawer: Escape se band ho, aur khula ho to page scroll lock rahe.
  useEffect(() => {
    document.body.style.overflow = navOpen ? "hidden" : "";
    const onKey = (e) => { if (e.key === "Escape") setNavOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [navOpen]);

  function showToast(message, isError = false) {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3500);
  }

  const visibleNavItems = getVisibleNavItems(user);
  const roleLabel = getRoleLabel(user);
  const userInitials = getUserInitials(user);

  return (
    <div className="app-shell">
      <Sidebar
        items={visibleNavItems}
        activeKey={page}
        onNavigate={(key) => { setPage(key); setNavOpen(false); }}
        mobileOpen={navOpen}
        onMobileClose={() => setNavOpen(false)}
        userName={user.name}
        roleLabel={roleLabel}
        userInitials={userInitials}
      />

      <div className="main-area">
        <Header
          token={token}
          user={user}
          roleLabel={roleLabel}
          userInitials={userInitials}
          onLogout={onLogout}
          onMenuClick={() => setNavOpen(true)}
        />
        <AppRoutes
          page={page}
          setPage={setPage}
          token={token}
          user={user}
          devices={devices}
          policies={policies}
          loadPolicies={loadPolicies}
          showToast={showToast}
        />
      </div>

      {toast && (
        <div className={`toast ${toast.isError ? "toast-error" : ""}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}