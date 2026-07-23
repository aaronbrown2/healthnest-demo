const PATH_TO_PAGE = {
  "/appointments": "appointments",
  "/booking": "booking",
  "/care-team": "care-team",
  "/pulse": "pulse",
  "/messages": "messages",
  "/account-settings": "account-settings",
  // provider routes
  "/schedule": "schedule",
  "/patient-records": "patient-records",
};

const PAGE_TO_PATH = {
  dashboard: "/",
  appointments: "/appointments",
  booking: "/booking",
  "care-team": "/care-team",
  pulse: "/pulse",
  messages: "/messages",
  "account-settings": "/account-settings",
  "dfa-pulse": "/pulse",
  // provider routes
  schedule: "/schedule",
  "patient-records": "/patient-records",
};

function normalizePathname(pathname = "/") {
  const path = pathname.replace(/\/+$/, "") || "/";
  return path;
}

export function routeFromPath(pathname = window.location.pathname) {
  const path = normalizePathname(pathname);
  const appointmentMatch = path.match(/^\/appointments\/([^/]+)$/);

  if (appointmentMatch) {
    return {
      page: "appointment-detail",
      data: { appointmentId: decodeURIComponent(appointmentMatch[1]) },
    };
  }

  return { page: PATH_TO_PAGE[path] ?? "dashboard", data: null };
}

export function pathForPage(page, data = null) {
  if (page === "appointment-detail") {
    const appointmentId = data?.appointmentId || data?.appointment?.id;
    return appointmentId
      ? `/appointments/${encodeURIComponent(appointmentId)}`
      : "/appointments";
  }

  return PAGE_TO_PATH[page] ?? "/";
}
