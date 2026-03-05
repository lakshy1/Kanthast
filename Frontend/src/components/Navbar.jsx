import { useMemo, useState } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { HashLink } from "react-router-hash-link";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown, FaBars, FaTimes, FaRobot } from "react-icons/fa";
import Logo from "../assets/images/Logo2.png"

const Navbar = () => {
  const [isCoursesOpen, setIsCoursesOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const activeClass = "text-yellow-400 font-semibold";
  const normalClass = "text-gray-300 hover:text-white transition duration-300";

  const isCoursesActive = location.pathname === "/courses";

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

  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() || "U";
  const avatarColors = ["#0ea5e9", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6", "#22c55e"];
  const colorSeed = initials.charCodeAt(0) + (initials.charCodeAt(1) || 0);
  const avatarBg = avatarColors[colorSeed % avatarColors.length];

  const handleLogout = () => {
    localStorage.removeItem("kanthastToken");
    localStorage.removeItem("kanthastUser");
    setIsUserMenuOpen(false);
    setIsMobileOpen(false);
    navigate("/login");
  };

  return (
    <nav className="w-full sticky top-0 z-50 bg-gradient-to-r from-[#0B1120] via-blue-950 to-[#0f172a] backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 md:px-16 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center h-full">
          <img src={Logo} alt="" className="h-full object-contain"/>
        </Link>

        <div className="hidden md:flex items-center gap-10">
          <NavLink to="/" className={({ isActive }) => (isActive ? activeClass : normalClass)}>
            Home
          </NavLink>

          <div
            className="relative"
            onMouseEnter={() => setIsCoursesOpen(true)}
            onMouseLeave={() => setIsCoursesOpen(false)}
          >
            <div
              className="flex items-center gap-2 transition"
            >
              <NavLink
                to="/courses"
                onClick={() => setIsCoursesOpen(false)}
                className={isCoursesActive ? "text-yellow-400 font-semibold" : "text-gray-300 hover:text-white"}
              >
                Courses
              </NavLink>
              <motion.button
                type="button"
                onClick={() => setIsCoursesOpen((prev) => !prev)}
                animate={{ rotate: isCoursesOpen ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className={isCoursesActive ? "text-yellow-400" : "text-gray-300 hover:text-white"}
                aria-label="Toggle courses dropdown"
              >
                <FaChevronDown className="text-xs" />
              </motion.button>
            </div>

            <AnimatePresence>
              {isCoursesOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-0 mt-3 w-64 bg-white rounded-xl shadow-xl p-2"
                >
                  <HashLink
                    to="/courses#medicine"
                    className="block px-4 py-3 rounded-lg hover:bg-slate-100 text-slate-700 transition"
                  >
                    Medicine / USMLE
                  </HashLink>
                  <HashLink
                    to="/courses#premed"
                    className="block px-4 py-3 rounded-lg hover:bg-slate-100 text-slate-700 transition"
                  >
                    Premedicine / MCAT
                  </HashLink>
                  <HashLink
                    to="/courses#nursing"
                    className="block px-4 py-3 rounded-lg hover:bg-slate-100 text-slate-700 transition"
                  >
                    Nursing / NCLEX
                  </HashLink>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <NavLink to="/lists" className={({ isActive }) => (isActive ? activeClass : normalClass)}>
            Lists
          </NavLink>

          <NavLink to="/subscription" className={({ isActive }) => (isActive ? activeClass : normalClass)}>
            Subscription
          </NavLink>

          <NavLink to="/about" className={({ isActive }) => (isActive ? activeClass : normalClass)}>
            About
          </NavLink>

          <NavLink to="/contact" className={({ isActive }) => (isActive ? activeClass : normalClass)}>
            Contact
          </NavLink>
        </div>

        <div className="hidden md:flex items-center gap-4">
          {!isLoggedIn ? (
            <>
              <Link
                to="/login"
                className="px-5 py-2 rounded-lg bg-white/10 text-gray-200 backdrop-blur-md border border-white/10 hover:bg-white/20 transition duration-300"
              >
                Log In
              </Link>

              <Link
                to="/signup"
                className="px-5 py-2 rounded-lg bg-yellow-400 text-black font-semibold hover:bg-yellow-300 transition duration-300"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <>
              <div
                className="relative"
                onMouseEnter={() => setIsUserMenuOpen(true)}
                onMouseLeave={() => setIsUserMenuOpen(false)}
              >
                <button className="flex items-center gap-2 px-2 py-1 rounded-full bg-white/10 border border-white/20 text-white">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center border border-white/25 shadow-inner overflow-hidden"
                    style={{
                      backgroundColor: avatarBg,
                    }}
                  >
                    <span className="text-base font-extrabold tracking-wide text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] select-none">
                      {initials}
                    </span>
                  </div>
                  <FaChevronDown className={`text-xs transition ${isUserMenuOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl p-2"
                    >
                      <Link
                        to="/profile"
                        className="block px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100"
                      >
                        My Profile
                      </Link>
                      <Link
                        to="/dashboard"
                        className="block px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100"
                      >
                        My Dashboard
                      </Link>
                      <Link
                        to="/lists"
                        className="block px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100"
                      >
                        Lists
                      </Link>
                      <Link
                        to="/subscription"
                        className="block px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100"
                      >
                        Subscription
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 rounded-lg text-red-600 hover:bg-red-50"
                      >
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                type="button"
                onClick={() => navigate("/chatbot")}
                className="w-11 h-11 rounded-full bg-yellow-400 text-black hover:bg-yellow-300 transition flex items-center justify-center"
                aria-label="Open chatbot"
                title="Chatbot"
              >
                <FaRobot />
              </button>
            </>
          )}
        </div>

        <div className="md:hidden text-white">
          <button onClick={() => setIsMobileOpen(!isMobileOpen)}>
            {isMobileOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-[#0f172a] px-6 pb-6 flex flex-col gap-6"
          >
            <NavLink
              to="/"
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) => (isActive ? activeClass : normalClass)}
            >
              Home
            </NavLink>

            <NavLink
              to="/courses"
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) => (isActive ? activeClass : normalClass)}
            >
              Courses
            </NavLink>

            <HashLink to="/courses#medicine" onClick={() => setIsMobileOpen(false)} className={normalClass}>
              Medicine / USMLE
            </HashLink>
            <HashLink to="/courses#premed" onClick={() => setIsMobileOpen(false)} className={normalClass}>
              Premedicine / MCAT
            </HashLink>
            <HashLink to="/courses#nursing" onClick={() => setIsMobileOpen(false)} className={normalClass}>
              Nursing / NCLEX
            </HashLink>

            <NavLink
              to="/lists"
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) => (isActive ? activeClass : normalClass)}
            >
              Lists
            </NavLink>

            <NavLink
              to="/subscription"
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) => (isActive ? activeClass : normalClass)}
            >
              Subscription
            </NavLink>

            <NavLink
              to="/about"
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) => (isActive ? activeClass : normalClass)}
            >
              About
            </NavLink>

            <NavLink
              to="/contact"
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) => (isActive ? activeClass : normalClass)}
            >
              Contact
            </NavLink>

            {!isLoggedIn ? (
              <div className="flex flex-col gap-4 pt-4 border-t border-white/10">
                <Link
                  to="/login"
                  onClick={() => setIsMobileOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white/10 text-gray-200 backdrop-blur-md border border-white/10"
                >
                  Log In
                </Link>

                <Link
                  to="/signup"
                  onClick={() => setIsMobileOpen(false)}
                  className="px-4 py-2 rounded-lg bg-yellow-400 text-black font-semibold"
                >
                  Sign Up
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
                <Link
                  to="/profile"
                  onClick={() => setIsMobileOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white/10 text-gray-200"
                >
                  My Profile
                </Link>
                <Link
                  to="/dashboard"
                  onClick={() => setIsMobileOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white/10 text-gray-200"
                >
                  My Dashboard
                </Link>
                <Link
                  to="/lists"
                  onClick={() => setIsMobileOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white/10 text-gray-200"
                >
                  Lists
                </Link>
                <Link
                  to="/subscription"
                  onClick={() => setIsMobileOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white/10 text-gray-200"
                >
                  Subscription
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg bg-red-500/15 text-red-300 text-left"
                >
                  Logout
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileOpen(false);
                    navigate("/chatbot");
                  }}
                  className="px-4 py-2 rounded-lg bg-yellow-400 text-black font-semibold flex items-center gap-2 justify-center"
                >
                  <FaRobot />
                  Chatbot
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
