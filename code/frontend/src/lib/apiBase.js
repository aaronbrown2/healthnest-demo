import { DEMO_MODE } from "../demo/demoMode";

export const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  (DEMO_MODE ? "http://127.0.0.1:8001" : "http://localhost:8000");
