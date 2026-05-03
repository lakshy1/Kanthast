export const API_BASE_URL = "https://kanthast-backend.onrender.com/api/v1";

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
