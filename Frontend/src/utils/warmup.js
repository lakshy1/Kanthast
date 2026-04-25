import image1 from "../assets/images/Image-1.png";
import image2 from "../assets/images/Image-2.png";
import image3 from "../assets/images/Image-3.png";
import image4 from "../assets/images/Image-4.png";
import image5 from "../assets/images/Image-5.png";

const BACKEND_ROOT = (import.meta.env.VITE_API_BASE_URL || "").replace("/api/v1", "");

// Ping Render backend immediately so it starts waking up from sleep.
// Fire-and-forget — we don't care about the response, just the connection.
export function warmupBackend() {
  fetch(`${BACKEND_ROOT}/health`, {
    method: "GET",
    signal: AbortSignal.timeout(60_000),
  }).catch(() => {});
}

// Prefetch all page images into the browser cache using idle bandwidth.
// Uses low-priority Image() objects so they never compete with critical resources.
export function prefetchImages() {
  const urls = [image1, image2, image3, image4, image5];
  urls.forEach((url) => {
    const img = new Image();
    img.src = url;
  });
}
