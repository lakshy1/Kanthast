import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | loading | success
  const [showPassword, setShowPassword] = useState(false);

  const validate = () => {
    let newErrors = {};

    if (!form.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Enter a valid email";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Minimum 6 characters required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) return;

    setStatus("loading");

    // Simulate API delay
    setTimeout(() => {
      setStatus("success");

      setTimeout(() => {
        setStatus("idle");
      }, 3000);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-white to-cyan-50 relative overflow-hidden">

      {/* Soft Glow */}
      <div className="absolute w-150 h-150 bg-cyan-300/30 blur-3xl rounded-full pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-md bg-white border border-slate-200 rounded-3xl p-10 shadow-[0_40px_80px_rgba(0,0,0,0.08)]"
      >
        <h2 className="text-3xl font-bold text-slate-900 mb-2 text-center">
          Welcome Back
        </h2>

        <p className="text-slate-500 text-center mb-8">
          Sign in to continue your learning journey.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Email */}
          <div>
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={form.email}
              onChange={handleChange}
              className={`w-full px-5 py-3 rounded-xl bg-slate-50 border ${
                errors.email
                  ? "border-red-500"
                  : "border-slate-300 focus:border-cyan-500"
              } text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition`}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className={`w-full px-5 py-3 rounded-xl bg-slate-50 border ${
                errors.password
                  ? "border-red-500"
                  : "border-slate-300 focus:border-cyan-500"
              } text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition`}
            />

            <div
              className="absolute right-4 top-4 cursor-pointer text-slate-500"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </div>

            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {/* Login Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={status === "loading"}
            className={`w-full py-4 rounded-xl font-semibold transition ${
              status === "loading"
                ? "bg-yellow-300 cursor-not-allowed"
                : "bg-yellow-400 hover:bg-yellow-300"
            } text-black shadow-lg`}
          >
            {status === "loading" ? "Signing In..." : "Sign In"}
          </motion.button>

          <div className="text-center text-slate-500 text-sm mt-4">
            Don’t have an account?{" "}
            <Link
              to="/signup"
              className="text-cyan-600 hover:text-cyan-500 font-medium transition"
            >
              Sign Up
            </Link>
          </div>
        </form>
      </motion.div>

      {/* Success Toast */}
      <AnimatePresence>
        {status === "success" && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl z-50"
          >
            ✅ Login successful!
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}