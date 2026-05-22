const DEFAULT_API_BASE_URLS = [
  import.meta.env.VITE_API_BASE_URLS,
  import.meta.env.VITE_API_BASE_URL,
  import.meta.env.VITE_API_FALLBACK_API_BASE_URL,
  "https://kanthast-backend-eutn.onrender.com/api/v1",
  "https://kanthast-backend.onrender.com/api/v1",
  "http://localhost:4000/api/v1",
];

function normalizeBaseUrl(url) {
  return String(url).trim().replace(/\/+$/, "");
}

function expandBaseUrls(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(expandBaseUrls);
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export const API_BASE_URLS = [...new Set(
  DEFAULT_API_BASE_URLS.flatMap(expandBaseUrls)
    .map(normalizeBaseUrl)
    .filter(Boolean)
)];

export const API_BASE_URL = API_BASE_URLS[0] || "http://localhost:4000/api/v1";

let resolvedApiBaseUrl = null;
let resolutionPromise = null;

async function probeBaseUrl(baseUrl) {
  try {
    const response = await fetch(`${baseUrl}/health`, {
      method: "GET",
      cache: "no-store",
      signal:
        typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
          ? AbortSignal.timeout(4000)
          : undefined,
    });
    return response.ok ? baseUrl : null;
  } catch {
    return null;
  }
}

export async function getApiBaseUrl({ forceRefresh = false } = {}) {
  if (!forceRefresh && resolvedApiBaseUrl) {
    return resolvedApiBaseUrl;
  }

  if (!resolutionPromise) {
    resolutionPromise = (async () => {
      for (const baseUrl of API_BASE_URLS) {
        const healthy = await probeBaseUrl(baseUrl);
        if (healthy) {
          resolvedApiBaseUrl = healthy;
          return healthy;
        }
      }

      resolvedApiBaseUrl = API_BASE_URLS[0] || API_BASE_URL;
      return resolvedApiBaseUrl;
    })().finally(() => {
      resolutionPromise = null;
    });
  }

  return resolutionPromise;
}

export function resetApiBaseUrl() {
  resolvedApiBaseUrl = null;
}

export async function apiFetch(path, options = {}) {
  const baseUrl = await getApiBaseUrl();

  try {
    return await fetch(`${baseUrl}${path}`, options);
  } catch (error) {
    for (const fallbackBaseUrl of API_BASE_URLS) {
      if (fallbackBaseUrl === baseUrl) continue;

      try {
        const response = await fetch(`${fallbackBaseUrl}${path}`, options);
        resolvedApiBaseUrl = fallbackBaseUrl;
        return response;
      } catch {
        // Try the next configured base URL.
      }
    }

    throw error;
  }
}
