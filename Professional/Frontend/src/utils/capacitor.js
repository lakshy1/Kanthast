// Runs only inside a Capacitor-wrapped WebView — silently no-ops in the browser.

export async function initCapacitorPlugins() {
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0B1120' });
  } catch {
    // browser — ignore
  }

  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide({ fadeOutDuration: 500 });
  } catch {
    // browser — ignore
  }
}

// Handles Android hardware back button.
// Navigates back in history; minimises the app when at the root.
export async function setupBackButton(navigate) {
  try {
    const { App } = await import('@capacitor/app');
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        App.minimizeApp();
      }
    });
  } catch {
    // browser — ignore
  }
}

// Persist a value using Capacitor Preferences (encrypted native key-value store).
// Falls back to localStorage in the browser.
export async function setPreference(key, value) {
  try {
    const { Preferences } = await import('@capacitor/preferences');
    await Preferences.set({ key, value: JSON.stringify(value) });
  } catch {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

export async function getPreference(key) {
  try {
    const { Preferences } = await import('@capacitor/preferences');
    const { value } = await Preferences.get({ key });
    return value ? JSON.parse(value) : null;
  } catch {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }
}

export async function removePreference(key) {
  try {
    const { Preferences } = await import('@capacitor/preferences');
    await Preferences.remove({ key });
  } catch {
    localStorage.removeItem(key);
  }
}
