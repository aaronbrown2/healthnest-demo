export const DEMO_MODE =
  import.meta.env.VITE_HEALTHNEST_DEMO === "true" ||
  new URLSearchParams(window.location.search).has("demo");

export const DEMO_ROLE_KEY = "healthnest.demoRole";

export function makeDemoSession(role = "patient") {
  const isProvider = role === "provider";
  return {
    access_token: `demo-${role}-token`,
    refresh_token: `demo-${role}-refresh`,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
    user: {
      id: isProvider ? "provider-user-chen" : "patient-user-maya",
      email: isProvider ? "elena.chen@healthnest.demo" : "maya.rivera@example.com",
      user_metadata: isProvider
        ? {
            role: "provider",
            first_name: "Elena",
            last_name: "Chen",
            specialty: "Internal Medicine",
          }
        : {
            role: "patient",
            first_name: "Maya",
            last_name: "Rivera",
          },
    },
  };
}
