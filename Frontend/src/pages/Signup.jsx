import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaCheckCircle } from "react-icons/fa";
import { sendOtp, signUp } from "../utils/authApi";

const panelVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    otp: "",
    phone: "",
    password: "",
    role: "Student",
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otpStatus, setOtpStatus] = useState("idle");
  const [signupStatus, setSignupStatus] = useState("idle");
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState(null);
  const [apiError, setApiError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setApiError("");
  };

  const sendOtpHandler = async () => {
    if (!form.email) {
      setToast("Enter email first");
      setTimeout(() => setToast(null), 2200);
      return;
    }

    setOtpStatus("loading");
    setApiError("");
    try {
      await sendOtp(form.email);
      setOtpStatus("sent");
      setOtpSent(true);
      setToast("OTP sent successfully");
      setTimeout(() => setToast(null), 2200);
    } catch (error) {
      setOtpStatus("idle");
      setApiError(error.message || "Failed to send OTP");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    if (!otpSent) {
      setApiError("Please send OTP first");
      return;
    }

    setSignupStatus("loading");
    try {
      await signUp({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        contactNumber: form.phone,
        password: form.password,
        accountType: form.role,
        otp: form.otp,
      });

      setSignupStatus("success");
      setToast("Account created successfully");
      setTimeout(() => {
        setToast(null);
        navigate("/login");
      }, 1200);
    } catch (error) {
      setSignupStatus("idle");
      setApiError(error.message || "Signup failed");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_10%_10%,_#dbeafe,_#eff6ff_42%,_#ecfeff_100%)] px-4 py-12 flex items-center justify-center">
      <motion.div
        animate={{ y: [0, -10, 0], opacity: [0.5, 0.72, 0.5] }}
        transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -top-20 -left-16 h-72 w-72 rounded-full bg-cyan-300/25 blur-3xl"
      />
      <motion.div
        animate={{ y: [0, 12, 0], opacity: [0.42, 0.68, 0.42] }}
        transition={{ duration: 6.2, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -bottom-20 right-0 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl"
      />

      <motion.div
        variants={panelVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 w-full max-w-2xl rounded-3xl border border-white/60 bg-white/70 p-7 md:p-9 backdrop-blur-2xl shadow-[0_30px_90px_rgba(15,23,42,0.15)]"
      >
        <motion.div variants={itemVariants} className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">Start Learning</p>
          <h2 className="mt-2 text-3xl md:text-4xl font-black text-slate-900">Create Your Account</h2>
          <p className="mt-2 text-sm md:text-base text-slate-600">Secure signup with OTP verification.</p>
          <div className="mt-5 h-px w-full bg-gradient-to-r from-cyan-300/0 via-cyan-400/45 to-cyan-300/0" />
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div variants={itemVariants} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="signup-firstName" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
                First Name
              </label>
              <GlassInput id="signup-firstName" name="firstName" placeholder="First Name" value={form.firstName} onChange={handleChange} required />
            </div>
            <div>
              <label htmlFor="signup-lastName" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
                Last Name
              </label>
              <GlassInput id="signup-lastName" name="lastName" placeholder="Last Name" value={form.lastName} onChange={handleChange} required />
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <label htmlFor="signup-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
              Email
            </label>
            <div className="flex gap-3">
              <GlassInput
                id="signup-email"
                name="email"
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={handleChange}
                className="flex-1"
                required
              />
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                whileHover={{ y: -1 }}
                onClick={sendOtpHandler}
                disabled={otpStatus === "loading"}
                className={`shrink-0 min-w-[7.5rem] rounded-xl border px-4 py-3 font-bold text-white shadow-[0_10px_24px_rgba(8,145,178,0.24)] transition disabled:opacity-70 disabled:shadow-none ${
                  otpStatus === "sent"
                    ? "border-emerald-700 bg-emerald-600 hover:bg-emerald-700"
                    : "border-cyan-700 bg-cyan-600 hover:bg-cyan-700"
                }`}
              >
                {otpStatus === "loading" ? "Sending..." : otpStatus === "sent" ? "Sent" : "Send OTP"}
              </motion.button>
            </div>
          </motion.div>

          <AnimatePresence>
            {otpSent && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <label htmlFor="signup-otp" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
                  OTP
                </label>
                <GlassInput id="signup-otp" name="otp" placeholder="Enter OTP" value={form.otp} onChange={handleChange} required />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div variants={itemVariants}>
            <label htmlFor="signup-phone" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
              Phone Number
            </label>
            <GlassInput id="signup-phone" name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} />
          </motion.div>

          <motion.div variants={itemVariants} className="relative">
            <label htmlFor="signup-password" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
              Password
            </label>
            <GlassInput
              id="signup-password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-4 top-[2.45rem] text-slate-500 hover:text-slate-700 transition"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </motion.div>

          <motion.div variants={itemVariants}>
            <label htmlFor="signup-role" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
              Role
            </label>
            <select
              id="signup-role"
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 transition"
            >
              <option value="Student">Student</option>
              <option value="Instructor">Instructor</option>
            </select>
          </motion.div>

          <motion.button
            variants={itemVariants}
            whileTap={{ scale: 0.985 }}
            whileHover={{ y: -2 }}
            type="submit"
            disabled={signupStatus === "loading"}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3.5 font-bold text-white shadow-[0_14px_30px_rgba(8,145,178,0.28)] hover:from-cyan-600 hover:to-blue-700 disabled:opacity-60 disabled:shadow-none flex items-center justify-center gap-2 transition"
          >
            {signupStatus === "loading" && (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="h-4 w-4 rounded-full border-2 border-white border-t-transparent"
              />
            )}
            {signupStatus === "success" && <FaCheckCircle />}
            {signupStatus === "loading" ? "Creating..." : signupStatus === "success" ? "Success" : "Sign Up"}
          </motion.button>

          <motion.p variants={itemVariants} className="text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-cyan-700 hover:text-cyan-800">
              Sign In
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
    </div>
  );
}

function GlassInput({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 transition ${className}`}
    />
  );
}
