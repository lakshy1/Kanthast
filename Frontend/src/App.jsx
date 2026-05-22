import "./App.css";
import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, MotionConfig } from "framer-motion";
import ErrorBoundary from "./components/ErrorBoundary";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import OfflineBanner from "./components/OfflineBanner";
import { warmupBackend, prefetchImages, prefetchContent } from "./utils/warmup";
import { useAppSettings } from "./utils/settings";
import { initCapacitorPlugins, setupBackButton } from "./utils/capacitor";

const Homepage = lazy(() => import("./pages/Homepage"));
const About = lazy(() => import("./pages/About"));
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
  return <div className="min-h-screen bg-white" />;
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
        className="absolute w-full bg-[#0a1530]"
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
  const settings = useAppSettings();

  // Init Capacitor native plugins (status bar, splash hide) and Android back button.
  useEffect(() => {
    initCapacitorPlugins();
    setupBackButton(navigate);
  }, []);

  // Parallel to the loading animation: wake up the Render backend and
  // prefetch all page images into the browser cache using idle bandwidth.
  useEffect(() => {
    warmupBackend().then(() => prefetchContent());
    const timer = setTimeout(prefetchImages, 2000);
    return () => clearTimeout(timer);
  }, []);

  useLayoutEffect(() => {
    if (location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname, location.search, location.hash]);

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

    let duration = 520;
    if (isFirstRender.current) {
      duration = isFirstEverVisit.current ? 2500 : 1100;
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
    const theme = settings.appearance.toLowerCase();
    root.dataset.theme = theme;
    root.dataset.compact = settings.compactLayout ? "true" : "false";
    root.dataset.reduceMotion = settings.reduceMotion ? "true" : "false";
    root.style.colorScheme = settings.appearance === "Dark" ? "dark" : "light";
  }, [settings.appearance, settings.compactLayout, settings.reduceMotion]);

  return (
    <MotionConfig reducedMotion={settings.reduceMotion ? "always" : "never"}>
      <div className="min-h-screen w-screen">
        <GlobalScrollbar />
        <OfflineBanner />

        {!isAdminRoute && <Navbar />}

        {/* Content shifts with the navbar — padding-top tracks --navbar-h CSS var */}
        {/* padding-bottom on mobile clears the fixed bottom dock (always visible on mobile) */}
        <div
          style={{
            paddingTop: isAdminRoute ? 0 : "var(--navbar-h, 4rem)",
            transition: "padding-top 0.3s cubic-bezier(0.4,0,0.2,1)",
          }}
          className={!isAdminRoute ? "pb-16 md:pb-0" : ""}
        >
          <Suspense fallback={<ChunkFallback />}>
            <AnimatePresence mode="wait">
              {loading && <EdtechLoader />}
            </AnimatePresence>

            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Homepage />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
                <Route path="/signup" element={<GuestOnly><Signup /></GuestOnly>} />
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
              </Routes>
            </ErrorBoundary>
          </Suspense>

          {/* Footer: hidden on mobile when logged in (bottom dock handles nav) */}
          {!isAdminRoute && (
            <div className={hasAuth() ? "hidden md:block" : ""}>
              <Footer />
            </div>
          )}
        </div>
      </div>
    </MotionConfig>
  );
}

export default App;
