import { DEMO_MODE } from "../demo/demoMode";

const isLocalBrowser =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname);

export const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  (DEMO_MODE
    ? isLocalBrowser
      ? "http://127.0.0.1:8001"
      : ""
    : "http://localhost:8000");
