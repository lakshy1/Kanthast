import { apiFetch } from "./apiBase";

// Ping the backend immediately so a sleeping host starts waking up.
export function warmupBackend() {
  return apiFetch("/health", {
    method: "GET",
    signal: AbortSignal.timeout(60_000),
  }).catch((error) => {
    void error;
  });
}
