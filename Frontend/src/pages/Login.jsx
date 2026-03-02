import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { login } from "../utils/authApi";
import EdtechLoader from "./EdtechLoader";

const panelVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } },
};

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState(null);
  const [apiError, setApiError] = useState("");
  const [showEdtechLoader, setShowEdtechLoader] = useState(false);
  const timersRef = useRef([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const validate = () => {
    const next = {};
    if (!form.email) next.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) next.email = "Enter a valid email";
    if (!form.password) next.password = "Password is required";
    else if (form.password.length < 6) next.password = "Minimum 6 characters required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    setApiError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus("loading");
    setApiError("");

    try {
      const data = await login(form);
      localStorage.setItem("kanthastToken", data.token);
      localStorage.setItem("kanthastUser", JSON.stringify(data.user));

      setStatus("success");
      setToast("Login successful");

      const toastTimer = setTimeout(() => {
        setToast(null);
        setShowEdtechLoader(true);
      }, 450);

      const navTimer = setTimeout(() => {
        sessionStorage.setItem("kanthastSkipNextLoader", "true");
        setStatus("idle");
        navigate("/dashboard");
      }, 1700);

      timersRef.current.push(toastTimer, navTimer);
    } catch (error) {
      setStatus("idle");
      setShowEdtechLoader(false);
      setApiError(error.message || "Login failed");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_10%_10%,_#dbeafe,_#eff6ff_42%,_#ecfeff_100%)] px-4 py-12 flex items-center justify-center">
      <motion.div
        animate={{ y: [0, -10, 0], opacity: [0.52, 0.75, 0.52] }}
        transition={{ duration: 5.6, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -top-20 -left-16 h-72 w-72 rounded-full bg-cyan-300/25 blur-3xl"
      />
      <motion.div
        animate={{ y: [0, 12, 0], opacity: [0.4, 0.66, 0.4] }}
        transition={{ duration: 6.1, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -bottom-20 right-0 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl"
      />
      <motion.div
        variants={panelVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 w-full max-w-md rounded-3xl border border-white/60 bg-white/70 p-7 md:p-9 backdrop-blur-2xl shadow-[0_30px_90px_rgba(15,23,42,0.15)]"
      >
        <motion.div variants={itemVariants}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">Welcome Back</p>
          <h2 className="mt-2 text-3xl md:text-4xl font-black text-slate-900">Sign In</h2>
          <p className="mt-2 text-sm md:text-base text-slate-600">Continue your medical learning journey.</p>
          <div className="mt-5 h-px w-full bg-gradient-to-r from-cyan-300/0 via-cyan-400/45 to-cyan-300/0" />
        </motion.div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <motion.div variants={itemVariants}>
            <label htmlFor="login-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
              Email
            </label>
            <GlassInput
              id="login-email"
              name="email"
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={handleChange}
            />
            {errors.email && <p className="mt-1 text-sm text-rose-500">{errors.email}</p>}
          </motion.div>

          <motion.div variants={itemVariants} className="relative">
            <label htmlFor="login-password" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
              Password
            </label>
            <GlassInput
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-4 top-[2.45rem] text-slate-500 hover:text-slate-700 transition"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
            {errors.password && <p className="mt-1 text-sm text-rose-500">{errors.password}</p>}
          </motion.div>

          <motion.button
            variants={itemVariants}
            whileTap={{ scale: 0.985 }}
            whileHover={{ y: -2 }}
            type="submit"
            disabled={status === "loading"}
            className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_14px_30px_rgba(8,145,178,0.28)] hover:from-cyan-600 hover:to-blue-700 disabled:opacity-60 disabled:shadow-none flex items-center justify-center gap-2 transition"
          >
            {status === "loading" && (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                className="h-4 w-4 rounded-full border-2 border-white border-t-transparent"
              />
            )}
            {status === "loading" ? "Logging In..." : "Sign In"}
          </motion.button>

          <motion.p variants={itemVariants} className="text-center text-sm text-slate-600">
            Don't have an account?{" "}
            <Link to="/signup" className="font-semibold text-cyan-700 hover:text-cyan-800">
              Sign Up
            </Link>
          </motion.p>

          <AnimatePresence>
            {apiError && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="text-sm text-center text-rose-500"
              >
                {apiError}
              </motion.p>
            )}
          </AnimatePresence>
        </form>
      </motion.div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 28 }}
            className="fixed bottom-6 right-6 rounded-xl border border-emerald-200 bg-emerald-500 px-5 py-3 text-white shadow-[0_14px_30px_rgba(16,185,129,0.32)]"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{showEdtechLoader && <EdtechLoader />}</AnimatePresence>
    </div>
  );
}

function GlassInput(props) {
  return (
    <input
      {...props}
      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 transition"
    />
  );
}
