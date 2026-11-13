// The boot loader lives in index.html (pure HTML/CSS) so it shows before any
// JavaScript or stylesheet loads. hideBootLoader() is called once the first page
// has rendered. It waits for:
//   - the intro to finish (about 2.2s on the first load in a visit; 0.7s after
//     that, when the loader runs in its quick mode), so it always appears fully;
//   - the app stylesheet (non-blocking in production), so the page is never
//     shown unstyled.
// Then it lifts away over 0.7s and removes itself.
const INTRO_MS = 2200;
const QUICK_MS = 700;

const cssReady = () =>
  getComputedStyle(document.documentElement).getPropertyValue("--kb-edge").trim() !== "";

export function hideBootLoader() {
  const el = document.getElementById("boot-loader");
  if (!el || el.dataset.done) return;
  el.dataset.done = "1";
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const minimum = reduced ? 0 : el.classList.contains("is-quick") ? QUICK_MS : INTRO_MS;
  const finish = () => {
    const waiting = performance.now() < minimum || (!cssReady() && performance.now() < 15000);
    if (waiting) {
      window.setTimeout(finish, 60);
      return;
    }
    try {
      sessionStorage.setItem("kanthastIntroSeen", "1");
    } catch {
      /* private mode: the intro just plays again next time */
    }
    el.classList.add("is-done");
    window.setTimeout(() => el.remove(), 750);
  };
  finish();
}
