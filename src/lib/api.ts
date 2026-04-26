// Centralized API base URL for frontend → backend communication
// Prefer Vite env var; fallback to localhost:3000
export const API_BASE_URL = (() => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim()) return envUrl.trim().replace(/\/$/, "");
  if (typeof window !== "undefined") {
    try {
      const u = new URL(window.location.origin);
      u.port = "3000"; // force backend port
      return u.toString().replace(/\/$/, "");
    } catch {
      return "http://localhost:3000";
    }
  }
  return "http://localhost:3000";
})();


