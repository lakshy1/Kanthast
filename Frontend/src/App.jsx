import "./App.css";
import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, MotionConfig } from "framer-motion";
import ErrorBoundary from "./components/ErrorBoundary";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import OfflineBanner from "./components/OfflineBanner";
import ComingSoon from "./pages/ComingSoon";
import { warmupBackend, prefetchContent } from "./utils/warmup";
import { useAppSettings } from "./utils/settings";
import { initCapacitorPlugins, setupBackButton } from "./utils/capacitor";

// Set to true to replace the public product site-wide with the coming-soon
// page while Kanthast is rebuilt. Admin routes stay reachable either way.
const SHOW_COMING_SOON = false;

const Homepage = lazy(() => import("./pages/Homepage"));
const SchoolHomepage = lazy(() => import("./pages/SchoolHomepage"));
const About = lazy(() => import("./pages/About"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Contact = lazy(() => import("./pages/Contact"));
const Courses = lazy(() => import("./pages/Courses"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const EdtechLoader = lazy(() => import("./pages/EdtechLoader"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const Lists = lazy(() => import("./pages/Lists"));
const SummaryPage = lazy(() => import("./pages/SummaryPage"));
const VideoPage = lazy(() => import("./pages/VideoPage"));
const ImagesPage = lazy(() => import("./pages/ImagesPage"));
const Chatbot = lazy(() => import("./pages/Chatbot"));
const SubscriptionPage = lazy(() => import("./pages/SubscriptionPage"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const PageLoader = lazy(() => import("./pages/PageLoader"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Legal = lazy(() => import("./pages/Legal"));

const hasAuth = () =>
  Boolean(localStorage.getItem("kanthastToken") && localStorage.getItem("kanthastUser"));

function RequireAuth({ children }) {
  return hasAuth() ? children : <Navigate to="/login" replace />;
}

function GuestOnly({ children }) {
  return hasAuth() ? <Navigate to="/dashboard" replace /> : children;
}

const hasAdminAuth = () =>
  Boolean(localStorage.getItem("kanthastAdminToken") && localStorage.getItem("kanthastAdminUser"));

function RequireAdmin({ children }) {
  return hasAdminAuth() ? children : <Navigate to="/adminlogin" replace />;
}

function AdminGuestOnly({ children }) {
  return hasAdminAuth() ? <Navigate to="/admin" replace /> : children;
}

// Minimal inline fallback — avoids a flash of the full EdtechLoader on first
// lazy chunk fetch. EdtechLoader itself is used for page-transition animation.
function ChunkFallback() {
  return <div className="min-h-screen bg-surface" />;
}

// Fixed overlay scrollbar — replaces the native browser scrollbar globally.
// Hidden at rest, fades in on scroll, auto-hides after 1.2 s of inactivity.
function GlobalScrollbar() {
  const thumbRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef(null);

  useEffect(() => {
    const updateThumb = () => {
      const thumb = thumbRef.current;
      if (!thumb) return;
      const scrollTop = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      if (scrollHeight <= clientHeight) return;
      const ratio = clientHeight / scrollHeight;
      const thumbH = Math.max(ratio * clientHeight, 32);
      const maxScroll = scrollHeight - clientHeight;
      const thumbTop = (scrollTop / maxScroll) * (clientHeight - thumbH);
      thumb.style.height = thumbH + "px";
      thumb.style.top = thumbTop + "px";
    };

    const onScroll = () => {
      updateThumb();
      setVisible(true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setVisible(false), 1200);
    };

    updateThumb();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateThumb, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateThumb);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  return (
    <div
      className="fixed right-0 top-0 bottom-0 w-1.5 pointer-events-none z-[9999]"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 0.3s" }}
    >
      <div
        ref={thumbRef}
        className="absolute w-full bg-ink/40"
        style={{ top: 0 }}
      />
    </div>
  );
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const isFirstRender = useRef(true);
  const isFirstEverVisit = useRef(!localStorage.getItem("kanthastVisited"));
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isGatedRoute = SHOW_COMING_SOON && !isAdminRoute && location.pathname !== "/adminlogin";
  const settings = useAppSettings();

  // Init Capacitor native plugins (status bar, splash hide) and Android back button.
  useEffect(() => {
    initCapacitorPlugins();
    setupBackButton(navigate);
  }, []);

  // Parallel to the loading animation: wake up the Render backend, then
  // prefetch the catalog.
  useEffect(() => {
    warmupBackend().then(() => prefetchContent());
  }, []);

  useLayoutEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      return;
    }

    // The target section can be behind a lazy-loaded page chunk (Suspense),
    // so it may not exist in the DOM yet on the render this effect runs in
    // — a plain `scrollIntoView` here silently no-ops and the page is left
    // at the top. Poll briefly for the element instead of assuming it's
    // already mounted, and offset for the fixed navbar so the section
    // isn't left hidden underneath it.
    const id = location.hash.slice(1);
    let attempts = 0;
    let raf;
    const tryScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        const navbarH = parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue("--navbar-h")
        ) || 64;
        const top = el.getBoundingClientRect().top + window.scrollY - navbarH - 16;
        window.scrollTo({ top, left: 0, behavior: "smooth" });
        return;
      }
      attempts += 1;
      if (attempts < 60) raf = requestAnimationFrame(tryScroll);
    };
    tryScroll();

    return () => cancelAnimationFrame(raf);
  }, [location.pathname, location.search, location.hash]);

  // Move focus to the main landmark on navigation so screen readers announce
  // the new page and keyboard tabbing restarts from the content, not the URL
  // bar. Skipped on first paint so initial load isn't stolen from the browser.
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    document.getElementById("main-content")?.focus({ preventScroll: true });
  }, [location.pathname]);

  useLayoutEffect(() => {
    const authRoutes = ["/login", "/signup"];
    if (authRoutes.includes(location.pathname)) {
      const timer = setTimeout(() => {
        setLoading(false);
        isFirstRender.current = false;
      }, 0);
      return () => clearTimeout(timer);
    }

    if (sessionStorage.getItem("kanthastSkipNextLoader") === "true") {
      sessionStorage.removeItem("kanthastSkipNextLoader");
      const timer = setTimeout(() => {
        setLoading(false);
        isFirstRender.current = false;
      }, 0);
      return () => clearTimeout(timer);
    }

    // Transition durations are kept short: the loader should mask real latency,
    // not manufacture it. (Was 2500ms on first visit / 1100ms thereafter.)
    let duration = 320;
    if (isFirstRender.current) {
      duration = isFirstEverVisit.current ? 900 : 600;
      if (isFirstEverVisit.current) {
        localStorage.setItem("kanthastVisited", "true");
        isFirstEverVisit.current = false;
      }
    }

    const startTimer = setTimeout(() => setLoading(true), 0);
    const endTimer = setTimeout(() => setLoading(false), duration);

    isFirstRender.current = false;

    return () => {
      clearTimeout(startTimer);
      clearTimeout(endTimer);
    };
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    const root = document.documentElement;
    const theme = settings.appearance.toLowerCase(); // "system" | "light" | "dark"
    root.dataset.theme = theme;
    root.dataset.compact = settings.compactLayout ? "true" : "false";
    root.dataset.reduceMotion = settings.reduceMotion ? "true" : "false";
    // "system" defers to the OS so the browser paints native UI to match.
    root.style.colorScheme =
      theme === "system" ? "light dark" : theme;
  }, [settings.appearance, settings.compactLayout, settings.reduceMotion]);

  return (
    // "user" defers to the OS prefers-reduced-motion setting; the in-app
    // toggle can still force it on. Passing "never" (the old default) actively
    // overrode a user's OS-level accessibility preference.
    <MotionConfig reducedMotion={settings.reduceMotion ? "always" : "user"}>
      <div className="min-h-screen w-screen bg-surface-sunken text-ink">
        {/* Keyboard users reach content without tabbing the whole navbar. */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[10001]
                     focus:rounded-control focus:bg-brand focus:px-5 focus:py-3
                     focus:font-semibold focus:text-brand-fg focus:shadow-e3"
        >
          Skip to main content
        </a>
        <GlobalScrollbar />
        <OfflineBanner />

        {!isAdminRoute && !isGatedRoute && <Navbar />}

        {/* Content shifts with the navbar — padding-top tracks --navbar-h CSS var */}
        {/* Bottom-dock clearance sits inside the footer wrapper when the footer shows,
            so it takes the footer colour instead of a pale strip below it. */}
        <main
          id="main-content"
          tabIndex={-1}
          style={{
            paddingTop: isAdminRoute || isGatedRoute ? 0 : "var(--navbar-h, 4rem)",
            transition: "padding-top 250ms cubic-bezier(0.22,1,0.36,1)",
          }}
          className={`focus:outline-none ${
            !isAdminRoute && !isGatedRoute ? (hasAuth() ? "pb-16 md:pb-0" : "") : ""
          }`}
        >
          <Suspense fallback={<ChunkFallback />}>
            <AnimatePresence mode="wait">
              {loading && <EdtechLoader />}
            </AnimatePresence>

            <ErrorBoundary>
              {isGatedRoute ? (
                <ComingSoon />
              ) : (
                <Routes>
                  <Route path="/" element={<Homepage />} />
                  <Route path="/school" element={<SchoolHomepage />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/terms" element={<Legal doc="terms" />} />
                  <Route path="/privacy" element={<Legal doc="privacy" />} />
                  <Route path="/refunds" element={<Legal doc="refunds" />} />
                  <Route path="/courses" element={<Courses />} />
                  <Route path="/school/courses" element={<Courses />} />
                  <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
                  <Route path="/school/login" element={<GuestOnly><Login /></GuestOnly>} />
                  <Route path="/signup" element={<GuestOnly><Signup /></GuestOnly>} />
                  <Route path="/school/signup" element={<GuestOnly><Signup /></GuestOnly>} />
                  <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
                  <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
                  <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
                  <Route path="/lists" element={<Lists />} />
                  <Route path="/summary" element={<RequireAuth><SummaryPage /></RequireAuth>} />
                  <Route path="/video" element={<RequireAuth><VideoPage /></RequireAuth>} />
                  <Route path="/images" element={<RequireAuth><ImagesPage /></RequireAuth>} />
                  <Route path="/chatbot" element={<RequireAuth><Chatbot /></RequireAuth>} />
                  <Route path="/subscription" element={<RequireAuth><SubscriptionPage /></RequireAuth>} />
                  <Route path="/adminlogin" element={<AdminGuestOnly><AdminLogin /></AdminGuestOnly>} />
                  <Route path="/admin" element={<RequireAdmin><AdminPanel /></RequireAdmin>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              )}
            </ErrorBoundary>
          </Suspense>

          {/* Footer: hidden on mobile when logged in (bottom dock handles nav) */}
          {!isAdminRoute && !isGatedRoute && (
            <div className={hasAuth() ? "hidden bg-[#060e1b] md:block md:pb-16 lg:pb-0" : "bg-[#060e1b] pb-16 lg:pb-0"}>
              <Footer />
            </div>
          )}
        </main>
      </div>
    </MotionConfig>
  );
}

export default App;
