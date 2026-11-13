import "./App.css";
import { lazy, Suspense, useEffect, useLayoutEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import ErrorBoundary from "./components/ErrorBoundary";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { useAppSettings } from "./utils/settings";
import BootDone from "./components/BootDone";
import TopProgress from "./components/TopProgress";

const KanthastHome = lazy(() => import("./pages/KanthastHome"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));

// kanthast.in is three apps on one domain: this landing site (/, /about, /contact), /professional
// and /school. Any link that leaves "/" must be a full page load so Vercel
// routes it to the right app, not a client-side route inside this one.
const OWN_PATHS = new Set(["/", "/about", "/contact"]);

// Fallback for programmatic navigation to another app: load it for real.
function LeaveForOtherApp() {
  const { pathname, search, hash } = useLocation();
  useEffect(() => {
    window.location.assign(`${pathname}${search}${hash}`);
  }, [pathname, search, hash]);
  return <div className="min-h-screen" data-leaving="true" />;
}

// Links to /professional, /school or any path this app does not own are real
// page loads (the browser keeps a normal history entry, so Back works), never
// client-side routes. Runs in the capture phase, before React Router sees it.
function useCrossAppLinks() {
  useEffect(() => {
    const onClick = (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest?.("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      const path = url.pathname.replace(/\/+$/, "") || "/";
      if (OWN_PATHS.has(path)) return;
      event.stopPropagation(); // keep React Router out; the browser navigates normally
    };
    // Restored from the back/forward cache mid-navigation: reload to a clean state.
    const onPageShow = (event) => {
      if (event.persisted && document.querySelector("[data-leaving]")) window.location.reload();
    };
    window.addEventListener("click", onClick, true);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);
}

export default function App() {
  const location = useLocation();
  const settings = useAppSettings();
  useCrossAppLinks();

  useLayoutEffect(() => {
    if (!location.hash) window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    else document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const root = document.documentElement;
    const theme = settings.appearance.toLowerCase();
    root.dataset.theme = theme;
    root.dataset.reduceMotion = settings.reduceMotion ? "true" : "false";
    root.style.colorScheme = theme === "system" ? "light dark" : theme;
  }, [settings.appearance, settings.reduceMotion]);

  return (
    <MotionConfig reducedMotion={settings.reduceMotion ? "always" : "user"}>
      <div className="min-h-screen w-full text-ink" style={{ background: "#eef3fd" }}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[10001]
                     focus:rounded-control focus:bg-brand focus:px-5 focus:py-3
                     focus:font-semibold focus:text-brand-fg focus:shadow-e3"
        >
          Skip to main content
        </a>
        <Navbar />
        <main id="main-content" tabIndex={-1} className="focus:outline-none" style={{ paddingTop: "var(--navbar-h, 4rem)" }}>
          <Suspense fallback={<TopProgress />}>
            <BootDone />
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<KanthastHome />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="*" element={<LeaveForOtherApp />} />
              </Routes>
            </ErrorBoundary>
          </Suspense>
          <Footer />
        </main>
      </div>
    </MotionConfig>
  );
}
