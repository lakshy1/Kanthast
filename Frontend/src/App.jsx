import "./App.css";
import { lazy, Suspense, useLayoutEffect, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import ErrorBoundary from "./components/ErrorBoundary";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

const Homepage = lazy(() => import("./pages/Homepage"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Courses = lazy(() => import("./pages/Courses"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const EdtechLoader = lazy(() => import("./pages/EdtechLoader"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
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

function App() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const isFirstRender = useRef(true);
  const isAdminRoute = location.pathname.startsWith("/admin");

  useLayoutEffect(() => {
    if (location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname, location.search, location.hash]);

  useLayoutEffect(() => {
    const authRoutes = ["/login", "/signup"];
    if (authRoutes.includes(location.pathname)) {
      setLoading(false);
      isFirstRender.current = false;
      return;
    }

    if (sessionStorage.getItem("kanthastSkipNextLoader") === "true") {
      sessionStorage.removeItem("kanthastSkipNextLoader");
      setLoading(false);
      isFirstRender.current = false;
      return;
    }

    setLoading(true);

    const timer = setTimeout(
      () => setLoading(false),
      isFirstRender.current ? 1100 : 520
    );

    isFirstRender.current = false;

    return () => clearTimeout(timer);
  }, [location.pathname, location.search, location.hash]);

  return (
    <div className="min-h-screen w-screen">
      {!isAdminRoute && <Navbar />}

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
            <Route path="/lists" element={<RequireAuth><Lists /></RequireAuth>} />
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

      {!isAdminRoute && <Footer />}
    </div>
  );
}

export default App;
