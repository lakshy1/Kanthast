export const API_BASE_URLS = [
  "https://kanthast-backend-eutn.onrender.com/api/v1",
  "https://kanthast-backend.onrender.com/api/v1",
  "http://localhost:4000/api/v1",
];

export const API_BASE_URL = API_BASE_URLS[0];

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

      resolvedApiBaseUrl = API_BASE_URLS[0];
      return resolvedApiBaseUrl;
    })().finally(() => {
      resolutionPromise = null;
    });
  }

  return resolutionPromise;
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

export const CACHE_KEYS = {
  content: "kanthast_content_cache",
  profile: "kanthast_profile_cache",
  settings: "kanthast_settings_cache",
  chatHistory: "kanthast_chat_history",
  dashboardQuote: "kanthast_dashboard_quote",
};

// 5-minute TTL (same as web app)
export const CACHE_TTL_MS = 5 * 60 * 1000;

// 30-minute TTL for profile data
export const PROFILE_CACHE_TTL_MS = 30 * 60 * 1000;
