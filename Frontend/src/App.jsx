import "./App.css";
import { Navigate, Route, Routes } from "react-router-dom";
import { useLayoutEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Homepage from "./pages/Homepage";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Courses from "./pages/Courses";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import EdtechLoader from "./pages/EdtechLoader";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Lists from "./pages/Lists";
import SummaryPage from "./pages/SummaryPage";
import VideoPage from "./pages/VideoPage";
import ImagesPage from "./pages/ImagesPage";
import Chatbot from "./pages/Chatbot";

const hasAuth = () =>
  Boolean(localStorage.getItem("kanthastToken") && localStorage.getItem("kanthastUser"));

function RequireAuth({ children }) {
  return hasAuth() ? children : <Navigate to="/login" replace />;
}

function GuestOnly({ children }) {
  return hasAuth() ? <Navigate to="/dashboard" replace /> : children;
}

function App() {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const isFirstRender = useRef(true);

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
      <Navbar />

      <AnimatePresence mode="wait">
        {loading && <EdtechLoader />}
      </AnimatePresence>

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
      </Routes>

      <Footer />
    </div>
  );
}

export default App;
