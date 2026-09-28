// Current page + browser history integration.
//
// Each page change pushes a history entry (#overview, #devices …) so the
// browser's Back / Forward buttons step through the dashboard's own views.
import { useEffect, useState } from "react";

export function usePageNavigation() {
  const [page, setPageRaw] = useState(() => window.history.state?.page || "overview");

  // Pushes a new history entry so the browser's Back button steps
  // through the dashboard's own views instead of leaving the app
  // (e.g. back to the login page, or out of the app entirely) —
  // previously there was no history entry per view at all, so Back
  // either did nothing useful or broke out of the dashboard.
  function navigateToPage(newPage) {
    if (newPage === page) return;
    window.history.pushState({ page: newPage }, "", `#${newPage}`);
    setPageRaw(newPage);
  }

  useEffect(() => {
    // First load: establish a base history entry so there's always
    // something for Back to land on within the app.
    if (!window.history.state?.page) {
      window.history.replaceState({ page }, "", `#${page}`);
    }
    function handlePopState(e) {
      setPageRaw(e.state?.page || "overview");
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return [page, navigateToPage];
}
