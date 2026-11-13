function parseBrowser(userAgent = "") {
  const ua = userAgent.toLowerCase();
  if (ua.includes("edg/")) return "Edge";
  if (ua.includes("chrome/") && !ua.includes("edg/")) return "Chrome";
  if (ua.includes("safari/") && !ua.includes("chrome/")) return "Safari";
  if (ua.includes("firefox/")) return "Firefox";
  if (ua.includes("opr/") || ua.includes("opera")) return "Opera";
  return "Browser";
}

function parseOS(userAgent = "") {
  const ua = userAgent.toLowerCase();
  if (ua.includes("windows")) return "Windows";
  if (ua.includes("mac os") || ua.includes("macintosh")) return "macOS";
  if (ua.includes("android")) return "Android";
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ios")) return "iOS";
  if (ua.includes("linux")) return "Linux";
  return "Unknown OS";
}

export function getClientDeviceInfo() {
  if (typeof window === "undefined") return null;

  const userAgent = navigator.userAgent || "";
  const platform = navigator.userAgentData?.platform || navigator.platform || "";
  const browserName = parseBrowser(userAgent);
  const osName = parseOS(userAgent);
  const browserVersionMatch = userAgent.match(/(?:chrome|edg|firefox|version|opr)\/([\d.]+)/i);

  return {
    deviceName: navigator.userAgentData?.mobile ? "Mobile device" : "Desktop device",
    browserName,
    browserVersion: browserVersionMatch?.[1] || "",
    osName,
    platform,
    userAgent,
    language: navigator.language || "en",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    screen: {
      width: window.screen?.width || null,
      height: window.screen?.height || null,
    },
  };
}

export function requestBrowserLocation(timeoutMs = 2000) {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }

    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(null);
      }
    }, timeoutMs);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          label: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
          source: "gps",
        });
      },
      () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(null);
      },
      {
        enableHighAccuracy: false,
        timeout: timeoutMs,
        maximumAge: 5 * 60 * 1000,
      }
    );
  });
}
