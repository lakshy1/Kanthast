import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { HashLink } from "react-router-hash-link";
import { motion as Motion, AnimatePresence } from "framer-motion";
import {
  FaChevronDown,
  FaRobot,
  FaUserCircle,
  FaCog,
  FaTachometerAlt,
  FaList,
  FaSignOutAlt,
  FaCrown,
  FaHome,
  FaBookOpen,
  FaStar,
  FaInfoCircle,
  FaEnvelope,
} from "react-icons/fa";

const TRACK_STORAGE_KEY = "kanthastTrack";
const trackOptions = [
  { value: "medical", label: "Medical", path: "/" },
  { value: "school", label: "School", path: "/school" },
];

const dockItems = [
  { to: "/", label: "Home", icon: FaHome, exact: true },
  { to: "/dashboard", label: "Dashboard", icon: FaTachometerAlt, exact: false },
  { to: "/lists", label: "Lists", icon: FaList, exact: false },
  { to: "/chatbot", label: "Chatbot", icon: FaRobot, exact: false },
];

const publicDockItems = [
  { to: "/", label: "Home", icon: FaHome, exact: true },
  { to: "/courses", label: "Courses", icon: FaBookOpen, exact: false },
  { to: "/subscription", label: "Plans", icon: FaStar, exact: false },
  { to: "/about", label: "About", icon: FaInfoCircle, exact: false },
  { to: "/contact", label: "Contact", icon: FaEnvelope, exact: false },
];

const NAVBAR_H = "calc(4rem + env(safe-area-inset-top, 0px))";
// Caveat is loaded from Google Fonts in index.html. The previous stack led
// with "Brush Script MT" — a Windows-only system face — so the brand accent
// silently fell back to a generic cursive on macOS, iOS and Android, i.e. on
// most of the install base.
const brandAccentStyle = {
  fontFamily: '"Caveat", "Segoe Script", cursive',
};

const Navbar = () => {
  const [isCoursesOpen, setIsCoursesOpen] = useState(false);
  const [isDesktopUserOpen, setIsDesktopUserOpen] = useState(false);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);
  const [isTrackMenuOpen, setIsTrackMenuOpen] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const [selectedTrack, setSelectedTrack] = useState(() => {
    try {
      return localStorage.getItem(TRACK_STORAGE_KEY) || "medical";
    } catch {
      return "medical";
    }
  });

  const mobileProfileRef = useRef(null);
  const trackMenuRef = useRef(null);
  const lastScrollY = useRef(0);
  const location = useLocation();
  const navigate = useNavigate();

  const token = localStorage.getItem("kanthastToken");
  const rawUser = localStorage.getItem("kanthastUser");
  const user = useMemo(() => {
    try {
      return rawUser ? JSON.parse(rawUser) : null;
    } catch {
      return null;
    }
  }, [rawUser]);

  const isLoggedIn = Boolean(token && user);
  const hasSubscription = Boolean(user?.subscriptionPurchased);

  // The route is the source of truth for the track, so derive it rather than
  // mirroring it into state. The old effect read AND wrote `selectedTrack`
  // with it in the deps, so it re-ran and rewrote localStorage on every pass.
  const routeTrack = location.pathname.startsWith("/school")
    ? "school"
    : location.pathname === "/"
      ? "medical"
      : null;
  const effectiveTrack = routeTrack || selectedTrack;

  const isSchoolTrack = effectiveTrack === "school";
  const homePath = isSchoolTrack ? "/school" : "/";
  const displayTrack = isSchoolTrack ? "School" : "Medical";

  const initials =
    `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() || "U";
  const avatarColors = ["#0ea5e9", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6", "#22c55e"];
  const colorSeed = initials.charCodeAt(0) + (initials.charCodeAt(1) || 0);
  const avatarBg = avatarColors[colorSeed % avatarColors.length];

  const dockHomeItems = dockItems.map((item) =>
    item.to === "/" ? { ...item, to: homePath } : item
  );
  const dockPublicItems = publicDockItems.map((item) =>
    item.to === "/" ? { ...item, to: homePath } : item
  );

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
        setIsTrackMenuOpen(false);
      } else if (y < lastScrollY.current - THRESHOLD) {
        setNavVisible(true);
      }
      lastScrollY.current = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--navbar-h", navVisible ? NAVBAR_H : "0px");
  }, [navVisible]);

  useEffect(() => {
    document.documentElement.style.setProperty("--navbar-h", NAVBAR_H);
  }, []);

  useEffect(() => {
    if (!isMobileProfileOpen) return;

    const handler = (event) => {
      if (mobileProfileRef.current && !mobileProfileRef.current.contains(event.target)) {
        setIsMobileProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isMobileProfileOpen]);

  useEffect(() => {
    if (!isTrackMenuOpen) return;

    const handler = (event) => {
      if (trackMenuRef.current && !trackMenuRef.current.contains(event.target)) {
        setIsTrackMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isTrackMenuOpen]);

  // Persist the derived track so it survives a reload onto a neutral route
  // like /courses. No setState here: `effectiveTrack` already derives the
  // display value from the route, so writing it back to state would only
  // trigger a second render for a value the first render already had.
  useEffect(() => {
    if (!routeTrack) return;
    try {
      if (localStorage.getItem(TRACK_STORAGE_KEY) !== routeTrack) {
        localStorage.setItem(TRACK_STORAGE_KEY, routeTrack);
      }
    } catch {
      // ignore storage write failures
    }
  }, [routeTrack]);

  const handleLogout = () => {
    localStorage.removeItem("kanthastToken");
    localStorage.removeItem("kanthastUser");
    setIsMobileProfileOpen(false);
    setIsDesktopUserOpen(false);
    navigate("/login");
  };

  const handleTrackChange = (nextTrack) => {
    setSelectedTrack(nextTrack);
    setIsTrackMenuOpen(false);
    try {
      localStorage.setItem(TRACK_STORAGE_KEY, nextTrack);
    } catch {
      // ignore storage write failures
    }

    const nextPath = trackOptions.find((option) => option.value === nextTrack)?.path || "/";
    navigate(nextPath);
  };

  const activeClass = "text-cyan-400 font-semibold";
  const normalClass = "text-white/60 hover:text-white transition duration-200";

  return (
    <>
      <nav
        className="fixed left-0 right-0 top-0 z-50 w-full border-b border-white/8 bg-gradient-to-r from-[#060c16] via-[#0a1530] to-[#07101e] will-change-transform"
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          transform: navVisible ? "translateY(0)" : "translateY(-100%)",
          transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-16">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative pr-6">
              <Link to={homePath} className="flex items-center h-full focus-visible:outline-none">
                <span className="block text-2xl font-black tracking-tight text-white md:text-[1.8rem]">
                  Kanthast
                </span>
              </Link>
              <div ref={trackMenuRef} className="absolute -bottom-4 -right-5 flex items-center gap-1.5">
                <span
                  className="text-mini text-cyan-300 md:text-sm"
                  style={brandAccentStyle}
                >
                  {displayTrack}
                </span>
                <button
                  type="button"
                  onClick={() => setIsTrackMenuOpen((prev) => !prev)}
                  aria-label="Open learning track menu"
                  aria-expanded={isTrackMenuOpen}
                  // 44px hit area, 20px visual. The dot itself is the inner
                  // span; the button just carries the target size.
                  className="group relative grid h-touch w-touch place-items-center"
                >
                  <span className="relative grid h-5 w-5 place-items-center rounded-full border border-white/10 bg-white/6 backdrop-blur-md transition group-hover:border-cyan-300/45 group-hover:bg-cyan-400/10">
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(34,211,238,0.35),transparent_60%),radial-gradient(circle_at_75%_70%,rgba(244,114,182,0.22),transparent_55%)] opacity-80 blur-[2px]"
                    />
                    <FaChevronDown
                      aria-hidden="true"
                      className={`relative z-10 text-micro text-white/75 transition-transform duration-200 ${
                        isTrackMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </span>
                </button>

                <AnimatePresence>
                  {isTrackMenuOpen && (
                    <Motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.16 }}
                      className="absolute right-0 top-7 z-50 w-48 overflow-hidden rounded-2xl border border-cyan-200/40 bg-slate-950/92 p-1.5 shadow-e4 backdrop-blur-xl"
                    >
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(244,114,182,0.16),transparent_34%)]" />
                      <div className="relative z-10">
                        <div className="px-3 pb-2 pt-1">
                          <p className="text-micro font-semibold uppercase tracking-[0.24em] text-cyan-200/70">
                            Explore
                          </p>
                        </div>
                        {trackOptions.map((option) => {
                          const active = option.value === selectedTrack;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handleTrackChange(option.value)}
                              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                                active
                                  ? "bg-white/12 text-white shadow-[inset_0_0_0_1px_rgba(103,232,249,0.18)]"
                                  : "text-white/95 hover:bg-white/8 hover:text-cyan-100"
                              }`}
                            >
                              <span className="font-semibold tracking-[0.01em]">{option.label}</span>
                              <span
                                className={`h-2 w-2 rounded-full ${
                                  active ? "bg-cyan-300 shadow-glow-brand" : "bg-white/35"
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                    </Motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-7 text-lg">
            <NavLink to={homePath} end className={({ isActive }) => (isActive ? activeClass : normalClass)}>
              Home
            </NavLink>

            {!isLoggedIn && isSchoolTrack && (
              <NavLink to="/courses" className={({ isActive }) => (isActive ? activeClass : normalClass)}>
                Courses
              </NavLink>
            )}

            {!isLoggedIn && !isSchoolTrack && (
              <div
                className="relative"
                onMouseEnter={() => setIsCoursesOpen(true)}
                onMouseLeave={() => setIsCoursesOpen(false)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setIsCoursesOpen(false);
                }}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget)) {
                    setIsCoursesOpen(false);
                  }
                }}
              >
                <div className="flex items-center gap-1">
                  <NavLink
                    to="/courses"
                    className={location.pathname === "/courses" ? activeClass : normalClass}
                  >
                    Courses
                  </NavLink>
                  {/* Was a <span>: it looked clickable (cursor-pointer) but was
                      not focusable and had no handler, so the whole submenu
                      was hover-only — unreachable by keyboard and on touch. */}
                  <Motion.button
                    type="button"
                    onClick={() => setIsCoursesOpen((prev) => !prev)}
                    aria-haspopup="menu"
                    aria-expanded={isCoursesOpen}
                    aria-label="Show course tracks"
                    animate={{ rotate: isCoursesOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="grid h-8 w-8 place-items-center text-micro text-white/60 hover:text-white"
                  >
                    <FaChevronDown aria-hidden="true" />
                  </Motion.button>
                </div>
                <AnimatePresence>
                  {isCoursesOpen && (
                    <Motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 mt-3 w-52 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-2xl shadow-black/20"
                    >
                      {[
                        { to: "/courses#medicine", label: "Medicine / USMLE" },
                        { to: "/courses#neet-pg", label: "NEET PG" },
                        { to: "/courses#ini-cet", label: "INI CET" },
                      ].map(({ to, label }) => (
                        <HashLink
                          key={to}
                          to={to}
                          className="block rounded-xl px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                        >
                          {label}
                        </HashLink>
                      ))}
                    </Motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <NavLink to="/lists" className={({ isActive }) => (isActive ? activeClass : normalClass)}>
              Lists
            </NavLink>
            {isLoggedIn && (
              <NavLink
                to="/dashboard"
                className={({ isActive }) => (isActive ? activeClass : normalClass)}
              >
                Dashboard
              </NavLink>
            )}
            {(!isLoggedIn || !hasSubscription) && (
              <NavLink
                to="/subscription"
                className={({ isActive }) => (isActive ? activeClass : normalClass)}
              >
                Subscription
              </NavLink>
            )}
            {!isLoggedIn && (
              <NavLink to="/about" className={({ isActive }) => (isActive ? activeClass : normalClass)}>
                About
              </NavLink>
            )}
            {!isLoggedIn && (
              <NavLink to="/contact" className={({ isActive }) => (isActive ? activeClass : normalClass)}>
                Contact
              </NavLink>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {!isLoggedIn ? (
              <>
                <Link
                  to="/login"
                  className="rounded-xl border border-white/10 bg-white/8 px-4 py-2 text-lg text-white/70 transition hover:bg-white/14"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="rounded-xl bg-cyan-500 px-4 py-2 text-lg font-semibold text-white transition hover:bg-cyan-400"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate("/chatbot")}
                  className="flex h-touch w-touch items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/15 text-cyan-400 transition hover:bg-cyan-500/25"
                  aria-label="Chatbot"
                >
                  <FaRobot className="text-sm" />
                </button>

                <div
                  className="relative"
                  onMouseEnter={() => setIsDesktopUserOpen(true)}
                  onMouseLeave={() => setIsDesktopUserOpen(false)}
                  // Close on Escape and when focus leaves the whole widget —
                  // hover alone left this menu unreachable by keyboard, and
                  // Logout/Profile/Settings live inside it.
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setIsDesktopUserOpen(false);
                  }}
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                      setIsDesktopUserOpen(false);
                    }
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setIsDesktopUserOpen((prev) => !prev)}
                    aria-haspopup="menu"
                    aria-expanded={isDesktopUserOpen}
                    aria-label="Account menu"
                    className="flex min-h-touch items-center gap-2 rounded-full border border-white/15 bg-white/8 px-2 py-1"
                  >
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: avatarBg }}
                      aria-hidden="true"
                    >
                      {initials}
                    </div>
                    <FaChevronDown
                      aria-hidden="true"
                      className={`text-micro text-white/60 transition-transform duration-200 ${
                        isDesktopUserOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isDesktopUserOpen && (
                      <Motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-60 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-2xl shadow-black/15"
                      >
                        <div className="mb-1 border-b border-slate-100 px-3 py-2.5">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {user?.firstName} {user?.lastName}
                          </p>
                          <p className="truncate text-xs text-ink-subtle">{user?.email}</p>
                          {hasSubscription ? (
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <FaCrown className="shrink-0 text-micro text-amber-400" />
                              <span className="text-micro font-semibold text-emerald-600">
                                Pro Active
                              </span>
                              <span className="text-micro text-ink-subtle">·</span>
                              <span className="text-micro text-ink-subtle">
                                Till{" "}
                                {new Date(user?.subscriptionValidTill).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          ) : (
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                              <span className="text-micro text-ink-subtle">No active plan</span>
                            </div>
                          )}
                        </div>
                        <Link
                          to="/profile"
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                        >
                          <FaUserCircle className="text-xs text-ink-subtle" /> My Profile
                        </Link>
                        <Link
                          to="/settings"
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                        >
                          <FaCog className="text-xs text-ink-subtle" /> Settings
                        </Link>
                        {!hasSubscription && (
                          <Link
                            to="/subscription"
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                          >
                            <FaCrown className="text-xs text-amber-400" /> Subscription
                          </Link>
                        )}
                        <div className="my-1 border-t border-slate-100" />
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-red-500 transition hover:bg-red-50"
                        >
                          <FaSignOutAlt className="text-xs" /> Logout
                        </button>
                      </Motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </div>

          <div className="md:hidden">
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <div ref={mobileProfileRef} className="relative">
                  <button
                    onClick={() => setIsMobileProfileOpen((prev) => !prev)}
                    className="flex min-h-touch items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-2 py-1"
                    aria-label="Profile menu"
                  >
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: avatarBg }}
                    >
                      {initials}
                    </div>
                    <FaChevronDown
                      className={`text-micro text-white/40 transition-transform duration-200 ${
                        isMobileProfileOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isMobileProfileOpen && (
                      <Motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 z-50 mt-2 w-52 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-2xl shadow-black/20"
                      >
                        <div className="mb-1 flex items-start gap-3 border-b border-slate-100 px-3 py-3">
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                            style={{ backgroundColor: avatarBg }}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {user?.firstName} {user?.lastName}
                            </p>
                            <p className="truncate text-xs text-ink-subtle">{user?.email}</p>
                            {hasSubscription ? (
                              <div className="mt-1.5 flex items-center gap-1.5">
                                <FaCrown className="shrink-0 text-micro text-amber-400" />
                                <span className="text-micro font-semibold text-emerald-600">
                                  Pro Active
                                </span>
                                <span className="text-micro text-ink-subtle">·</span>
                                <span className="text-micro text-ink-subtle">
                                  Till{" "}
                                  {new Date(user?.subscriptionValidTill).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                            ) : (
                              <div className="mt-1.5 flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                                <span className="text-micro text-ink-subtle">No active plan</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <Link
                          to="/profile"
                          onClick={() => setIsMobileProfileOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                        >
                          <FaUserCircle className="text-xs text-ink-subtle" /> My Profile
                        </Link>
                        <Link
                          to="/settings"
                          onClick={() => setIsMobileProfileOpen(false)}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                        >
                          <FaCog className="text-xs text-ink-subtle" /> Settings
                        </Link>
                        {!hasSubscription && (
                          <Link
                            to="/subscription"
                            onClick={() => setIsMobileProfileOpen(false)}
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                          >
                            <FaCrown className="text-xs text-amber-400" /> Subscription
                          </Link>
                        )}
                        <div className="my-1 border-t border-slate-100" />
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-red-500 transition hover:bg-red-50"
                        >
                          <FaSignOutAlt className="text-xs" /> Logout
                        </button>
                      </Motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="inline-flex min-h-touch items-center rounded-xl border border-white/10 bg-white/8 px-4 text-sm text-white/70 transition hover:bg-white/14"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex min-h-touch items-center rounded-xl bg-brand px-4 text-sm font-semibold text-brand-fg transition hover:bg-brand-hover"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#07101e]/95 backdrop-blur-xl md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className={`grid h-16 ${isLoggedIn ? "grid-cols-4" : "grid-cols-5"}`}>
          {(isLoggedIn ? dockHomeItems : dockPublicItems).map(({ to, label, icon: Icon, exact }) => {
            const isActive = exact ? location.pathname === to : location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`relative flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive ? "text-cyan-400" : "text-white/60 hover:text-white"
                }`}
              >
                <Motion.div
                  animate={{ scale: isActive ? 1.15 : 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <Icon
                    className={`text-lg ${
                      isActive ? "drop-shadow-glow-brand" : ""
                    }`}
                  />
                </Motion.div>
                <span
                  className={`text-micro font-medium tracking-wide ${
                    isActive ? "text-cyan-400" : "text-white/60"
                  }`}
                >
                  {label}
                </span>
                {isActive && (
                  <Motion.div
                    layoutId="dockIndicator"
                    className="absolute top-0 h-0.5 w-8 rounded-full bg-cyan-400"
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
