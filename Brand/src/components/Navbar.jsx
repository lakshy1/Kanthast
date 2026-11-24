import { useEffect, useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { FaChevronDown, FaHome, FaEnvelope, FaUserMd, FaSchool, FaInfoCircle } from "react-icons/fa";
import { CONTEXTS } from "../utils/siteContext";

// Kanthast itself owns only the pages both products share. Accounts, courses,
// the library and pricing live inside Professional and School, so this bar has
// no signed-in state and no product links beyond the two front doors.
const navItems = [
  { to: "/", label: "Home", icon: FaHome, exact: true },
  { to: "/professional", label: "Professional", icon: FaUserMd, exact: false },
  { to: "/school", label: "School", icon: FaSchool, exact: false },
  { to: "/about", label: "About", icon: FaInfoCircle, exact: false },
  { to: "/contact", label: "Contact", icon: FaEnvelope, exact: false },
];

// Log In and Sign Up both ask which product the visitor means.
const authChoices = [
  {
    id: "professional",
    name: CONTEXTS.professional.name,
    tagline: CONTEXTS.professional.tagline,
    login: "/professional/login",
    signup: "/professional/signup",
  },
  {
    id: "school",
    name: CONTEXTS.school.name,
    tagline: CONTEXTS.school.tagline,
    login: "/school/login",
    signup: "/school/signup",
  },
];

const NAVBAR_H = "calc(var(--nav-bar-h, 4rem) + env(safe-area-inset-top, 0px))";

const activeClass =
  "nav-link nav-link-active relative font-medium text-mint after:absolute after:inset-x-0 after:-bottom-[16px] after:h-0.5 after:rounded-full after:bg-mint";
const normalClass = "nav-link font-medium text-softwhite/75 hover:text-softwhite transition duration-200";

const Navbar = () => {
  const [navVisible, setNavVisible] = useState(true);
  // Which chooser is open: "login", "signup" or null. Only one at a time.
  const [openMenu, setOpenMenu] = useState(null);
  const location = useLocation();

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
        setOpenMenu(null);
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

  useEffect(() => {
    if (!openMenu) return;
    const close = (event) => {
      if (!event.target.closest?.("[data-auth-menu]")) setOpenMenu(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [openMenu]);

  const toggle = (name) => setOpenMenu((current) => (current === name ? null : name));

  return (
    <>
      <nav
        aria-label="Main"
        className="fixed left-0 right-0 top-0 z-50 w-full border-b border-hairline/70 kb-bar will-change-transform nav-aurora"
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          transform: navVisible ? "translateY(0)" : "translateY(-100%)",
          transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div className="nav-shell mx-auto flex w-full items-center justify-between px-5 md:px-16 lg:w-[calc(var(--u)*85)] lg:max-w-none lg:px-0">
          <Link to="/" aria-label="Kanthast home" className="nav-brand flex items-center gap-2.5 focus-visible:outline-none">
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

          <div className="nav-links hidden lg:flex items-center">
            {navItems.map(({ to, label, exact }) => (
              <NavLink
                key={to}
                to={to}
                end={exact}
                // Professional and School are separate apps, so they never show as "active" here.
                className={({ isActive }) => (isActive && (to === "/" || to === "/about" || to === "/contact") ? activeClass : normalClass)}
              >
                {label}
              </NavLink>
            ))}
          </div>

          <div className="nav-actions hidden lg:flex items-center">
            <AuthChooser
              kind="login"
              label="Log In"
              open={openMenu === "login"}
              onToggle={() => toggle("login")}
              onChoose={() => setOpenMenu(null)}
              className="nav-login inline-flex items-center justify-center gap-1.5 border bg-[#0d1829] text-softwhite transition duration-200 hover:bg-slatenavy"
            />
            <AuthChooser
              kind="signup"
              label="Sign Up"
              open={openMenu === "signup"}
              onToggle={() => toggle("signup")}
              onChoose={() => setOpenMenu(null)}
              className="nav-signup inline-flex items-center justify-center gap-1.5 bg-mint text-midnight transition duration-200 hover:brightness-95"
            />
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <AuthChooser
              kind="login"
              label="Log In"
              open={openMenu === "login"}
              onToggle={() => toggle("login")}
              onChoose={() => setOpenMenu(null)}
              className="inline-flex min-h-touch items-center gap-1.5 whitespace-nowrap nav-m-login rounded-xl border border-hairline px-3 text-sm max-[379px]:hidden text-softwhite transition hover:bg-slatenavy"
            />
            <AuthChooser
              kind="signup"
              label="Sign Up"
              open={openMenu === "signup"}
              onToggle={() => toggle("signup")}
              onChoose={() => setOpenMenu(null)}
              className="inline-flex min-h-touch items-center gap-1.5 whitespace-nowrap nav-m-signup rounded-xl bg-mint px-3 text-sm font-semibold text-midnight transition hover:brightness-95"
            />
          </div>
        </div>
      </nav>

      <nav
        aria-label="Quick links"
        className="nav-dock nav-aurora fixed bottom-0 left-0 right-0 z-40 lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Fades whatever is scrolled underneath before the opaque bar starts. */}
        <div
          aria-hidden="true"
          className="nav-dock-fade pointer-events-none absolute inset-x-0 bottom-full h-6 bg-gradient-to-t from-[#0b1220]/70 to-transparent"
        />
        <div className="nav-dock-bar border-t border-hairline/70 bg-[#0b1220]/95 backdrop-blur-xl">
          <div className="grid h-16 grid-cols-5">
            {navItems.map(({ to, label, icon: Icon, exact }) => {
              const isActive = exact
                ? location.pathname === to
                : (to === "/about" || to === "/contact") && location.pathname.startsWith(to);
              return (
                <Link
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
                    <Icon aria-hidden="true" className={`text-lg ${isActive ? "drop-shadow-glow-brand" : ""}`} />
                  </Motion.div>
                  <span className={`text-micro font-medium tracking-wide ${isActive ? "text-mint" : "text-softwhite/60"}`}>
                    {label}
                  </span>
                  {isActive && (
                    <Motion.div layoutId="dockIndicator" className="absolute top-0 h-0.5 w-8 rounded-full bg-mint" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
};

/** Log In or Sign Up on shared Kanthast pages: the visitor picks Professional or School first. */
function AuthChooser({ kind, label, open, onToggle, onChoose, className }) {
  return (
    <div className="relative" data-auth-menu onKeyDown={(e) => e.key === "Escape" && open && onToggle()}>
      <button type="button" onClick={onToggle} aria-haspopup="menu" aria-expanded={open} className={className}>
        {label}
        <FaChevronDown aria-hidden="true" className={`text-micro transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <Motion.div
            role="menu"
            aria-label={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-2 w-60 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-2xl shadow-black/15"
          >
            {authChoices.map((choice) => (
              <a
                key={choice.id}
                role="menuitem"
                href={choice[kind]}
                onClick={onChoose}
                className="block rounded-xl px-3 py-2.5 text-slate-700 transition hover:bg-slate-50"
              >
                <span className="block text-sm font-semibold text-slate-800">{choice.name}</span>
                <span className="block text-xs text-ink-subtle">{choice.tagline}</span>
              </a>
            ))}
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Navbar;
