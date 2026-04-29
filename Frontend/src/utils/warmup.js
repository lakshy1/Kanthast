import image1 from "../assets/images/Image-1.png";
import image2 from "../assets/images/Image-2.png";
import image3 from "../assets/images/Image-3.png";
import image4 from "../assets/images/Image-4.png";
import image5 from "../assets/images/Image-5.png";
import { getMedicineUsmleContent } from "./authApi";

const BACKEND_ROOT = (import.meta.env.VITE_API_BASE_URL || "").replace("/api/v1", "");

// Ping Render backend immediately so it starts waking up from sleep.
// Returns the promise so callers can chain work after the backend is awake.
export function warmupBackend() {
  return fetch(`${BACKEND_ROOT}/health`, {
    method: "GET",
    signal: AbortSignal.timeout(60_000),
  }).catch(() => {});
}

// Prefetch content data into localStorage cache right after the backend wakes.
// Only runs for logged-in users; getMedicineUsmleContent is already cache-first
// so if the cache is still fresh this is a no-op.
export async function prefetchContent() {
  if (!localStorage.getItem("kanthastToken")) return;
  try {
    await getMedicineUsmleContent();
  } catch {}
}

// Prefetch all page images into the browser cache using idle bandwidth.
export function prefetchImages() {
  const urls = [image1, image2, image3, image4, image5];
  urls.forEach((url) => {
    const img = new Image();
    img.src = url;
  });
}
