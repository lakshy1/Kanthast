import { useEffect, useState } from "react";

export const SETTINGS_KEY = "kanthastSettings";
export const SETTINGS_EVENT = "kanthast-settings-changed";
export const ANALYTICS_QUEUE_KEY = "kanthastAnalyticsEvents";
export const ANALYTICS_EVENT = "kanthast-analytics-changed";

export const defaultSettings = {
  language: "English",
  appearance: "System",
  defaultPlaybackSpeed: "1x",
  profileVisibility: "enrolled",
  emailUpdates: true,
  learningReminders: true,
  courseAnnouncements: true,
  subscriptionReminders: true,
  productTips: false,
  reduceMotion: false,
  compactLayout: false,
  analyticsSharing: true,
  autoplayNextLecture: true,
  showProgressPercent: true,
};

const settingKeys = Object.keys(defaultSettings);

export function normalizeSettings(settings = {}) {
  return settingKeys.reduce(
    (acc, key) => {
      if (settings[key] !== undefined) {
        acc[key] = settings[key];
      }
      return acc;
    },
    { ...defaultSettings }
  );
}

function readStoredObject(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function readStoredSettings() {
  const directSettings = readStoredObject(SETTINGS_KEY);
  if (directSettings) return normalizeSettings(directSettings);

  const user = readStoredObject("kanthastUser");
  return normalizeSettings(user?.settings || {});
}

export function writeStoredSettings(settings) {
  const normalized = normalizeSettings(settings);
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(normalized));
  } catch {
    return normalized;
  }

  try {
    const user = readStoredObject("kanthastUser");
    if (user) {
      user.settings = normalized;
      localStorage.setItem("kanthastUser", JSON.stringify(user));
    }
  } catch {
    // ignore storage write failures
  }

  if (normalized.analyticsSharing === false) {
    try {
      localStorage.removeItem(ANALYTICS_QUEUE_KEY);
    } catch {
      // ignore storage write failures
    }
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: normalized }));
  }

  return normalized;
}

export function useAppSettings() {
  const [settings, setSettings] = useState(() => readStoredSettings());

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === SETTINGS_KEY || event.key === "kanthastUser") {
        setSettings(readStoredSettings());
      }
    };

    const handleCustom = () => {
      setSettings(readStoredSettings());
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(SETTINGS_EVENT, handleCustom);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(SETTINGS_EVENT, handleCustom);
    };
  }, []);

  return settings;
}

export function getPlaybackRate(speed) {
  switch (speed) {
    case "1.25x":
      return 1.25;
    case "1.5x":
      return 1.5;
    case "2x":
      return 2;
    default:
      return 1;
  }
}

export function isAnalyticsEnabled() {
  return readStoredSettings().analyticsSharing !== false;
}

export function trackAnalyticsEvent(name, payload = {}) {
  if (!isAnalyticsEnabled()) {
    try {
      localStorage.removeItem(ANALYTICS_QUEUE_KEY);
    } catch {
      return null;
    }
    return null;
  }

  const entry = {
    name,
    payload,
    timestamp: new Date().toISOString(),
  };

  try {
    const current = JSON.parse(localStorage.getItem(ANALYTICS_QUEUE_KEY) || "[]");
    current.push(entry);
    localStorage.setItem(ANALYTICS_QUEUE_KEY, JSON.stringify(current.slice(-200)));
  } catch {
    return entry;
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(ANALYTICS_EVENT, { detail: entry }));
  }

  return entry;
}
