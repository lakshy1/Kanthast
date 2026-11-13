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
  FaEnvelope,
} from "react-icons/fa";
import { SITE } from "../utils/siteContext";

const dockItems = [
  { to: "/", label: "Home", icon: FaHome, exact: true },
  { to: "/dashboard", label: "Dashboard", icon: FaTachometerAlt, exact: false },
  { to: "/library", label: "Library", icon: FaList, exact: false },
  { to: "/chatbot", label: "Assistant", icon: FaRobot, exact: false },
];

const publicDockItems = [
  { to: "/", label: "Home", icon: FaHome, exact: true },
  { to: "/courses", label: "Courses", icon: FaBookOpen, exact: false },
  { to: "/library", label: "Library", icon: FaList, exact: false },
  { to: "/subscription", label: "Plans", icon: FaStar, exact: false },
  { to: "/contact", label: "Contact", icon: FaEnvelope, exact: false },
];

// --nav-float-gap is the extra room the floating desktop bar needs (top offset + breathing space).
const NAVBAR_H = "calc(var(--nav-bar-h, 4rem) + var(--nav-float-gap, 0px) + env(safe-area-inset-top, 0px))";
const Navbar = () => {
  const [isDesktopUserOpen, setIsDesktopUserOpen] = useState(false);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const mobileProfileRef = useRef(null);
  const lastScrollY = useRef(0);
  const location = useLocation();
  const navigate = useNavigate();

  const token = localStorage.getItem("kanthastSchoolToken");
  const rawUser = localStorage.getItem("kanthastSchoolUser");
  const user = useMemo(() => {
    try {
      return rawUser ? JSON.parse(rawUser) : null;
    } catch {
      return null;
    }
  }, [rawUser]);

  const isLoggedIn = Boolean(token && user);
  const hasSubscription = Boolean(user?.subscriptionPurchased);

  // Every Kanthast School page paints the sky gradient except admin, so the bar is light glass there.
  const isAuroraRoute = !location.pathname.startsWith("/admin");

  const homePath = SITE.home;
  const loginPath = SITE.login;
  const signupPath = SITE.signup;

  const initials =
    `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() || "U";
  const avatarColors = ["#0ea5e9", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6", "#22c55e"];
  const colorSeed = initials.charCodeAt(0) + (initials.charCodeAt(1) || 0);
  const avatarBg = avatarColors[colorSeed % avatarColors.length];

  const dockHomeItems = dockItems.map((item) =>
    item.to === "/" ? { ...item, to: homePath } : item
  );
  const dockPublicItems = publicDockItems.map((item) => {
    if (item.to === "/courses") return { ...item, to: SITE.courses };
    if (item.to === "/library") return { ...item, to: "/library" };
    if (item.to === "/subscription") return { ...item, to: SITE.pricing };
    return item;
  });

  useEffect(() => {
    const HIDE_THRESHOLD = 10;
    // Re-showing needs a more deliberate upward scroll than hiding does.
    // At the old symmetric ±10px threshold, ordinary scroll jitter (trackpad
    // momentum, mouse-wheel micro-reversals) flickered the nav back on top
    // of whatever full-bleed image happened to be mid-viewport at the time.
    const SHOW_THRESHOLD = 80;
    // Hide-on-scroll is a phone affordance (it frees vertical space for the
    // content). On laptops and desktops the nav stays pinned.
    const desktopQuery = window.matchMedia("(min-width: 768px)");
    const onScroll = () => {
      const y = window.scrollY;
      if (desktopQuery.matches) {
        setNavVisible(true);
        lastScrollY.current = y;
        return;
      }
      if (y < 60) {
        setNavVisible(true);
      } else if (y > lastScrollY.current + HIDE_THRESHOLD) {
        setNavVisible(false);
        setIsDesktopUserOpen(false);
        setIsMobileProfileOpen(false);
      } else if (y < lastScrollY.current - SHOW_THRESHOLD) {
        setNavVisible(true);
      }
      lastScrollY.current = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    desktopQuery.addEventListener("change", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      desktopQuery.removeEventListener("change", onScroll);
    };
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

  const handleLogout = () => {
    localStorage.removeItem("kanthastSchoolToken");
    localStorage.removeItem("kanthastSchoolUser");
    setIsMobileProfileOpen(false);
    setIsDesktopUserOpen(false);
    navigate("/login");
  };

  const activeClass = "nav-link nav-link-active relative font-medium text-mint after:absolute after:inset-x-0 after:-bottom-[16px] after:h-0.5 after:rounded-full after:bg-mint";
  const normalClass = "nav-link font-medium text-softwhite/75 hover:text-softwhite transition duration-200";

  return (
    <>
      <nav
        className={`fixed left-0 right-0 top-0 z-50 w-full border-b border-hairline/70 kb-bar will-change-transform${isAuroraRoute ? " nav-aurora" : ""}`}
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          transform: navVisible ? "translateY(0)" : "translateY(-100%)",
          transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div className="nav-shell mx-auto flex w-full items-center justify-between px-5 md:px-16 lg:w-[calc(var(--u)*85)] lg:max-w-none lg:px-0">
          <div className="flex min-w-0 items-center gap-3">
            <div className="nav-brand relative flex items-end gap-1.5">
              <a href="/" aria-label="Kanthast home" className="flex items-center gap-2.5 focus-visible:outline-none">
                <svg className="nav-k" viewBox="0 0 40 40" aria-hidden="true">
                  <defs>
                    <linearGradient id="nav-k-a" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#2563eb" />
                      <stop offset="1" stopColor="#1d4ed8" />
                    </linearGradient>
                    <linearGradient id="nav-k-b" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#60a5fa" />
                      <stop offset="1" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                  <rect x="4" y="3" width="10" height="34" rx="3.5" fill="url(#nav-k-a)" />
                  <path d="M17.5 21.5 L30 4.5 Q31.4 3 33.4 3 H37 Q38.6 3 37.6 4.4 L25 21.5 Z" fill="url(#nav-k-a)" />
                  <path d="M17.5 21.5 H25 L37.6 35.6 Q38.6 37 37 37 H33.4 Q31.4 37 30 35.5 Z" fill="url(#nav-k-b)" />
                </svg>
                <span className="nav-logo block font-display text-2xl font-extrabold leading-none tracking-tight text-softwhite md:text-[1.8rem]">
                  Kanthast
                </span>
              </a>
              <Link to="/" aria-label="Kanthast School home" className="nav-track-label translate-y-[0.3em] text-xs font-semibold leading-none tracking-[0.02em] text-amber-300 hover:underline">
                {SITE.short}
              </Link>
            </div>
          </div>

          <div className="nav-links hidden lg:flex items-center">
            <NavLink to={homePath} end className={({ isActive }) => (isActive ? activeClass : normalClass)}>
              Home
            </NavLink>

            {!isLoggedIn && (
              <NavLink to={SITE.courses} className={({ isActive }) => (isActive ? activeClass : normalClass)}>
                Courses
              </NavLink>
            )}

            <NavLink to={"/library"} className={({ isActive }) => (isActive ? activeClass : normalClass)}>
              Library
            </NavLink>
            {isLoggedIn && (
              <NavLink
                to="/dashboard"
                className={({ isActive }) => (isActive ? activeClass : normalClass)}
              >
                Dashboard
              </NavLink>
            )}
            {!isLoggedIn && (
              <HashLink smooth to={SITE.pricing} className={normalClass}>
                Pricing
              </HashLink>
            )}
            {isLoggedIn && !hasSubscription && (
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

          <div className="nav-actions hidden lg:flex items-center">
            {!isLoggedIn ? (
              <>
                <Link
                  to={loginPath}
                  className="nav-login inline-flex items-center justify-center border bg-[#0d1829] text-softwhite transition duration-200 hover:bg-slatenavy"
                >
                  Log In
                </Link>
                <Link
                  to={signupPath}
                  className="nav-signup inline-flex items-center justify-center bg-mint text-midnight transition duration-200 hover:brightness-95"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate("/chatbot")}
                  className="flex h-touch w-touch items-center justify-center rounded-full border border-mint/30 bg-mint/15 text-mint transition hover:bg-mint/25"
                  aria-label="Assistant"
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

          <div className="lg:hidden">
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
                  to={loginPath}
                  className="inline-flex min-h-touch items-center whitespace-nowrap nav-m-login rounded-xl border border-hairline px-3 text-sm max-[379px]:hidden text-softwhite transition hover:bg-slatenavy"
                >
                  Log In
                </Link>
                <Link
                  to={signupPath}
                  className="inline-flex min-h-touch items-center whitespace-nowrap nav-m-signup rounded-xl bg-mint px-3 text-sm font-semibold text-midnight transition hover:brightness-95"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div
        className={`nav-dock fixed bottom-0 left-0 right-0 z-40 lg:hidden${isAuroraRoute ? " nav-aurora" : ""}`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Fades whatever's scrolled underneath before the opaque bar starts,
            so the dock reads as a deliberate overlay instead of clipping the
            last row of content flush against its top edge. */}
        <div
          aria-hidden="true"
          className="nav-dock-fade pointer-events-none absolute inset-x-0 bottom-full h-6 bg-gradient-to-t from-[#0b1220]/70 to-transparent"
        />
        <div className="nav-dock-bar border-t border-hairline/70 bg-[#0b1220]/95 backdrop-blur-xl">
          <div className={`grid h-16 ${isLoggedIn ? "grid-cols-4" : "grid-cols-5"}`}>
          {(isLoggedIn ? dockHomeItems : dockPublicItems).map(({ to, label, icon: Icon, exact }) => {
            const isActive = exact ? location.pathname === to : location.pathname.startsWith(to);
            return (
              <HashLink
                smooth
                key={to}
                to={to}
                className={`relative flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive ? "text-mint" : "text-softwhite/60 hover:text-softwhite"
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
                    isActive ? "text-mint" : "text-softwhite/60"
                  }`}
                >
                  {label}
                </span>
                {isActive && (
                  <Motion.div
                    layoutId="dockIndicator"
                    className="absolute top-0 h-0.5 w-8 rounded-full bg-mint"
                  />
                )}
              </HashLink>
            );
          })}
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
