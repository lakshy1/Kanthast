import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { HashLink } from "react-router-hash-link";
import { motion as Motion } from "framer-motion";
import { FaTachometerAlt, FaList, FaHome, FaBookOpen, FaStar, FaComments } from "react-icons/fa";
import AccountMenu from "./AccountMenu";
import { logout as logoutApi } from "../utils/authApi";
import { SITE } from "../utils/siteContext";

const TOKEN_KEY = "kanthastSchoolToken";
const USER_KEY = "kanthastSchoolUser";

const dockItems = [
  { to: "/", label: "Home", icon: FaHome, exact: true },
  { to: "/dashboard", label: "Dashboard", icon: FaTachometerAlt, exact: false },
  { to: "/library", label: "Library", icon: FaList, exact: false },
  { to: "/doubts", label: "Doubts", icon: FaComments, exact: false },
];

const publicDockItems = [
  { to: "/", label: "Home", icon: FaHome, exact: true },
  { to: "/courses", label: "Courses", icon: FaBookOpen, exact: false },
  { to: "/library", label: "Library", icon: FaList, exact: false },
  // Guests have no subscription page (it is behind login); Plans is the pricing section of the landing page.
  { to: "/subscription", label: "Plans", icon: FaStar, exact: false },
];

// --nav-float-gap is the extra room the floating desktop bar needs (top offset + breathing space).
const NAVBAR_H = "calc(var(--nav-bar-h, 4rem) + var(--nav-float-gap, 0px) + env(safe-area-inset-top, 0px))";

const activeClass =
  "nav-link nav-link-active relative font-medium text-mint after:absolute after:inset-x-0 after:-bottom-[16px] after:h-0.5 after:rounded-full after:bg-mint";
const normalClass = "nav-link font-medium text-softwhite/75 hover:text-softwhite transition duration-200";

// Re-renders when the session changes in this tab or any other, so a logout
// elsewhere never leaves a signed-in bar behind.
const subscribeToSession = (callback) => {
  window.addEventListener("storage", callback);
  window.addEventListener("kanthast-session", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("kanthast-session", callback);
  };
};
const readSession = () => `${localStorage.getItem(TOKEN_KEY) || ""}\u0000${localStorage.getItem(USER_KEY) || ""}`;

function useSession() {
  const snapshot = useSyncExternalStore(subscribeToSession, readSession, () => "\u0000");
  return useMemo(() => {
    const [token, rawUser] = snapshot.split("\u0000");
    try {
      const user = rawUser ? JSON.parse(rawUser) : null;
      return { token, user, isLoggedIn: Boolean(token && user) };
    } catch {
      return { token, user: null, isLoggedIn: false };
    }
  }, [snapshot]);
}

const Navbar = () => {
  const [navVisible, setNavVisible] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const { token, user, isLoggedIn } = useSession();
  const hasSubscription = Boolean(user?.subscriptionPurchased);
  const dockHomeItems = dockItems.map((item) => (item.to === "/" ? { ...item, to: SITE.home } : item));
  const dockPublicItems = publicDockItems.map((item) => {
    if (item.to === "/") return { ...item, to: SITE.home };
    if (item.to === "/courses") return { ...item, to: SITE.courses };
    if (item.to === "/subscription") return { ...item, to: SITE.pricing };
    return item;
  });

  // Every Kanthast page except admin paints the sky gradient, so the bar is light glass there.
  const isAuroraRoute = !location.pathname.startsWith("/admin");

  useEffect(() => {
    const HIDE_THRESHOLD = 10;
    // Re-showing needs a more deliberate upward scroll than hiding does, so
    // trackpad momentum doesn't flicker the bar over full-bleed images.
    const SHOW_THRESHOLD = 80;
    let lastY = 0;
    // Hide-on-scroll is a phone affordance; on laptops and desktops the bar stays pinned.
    const desktopQuery = window.matchMedia("(min-width: 768px)");
    const onScroll = () => {
      const y = window.scrollY;
      if (desktopQuery.matches || y < 60) {
        setNavVisible(true);
      } else if (y > lastY + HIDE_THRESHOLD) {
        setNavVisible(false);
      } else if (y < lastY - SHOW_THRESHOLD) {
        setNavVisible(true);
      }
      lastY = y;
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

  const handleLogout = async () => {
    // End the session on the server first, so the token stops working everywhere,
    // then clear this browser. A failed request must not keep the user signed in.
    await logoutApi(token);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.dispatchEvent(new Event("kanthast-session"));
    navigate(SITE.login);
  };

  return (
    <>
      <nav
        aria-label="Main"
        className={`fixed left-0 right-0 top-0 z-50 w-full border-b border-hairline/70 kb-bar will-change-transform${isAuroraRoute ? " nav-aurora" : ""}`}
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          transform: navVisible ? "translateY(0)" : "translateY(-100%)",
          transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div className="nav-shell mx-auto flex w-full items-center justify-between px-5 md:px-16 lg:w-[calc(var(--u)*85)] lg:max-w-none lg:px-0">
          <div className="nav-brand relative flex min-w-0 items-end gap-1.5">
            <Link to="/" aria-label="Kanthast School home" className="flex items-center gap-2.5 focus-visible:outline-none">
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
            </Link>
            <span aria-hidden="true" className="nav-track-label translate-y-[0.3em] text-xs font-semibold leading-none tracking-[0.02em] text-amber-300">
              {SITE.short}
            </span>
          </div>

          <div className="nav-links hidden lg:flex items-center">
            <NavLink to={SITE.home} end className={({ isActive }) => (isActive ? activeClass : normalClass)}>
              Home
            </NavLink>
            {!isLoggedIn && (
              <NavLink to={SITE.courses} className={({ isActive }) => (isActive ? activeClass : normalClass)}>
                Courses
              </NavLink>
            )}
            <NavLink to="/library" className={({ isActive }) => (isActive ? activeClass : normalClass)}>
              Library
            </NavLink>
            {isLoggedIn && (
              <NavLink to="/dashboard" className={({ isActive }) => (isActive ? activeClass : normalClass)}>
                Dashboard
              </NavLink>
            )}
            {isLoggedIn && (
              <NavLink to="/doubts" className={({ isActive }) => (isActive ? activeClass : normalClass)}>
                Doubts
              </NavLink>
            )}
            {!isLoggedIn && (
              <HashLink smooth to={SITE.pricing} className={normalClass}>
                Pricing
              </HashLink>
            )}
            {isLoggedIn && !hasSubscription && (
              <NavLink to="/subscription" className={({ isActive }) => (isActive ? activeClass : normalClass)}>
                Subscription
              </NavLink>
            )}
          </div>

          <div className="nav-actions hidden lg:flex items-center">
            {!isLoggedIn ? (
              <>
                <Link
                  to={SITE.login}
                  className="nav-login inline-flex items-center justify-center border bg-[#0d1829] text-softwhite transition duration-200 hover:bg-slatenavy"
                >
                  Log In
                </Link>
                <Link
                  to={SITE.signup}
                  className="nav-signup inline-flex items-center justify-center bg-mint text-midnight transition duration-200 hover:brightness-95"
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <AccountMenu user={user} hasSubscription={hasSubscription} onLogout={handleLogout} />
            )}
          </div>

          <div className="lg:hidden">
            {isLoggedIn ? (
              <AccountMenu user={user} hasSubscription={hasSubscription} onLogout={handleLogout} wide={false} />
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to={SITE.login}
                  className="inline-flex min-h-touch items-center whitespace-nowrap nav-m-login rounded-xl border border-hairline px-3 text-sm max-[379px]:hidden text-softwhite transition hover:bg-slatenavy"
                >
                  Log In
                </Link>
                <Link
                  to={SITE.signup}
                  className="inline-flex min-h-touch items-center whitespace-nowrap nav-m-signup rounded-xl bg-mint px-3 text-sm font-semibold text-midnight transition hover:brightness-95"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <nav
        aria-label="Quick links"
        className={`nav-dock fixed bottom-0 left-0 right-0 z-40 lg:hidden${isAuroraRoute ? " nav-aurora" : ""}`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Fades whatever is scrolled underneath before the opaque bar starts. */}
        <div
          aria-hidden="true"
          className="nav-dock-fade pointer-events-none absolute inset-x-0 bottom-full h-6 bg-gradient-to-t from-[#0b1220]/70 to-transparent"
        />
        <div className="nav-dock-bar border-t border-hairline/70 bg-[#0b1220]/95 backdrop-blur-xl">
          <div className="grid h-16 grid-cols-4">
            {(isLoggedIn ? dockHomeItems : dockPublicItems).map(({ to, label, icon: DockIcon, exact }) => {
              const isActive = exact ? location.pathname === to : location.pathname.startsWith(to);
              return (
                <HashLink
                  smooth
                  key={to}
                  to={to}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative flex flex-col items-center justify-center gap-1 transition-colors ${
                    isActive ? "text-mint" : "text-softwhite/60 hover:text-softwhite"
                  }`}
                >
                  <Motion.div
                    animate={{ scale: isActive ? 1.15 : 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <DockIcon aria-hidden="true" className={`text-lg ${isActive ? "drop-shadow-glow-brand" : ""}`} />
                  </Motion.div>
                  <span className={`text-micro font-medium tracking-wide ${isActive ? "text-mint" : "text-softwhite/60"}`}>
                    {label}
                  </span>
                  {isActive && (
                    <Motion.div layoutId="dockIndicator" className="absolute top-0 h-0.5 w-8 rounded-full bg-mint" />
                  )}
                </HashLink>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
