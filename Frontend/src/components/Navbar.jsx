import { useState } from "react";
import { NavLink, Link} from "react-router-dom";
import { HashLink } from "react-router-hash-link";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown, FaBars, FaTimes } from "react-icons/fa";
import { useLocation } from "react-router-dom";

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const activeClass = "text-yellow-400 font-semibold";
  const normalClass =
    "text-gray-300 hover:text-white transition duration-300";

    const location = useLocation();

    const isCoursesActive = location.pathname === "/courses";

  return (
    <nav className="w-full sticky top-0 z-50 bg-linear-to-r from-[#0B1120] via-blue-950 to-[#0f172a] backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 md:px-16 flex items-center justify-between h-16">

        {/* Brand */}
        <Link to="/" className="text-2xl font-bold text-white tracking-wide">
          Kanthast
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-10">

          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? activeClass : normalClass
            }
          >
            Home
          </NavLink>

          {/* Desktop Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setIsDropdownOpen(true)}
            onMouseLeave={() => setIsDropdownOpen(false)}
          >
            <div className={`flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white 
            transition ${isCoursesActive? "text-yellow-400 font-semibold": "text-gray-300 hover:text-white"}`}>
              Courses
              <motion.div
                animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <FaChevronDown className="text-xs" />
              </motion.div>
            </div>

            <AnimatePresence>
              {isDropdownOpen && (
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

          <NavLink
            to="/about"
            className={({ isActive }) =>
              isActive ? activeClass : normalClass
            }
          >
            About
          </NavLink>

          <NavLink
            to="/contact"
            className={({ isActive }) =>
              isActive ? activeClass : normalClass
            }
          >
            Contact
          </NavLink>
        </div>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center gap-4">
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
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden text-white">
          <button onClick={() => setIsMobileOpen(!isMobileOpen)}>
            {isMobileOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
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
              className={({ isActive }) =>
                isActive ? activeClass : normalClass
              }
            >
              Home
            </NavLink>

            <NavLink
              to="/medicine"
              onClick={() => setIsMobileOpen(false)}
              className={normalClass}
            >
              Medicine / USMLE
            </NavLink>

            <NavLink
              to="/premed"
              onClick={() => setIsMobileOpen(false)}
              className={normalClass}
            >
              Premedicine / MCAT
            </NavLink>

            <NavLink
              to="/nursing"
              onClick={() => setIsMobileOpen(false)}
              className={normalClass}
            >
              Nursing / NCLEX
            </NavLink>

            <NavLink
              to="/about"
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) =>
                isActive ? activeClass : normalClass
              }
            >
              About
            </NavLink>

            <NavLink
              to="/contact"
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) =>
                isActive ? activeClass : normalClass
              }
            >
              Contact
            </NavLink>

            <div className="flex flex-col gap-4 pt-4 border-t border-white/10">
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg bg-white/10 text-gray-200 backdrop-blur-md border border-white/10"
              >
                Log In
              </Link>

              <Link
                to="/signup"
                className="px-4 py-2 rounded-lg bg-yellow-400 text-black font-semibold"
              >
                Sign Up
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;