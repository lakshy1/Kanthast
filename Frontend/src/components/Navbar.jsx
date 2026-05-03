import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { HashLink } from "react-router-hash-link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaChevronDown, FaRobot, FaUserCircle, FaCog,
  FaTachometerAlt, FaList, FaSignOutAlt, FaCrown, FaHome,
  FaBookOpen, FaStar, FaInfoCircle, FaEnvelope,
} from "react-icons/fa";

const Logo = "/Logo-Extended.png";

// ── Bottom dock items (logged in) ────────────────────────────────────────────
const dockItems = [
  { to: "/",          label: "Home",      icon: FaHome,         exact: true },
  { to: "/dashboard", label: "Dashboard", icon: FaTachometerAlt, exact: false },
  { to: "/lists",     label: "Lists",     icon: FaList,         exact: false },
  { to: "/chatbot",   label: "Chatbot",   icon: FaRobot,        exact: false },
];

// ── Bottom dock items (logged out / public) ───────────────────────────────────
const publicDockItems = [
  { to: "/",            label: "Home",     icon: FaHome,        exact: true },
  { to: "/courses",     label: "Courses",  icon: FaBookOpen,    exact: false },
  { to: "/subscription",label: "Plans",    icon: FaStar,        exact: false },
  { to: "/about",       label: "About",    icon: FaInfoCircle,  exact: false },
  { to: "/contact",     label: "Contact",  icon: FaEnvelope,    exact: false },
];

const NAVBAR_H = "4rem"; // must match h-16

const Navbar = () => {
  const [isCoursesOpen, setIsCoursesOpen]             = useState(false);
  const [isDesktopUserOpen, setIsDesktopUserOpen]     = useState(false);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);
  const [navVisible, setNavVisible]                   = useState(true);

  const mobileProfileRef = useRef(null);
  const lastScrollY      = useRef(0);
  const location  = useLocation();
  const navigate  = useNavigate();

  const token   = localStorage.getItem("kanthastToken");
  const rawUser = localStorage.getItem("kanthastUser");
  const user    = useMemo(() => {
    try { return rawUser ? JSON.parse(rawUser) : null; }
    catch { return null; }
  }, [rawUser]);
  const isLoggedIn      = Boolean(token && user);
  const hasSubscription = Boolean(user?.subscriptionPurchased);

  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() || "U";
  const avatarColors = ["#0ea5e9", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6", "#22c55e"];
  const colorSeed = initials.charCodeAt(0) + (initials.charCodeAt(1) || 0);
  const avatarBg  = avatarColors[colorSeed % avatarColors.length];

  // Hide navbar on scroll down, reveal on scroll up
  useEffect(() => {
    const THRESHOLD = 10;
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 60) {
        setNavVisible(true);
      } else if (y > lastScrollY.current + THRESHOLD) {
        setNavVisible(false);
        setIsCoursesOpen(false);
        setIsDesktopUserOpen(false);
        setIsMobileProfileOpen(false);
      } else if (y < lastScrollY.current - THRESHOLD) {
        setNavVisible(true);
      }
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Sync CSS variable so the content wrapper can follow navbar height
  useEffect(() => {
    document.documentElement.style.setProperty("--navbar-h", navVisible ? NAVBAR_H : "0px");
  }, [navVisible]);

  // Set initial CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty("--navbar-h", NAVBAR_H);
  }, []);

  // Close mobile profile dropdown on outside click
  useEffect(() => {
    if (!isMobileProfileOpen) return;
    const handler = (e) => {
      if (mobileProfileRef.current && !mobileProfileRef.current.contains(e.target))
        setIsMobileProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isMobileProfileOpen]);

  const handleLogout = () => {
    localStorage.removeItem("kanthastToken");
    localStorage.removeItem("kanthastUser");
    setIsMobileProfileOpen(false);
    setIsDesktopUserOpen(false);
    navigate("/login");
  };

  const activeClass  = "text-cyan-400 font-semibold";
  const normalClass  = "text-white/60 hover:text-white transition duration-200";

  return (
    <>
      {/* ── Top navbar ── */}
      <nav
        className="w-full fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#060c16] via-[#0a1530] to-[#07101e] border-b border-white/8 will-change-transform"
        style={{
          transform: navVisible ? "translateY(0)" : "translateY(-100%)",
          transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div className="max-w-7xl mx-auto px-5 md:px-16 flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center h-full focus-visible:outline-none">
            <img src={Logo} alt="Kanthast" className="h-8 w-auto object-contain" />
          </Link>

          {/* ── Desktop nav links ── */}
          <div className="hidden md:flex items-center gap-7 text-lg">
            <NavLink to="/" end className={({ isActive }) => isActive ? activeClass : normalClass}>Home</NavLink>

            {/* Courses dropdown */}
            <div className="relative" onMouseEnter={() => setIsCoursesOpen(true)} onMouseLeave={() => setIsCoursesOpen(false)}>
              <div className="flex items-center gap-1">
                <NavLink to="/courses" className={location.pathname === "/courses" ? activeClass : normalClass}>
                  Courses
                </NavLink>
                <motion.span
                  animate={{ rotate: isCoursesOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-white/40 text-[9px] cursor-pointer"
                >
                  <FaChevronDown />
                </motion.span>
              </div>
              <AnimatePresence>
                {isCoursesOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 mt-3 w-52 bg-white rounded-2xl shadow-2xl shadow-black/20 p-1.5 border border-slate-100"
                  >
                    {[
                      { to: "/courses#medicine", label: "Medicine / USMLE" },
                      { to: "/courses#neet-pg",  label: "NEET PG" },
                      { to: "/courses#ini-cet",  label: "INI CET" },
                    ].map(({ to, label }) => (
                      <HashLink key={to} to={to} className="block px-4 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-slate-50 transition">
                        {label}
                      </HashLink>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <NavLink to="/lists" className={({ isActive }) => isActive ? activeClass : normalClass}>Lists</NavLink>
            {isLoggedIn && <NavLink to="/dashboard" className={({ isActive }) => isActive ? activeClass : normalClass}>Dashboard</NavLink>}
            {(!isLoggedIn || !hasSubscription) && <NavLink to="/subscription" className={({ isActive }) => isActive ? activeClass : normalClass}>Subscription</NavLink>}
            <NavLink to="/about" className={({ isActive }) => isActive ? activeClass : normalClass}>About</NavLink>
            <NavLink to="/contact" className={({ isActive }) => isActive ? activeClass : normalClass}>Contact</NavLink>
          </div>

          {/* ── Desktop right actions ── */}
          <div className="hidden md:flex items-center gap-3">
            {!isLoggedIn ? (
              <>
                <Link to="/login" className="px-4 py-2 rounded-xl text-lg text-white/70 bg-white/8 border border-white/10 hover:bg-white/14 transition">Log In</Link>
                <Link to="/signup" className="px-4 py-2 rounded-xl text-lg font-semibold text-white bg-cyan-500 hover:bg-cyan-400 transition">Sign Up</Link>
              </>
            ) : (
              <>
                {/* Chatbot shortcut */}
                <button
                  onClick={() => navigate("/chatbot")}
                  className="w-9 h-9 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25 transition flex items-center justify-center"
                  aria-label="Chatbot"
                >
                  <FaRobot className="text-sm" />
                </button>

                {/* Desktop avatar + dropdown */}
                <div
                  className="relative"
                  onMouseEnter={() => setIsDesktopUserOpen(true)}
                  onMouseLeave={() => setIsDesktopUserOpen(false)}
                >
                  <button className="flex items-center gap-2 px-2 py-1 rounded-full bg-white/8 border border-white/15 focus-visible:outline-none">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: avatarBg }}>
                      {initials}
                    </div>
                    <FaChevronDown className={`text-[9px] text-white/40 transition-transform duration-200 ${isDesktopUserOpen ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {isDesktopUserOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl shadow-black/15 p-1.5 border border-slate-100"
                      >
                        <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                          <p className="text-sm font-semibold text-slate-800 truncate">{user?.firstName} {user?.lastName}</p>
                          <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                        </div>
                        <Link to="/profile" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-slate-50 transition">
                          <FaUserCircle className="text-slate-400 text-xs" /> My Profile
                        </Link>
                        <Link to="/settings" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-slate-50 transition">
                          <FaCog className="text-slate-400 text-xs" /> Settings
                        </Link>
                        {!hasSubscription && (
                          <Link to="/subscription" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-slate-50 transition">
                            <FaCrown className="text-amber-400 text-xs" /> Subscription
                          </Link>
                        )}
                        <div className="my-1 border-t border-slate-100" />
                        <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition">
                          <FaSignOutAlt className="text-xs" /> Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </div>

          {/* ── Mobile right: profile avatar (logged in) or login button (logged out) ── */}
          <div className="md:hidden">
            {isLoggedIn ? (
              <div ref={mobileProfileRef} className="relative">
                <button
                  onClick={() => setIsMobileProfileOpen((p) => !p)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/8 border border-white/15"
                  aria-label="Profile menu"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: avatarBg }}>
                    {initials}
                  </div>
                  <FaChevronDown className={`text-[9px] text-white/40 transition-transform duration-200 ${isMobileProfileOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {isMobileProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl shadow-black/20 p-1.5 border border-slate-100 z-50"
                    >
                      {/* User info */}
                      <div className="flex items-center gap-3 px-3 py-3 mb-1 border-b border-slate-100">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ backgroundColor: avatarBg }}>
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{user?.firstName} {user?.lastName}</p>
                          <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                        </div>
                      </div>

                      <Link to="/profile" onClick={() => setIsMobileProfileOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-slate-50 transition">
                        <FaUserCircle className="text-slate-400 text-xs" /> My Profile
                      </Link>
                      <Link to="/settings" onClick={() => setIsMobileProfileOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-slate-50 transition">
                        <FaCog className="text-slate-400 text-xs" /> Settings
                      </Link>
                      {!hasSubscription && (
                        <Link to="/subscription" onClick={() => setIsMobileProfileOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-slate-50 transition">
                          <FaCrown className="text-amber-400 text-xs" /> Subscription
                        </Link>
                      )}
                      <div className="my-1 border-t border-slate-100" />
                      <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition">
                        <FaSignOutAlt className="text-xs" /> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="px-3 py-1.5 rounded-xl text-sm text-white/70 bg-white/8 border border-white/10 hover:bg-white/14 transition">Log In</Link>
                <Link to="/signup" className="px-3 py-1.5 rounded-xl text-sm font-semibold text-white bg-cyan-500 hover:bg-cyan-400 transition">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── Mobile bottom dock (always visible on mobile) ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#07101e]/95 backdrop-blur-xl border-t border-white/10"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className={`grid h-16 ${isLoggedIn ? "grid-cols-4" : "grid-cols-5"}`}>
          {(isLoggedIn ? dockItems : publicDockItems).map(({ to, label, icon: Icon, exact }) => {
            const isActive = exact ? location.pathname === to : location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`relative flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive ? "text-cyan-400" : "text-white/40 hover:text-white/70"
                }`}
              >
                <motion.div
                  animate={{ scale: isActive ? 1.15 : 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <Icon className={`text-lg ${isActive ? "drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" : ""}`} />
                </motion.div>
                <span className={`text-[10px] font-medium tracking-wide ${isActive ? "text-cyan-400" : "text-white/35"}`}>
                  {label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="dockIndicator"
                    className="absolute top-0 w-8 h-0.5 rounded-full bg-cyan-400"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Navbar;
