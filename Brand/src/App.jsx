import "./App.css";
import { lazy, Suspense, useEffect, useLayoutEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import ErrorBoundary from "./components/ErrorBoundary";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { useAppSettings } from "./utils/settings";

const KanthastHome = lazy(() => import("./pages/KanthastHome"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));

// kanthast.in is three apps on one domain: this landing site (/, /about, /contact), /professional
// and /school. Any link that leaves "/" must be a full page load so Vercel
// routes it to the right app, not a client-side route inside this one.
function LeaveForOtherApp() {
  const { pathname, search, hash } = useLocation();
  useEffect(() => {
    window.location.replace(`${pathname}${search}${hash}`);
  }, [pathname, search, hash]);
  return <div className="min-h-screen bg-surface" />;
}

export default function App() {
  const location = useLocation();
  const settings = useAppSettings();

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
      <div className="min-h-screen w-screen bg-surface-sunken text-ink kb-sky">
        <div aria-hidden="true" className="kb-sky-bg" />
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
          <Suspense fallback={<div className="min-h-screen bg-surface" />}>
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
