import "./App.css";
import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { SITE_URL } from "./utils/seo";
import ErrorBoundary from "./components/ErrorBoundary";
import BootDone from "./components/BootDone";
import TopProgress from "./components/TopProgress";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import OfflineBanner from "./components/OfflineBanner";
import { warmupBackend } from "./utils/warmup";
import { useAppSettings } from "./utils/settings";

const SchoolHomepage = lazy(() => import("./pages/SchoolHomepage"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Courses = lazy(() => import("./pages/Courses"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const Lists = lazy(() => import("./pages/Lists"));
const SummaryPage = lazy(() => import("./pages/SummaryPage"));
const VideoPage = lazy(() => import("./pages/VideoPage"));
const Chatbot = lazy(() => import("./pages/Chatbot"));
const SubscriptionPage = lazy(() => import("./pages/SubscriptionPage"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const PageLoader = lazy(() => import("./pages/PageLoader"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Legal = lazy(() => import("./pages/Legal"));

const hasAuth = () =>
  Boolean(localStorage.getItem("kanthastSchoolToken") && localStorage.getItem("kanthastSchoolUser"));

function RequireAuth({ children }) {
  return hasAuth() ? children : <Navigate to="/login" replace />;
}

function GuestOnly({ children }) {
  return hasAuth() ? <Navigate to="/dashboard" replace /> : children;
}

const hasAdminAuth = () =>
  Boolean(localStorage.getItem("kanthastSchoolAdminToken") && localStorage.getItem("kanthastSchoolAdminUser"));

function RequireAdmin({ children }) {
  return hasAdminAuth() ? children : <Navigate to="/adminlogin" replace />;
}

function AdminGuestOnly({ children }) {
  return hasAdminAuth() ? <Navigate to="/admin" replace /> : children;
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

// Default head tags for every route: canonical and og:url follow the current
// path; pages with their own <Seo>/<Helmet> override title and description.
const DEFAULT_TITLE = 'Kanthast School | Animated lessons with AI help for Classes VIII to X';
const DEFAULT_DESCRIPTION = 'Kanthast School teaches one idea at a time through short animated lessons for the new NCERT books, Classes VIII to X, with AI help.';
const SHARE_IMAGE = `${SITE_URL}/Banner.png`;

function DefaultSeo() {
  const { pathname } = useLocation();
  const url = `${SITE_URL}${pathname === "/" ? "/" : pathname.replace(/\/+$/, "")}`;
  return (
    <Helmet>
      <title>{DEFAULT_TITLE}</title>
      <meta name="description" content={DEFAULT_DESCRIPTION} />
      <link rel="canonical" href={url} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Kanthast" />
      <meta property="og:locale" content="en_IN" />
      <meta property="og:title" content={DEFAULT_TITLE} />
      <meta property="og:description" content={DEFAULT_DESCRIPTION} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={SHARE_IMAGE} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={DEFAULT_TITLE} />
      <meta name="twitter:description" content={DEFAULT_DESCRIPTION} />
      <meta name="twitter:image" content={SHARE_IMAGE} />
    </Helmet>
  );
}

function LibrarySeo() {
  const title = 'Lesson Library | Kanthast School';
  const description = 'Browse Kanthast School lessons for Classes VIII to X by subject and chapter, following the new NCERT books.';
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}

// Account, player and admin pages are for signed-in users, not search results.
const NOINDEX_PATH = /^\/(login|signup|dashboard|profile|settings|video|summary|images|chatbot|subscription|admin|adminlogin)(\/|$)/;

function RouteRobots() {
  const { pathname } = useLocation();
  if (!NOINDEX_PATH.test(pathname)) return null;
  return (
    <Helmet>
      <meta name="robots" content="noindex, follow" />
    </Helmet>
  );
}

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  // Every Kanthast School page runs on the sky gradient; admin keeps its own look.
  const isSkyTheme = !isAdminRoute;
  const settings = useAppSettings();

  // Wake the backend while the page loads (free-tier hosts sleep when idle).
  useEffect(() => {
    warmupBackend();
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
      <div className={`min-h-screen w-screen bg-surface-sunken text-ink${isSkyTheme ? " kb-sky" : ""}`}>
        {isSkyTheme && <div aria-hidden="true" className="kb-sky-bg" />}
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
        <DefaultSeo />
        <RouteRobots />
        <OfflineBanner />

        {!isAdminRoute && <Navbar />}

        {/* Content shifts with the navbar — padding-top tracks --navbar-h CSS var */}
        {/* Bottom-dock clearance sits inside the footer wrapper when the footer shows,
            so it takes the footer colour instead of a pale strip below it. */}
        <main
          id="main-content"
          tabIndex={-1}
          style={{
            paddingTop: isAdminRoute ? 0 : "var(--navbar-h, 4rem)",
            transition: "padding-top 250ms cubic-bezier(0.22,1,0.36,1)",
          }}
          className={`focus:outline-none ${
            !isAdminRoute ? (hasAuth() ? "pb-16 md:pb-0" : "") : ""
          }`}
        >
          <Suspense fallback={<TopProgress />}>
            <BootDone />

            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<SchoolHomepage />} />
                <Route path="/school" element={<Navigate to="/" replace />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/terms" element={<Legal doc="terms" />} />
                <Route path="/privacy" element={<Legal doc="privacy" />} />
                <Route path="/refunds" element={<Legal doc="refunds" />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
                <Route path="/signup" element={<GuestOnly><Signup /></GuestOnly>} />
                <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
                <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
                <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
                <Route path="/library" element={<><LibrarySeo /><Lists /></>} />
                <Route path="/lists" element={<Navigate to="/library" replace />} />
                <Route path="/summary" element={<RequireAuth><SummaryPage /></RequireAuth>} />
                <Route path="/video" element={<RequireAuth><VideoPage /></RequireAuth>} />
                <Route path="/chatbot" element={<RequireAuth><Chatbot /></RequireAuth>} />
                <Route path="/subscription" element={<RequireAuth><SubscriptionPage /></RequireAuth>} />
                <Route path="/adminlogin" element={<AdminGuestOnly><AdminLogin /></AdminGuestOnly>} />
                <Route path="/admin" element={<RequireAdmin><AdminPanel /></RequireAdmin>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ErrorBoundary>
          </Suspense>

          {/* Footer: hidden on mobile when logged in (bottom dock handles nav) */}
          {!isAdminRoute && (
            <div className={hasAuth() ? "footer-wrap hidden md:block" : "footer-wrap"}>
              <Footer />
            </div>
          )}
        </main>
      </div>
    </MotionConfig>
  );
}

export default App;
