const DEMO_SESSION_KEY = "healthnest.demoSessionId";

function createSessionId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `demo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getDemoSessionId() {
  if (typeof localStorage === "undefined") return "demo-server-session";
  let sessionId = localStorage.getItem(DEMO_SESSION_KEY);
  if (!sessionId) {
    sessionId = createSessionId();
    localStorage.setItem(DEMO_SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function demoSessionHeaders() {
  return { "X-Demo-Session-Id": getDemoSessionId() };
}
