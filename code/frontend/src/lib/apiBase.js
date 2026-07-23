import { DEMO_MODE } from "../demo/demoMode";

const isLocalBrowser =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname);

const demoBuild = import.meta.env.VITE_HEALTHNEST_DEMO === "true";

export const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  (DEMO_MODE
    ? demoBuild
      ? "/api"
      : isLocalBrowser
        ? "http://127.0.0.1:8001"
        : "/api"
    : "http://localhost:8000");
