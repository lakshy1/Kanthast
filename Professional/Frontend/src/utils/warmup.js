import { apiFetch } from "./apiBase";
import { getMedicineUsmleContent } from "./authApi";

// Ping Render backend immediately so it starts waking up from sleep.
// Returns the promise so callers can chain work after the backend is awake.
export function warmupBackend() {
  return apiFetch("/health", {
    method: "GET",
    signal: AbortSignal.timeout(60_000),
  }).catch((error) => {
    void error;
  });
}

// Prefetch content data into localStorage cache right after the backend wakes.
// Only runs for logged-in users; getMedicineUsmleContent is already cache-first
// so if the cache is still fresh this is a no-op.
export async function prefetchContent() {
  if (!localStorage.getItem("kanthastToken")) return;
  try {
    await getMedicineUsmleContent();
  } catch (error) {
    void error;
  }
}

