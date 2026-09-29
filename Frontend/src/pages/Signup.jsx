import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaCheckCircle } from "react-icons/fa";
import { Button, Field, LiveRegion } from "../components/ui";
import { sendOtp, signUp } from "../utils/authApi";
import { trackAnalyticsEvent } from "../utils/settings";
import { getSelectedSchoolClass, schoolClassOptions, setSelectedSchoolClass } from "../utils/schoolTrack";

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
  const location = useLocation();
  // Route decides which signup this is — see Login.jsx for the same fix.
  const schoolMode = location.pathname.startsWith("/school");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    otp: "",
    phone: "",
    password: "",
    schoolClass: getSelectedSchoolClass(),
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otpStatus, setOtpStatus] = useState("idle");
  const [signupStatus, setSignupStatus] = useState("idle");
  const [toast, setToast] = useState(null);
  const [apiError, setApiError] = useState("");
  const [errors, setErrors] = useState({});

  const validate = () => {
    const next = {};
    if (!form.firstName) next.firstName = "First name is required";
    if (!form.lastName) next.lastName = "Last name is required";
    if (!form.email) next.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) next.email = "Enter a valid email";
    if (otpSent && !form.otp) next.otp = "OTP is required";
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

    if (!validate()) return;

    setSignupStatus("loading");
    try {
      await signUp({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        contactNumber: form.phone,
        password: form.password,
        accountType: "Student",
        otp: form.otp,
        track: schoolMode ? "school" : "medical",
        schoolClass: schoolMode ? form.schoolClass : undefined,
      });
      if (schoolMode) setSelectedSchoolClass(form.schoolClass);
      trackAnalyticsEvent("signup_success", { email: form.email });

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
      <Helmet>
        <title>{schoolMode ? "School Sign Up | Kanthast" : "Sign Up | Kanthast"}</title>
        <meta name="description" content={schoolMode ? "Create a Kanthast School account and choose a class from I-X." : "Create your free Kanthast account and start mastering USMLE, NEET PG, and INI CET through immersive 3D animations."} />
        <link rel="canonical" href="https://kanthast.in/signup" />
      </Helmet>
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
        className="relative z-10 w-full max-w-2xl rounded-3xl border border-white/60 bg-surface/70 p-7 md:p-9 backdrop-blur-2xl shadow-e5"
      >
        <motion.div variants={itemVariants} className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">Start Learning</p>
          <h1 className="mt-2 text-3xl md:text-4xl font-black text-ink">Create Your Account</h1>
          <p className="mt-2 text-sm md:text-base text-ink-muted">
            {schoolMode ? "Create a student account and choose the class to start with." : "Secure signup with OTP verification."}
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div variants={itemVariants} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="First Name"
              id="signup-firstName"
              name="firstName"
              autoComplete="given-name"
              placeholder="First Name"
              value={form.firstName}
              onChange={handleChange}
              error={errors.firstName}
              required
            />
            <Field
              label="Last Name"
              id="signup-lastName"
              name="lastName"
              autoComplete="family-name"
              placeholder="Last Name"
              value={form.lastName}
              onChange={handleChange}
              error={errors.lastName}
              required
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="flex items-start gap-3">
              <Field
                label="Email"
                id="signup-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="Email address"
                value={form.email}
                onChange={handleChange}
                error={errors.email}
                containerClassName="flex-1"
                required
              />
              <Button
                type="button"
                variant={otpStatus === "sent" ? "secondary" : "primary"}
                onClick={sendOtpHandler}
                loading={otpStatus === "loading"}
                loadingText="Sending..."
                className="mt-[1.6rem] shrink-0 min-w-[7.5rem]"
              >
                {otpStatus === "sent" ? "Sent" : "Send OTP"}
              </Button>
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
                <Field
                  label="OTP"
                  id="signup-otp"
                  name="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="Enter OTP"
                  value={form.otp}
                  onChange={handleChange}
                  error={errors.otp}
                  required
                />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div variants={itemVariants}>
            <Field
              label="Phone Number"
              id="signup-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="Phone Number"
              value={form.phone}
              onChange={handleChange}
              error={errors.phone}
            />
          </motion.div>

          {schoolMode && (
            <motion.div variants={itemVariants}>
              <label htmlFor="signup-schoolClass" className="label">
                Student Class
              </label>
              <select
                id="signup-schoolClass"
                name="schoolClass"
                value={form.schoolClass}
                onChange={handleChange}
                className="field"
              >
                {schoolClassOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </motion.div>
          )}

          <motion.div variants={itemVariants}>
            <Field
              label="Password"
              id="signup-password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              required
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <Button
              type="submit"
              fullWidth
              loading={signupStatus === "loading"}
              loadingText="Creating..."
            >
              {signupStatus === "success" && <FaCheckCircle aria-hidden="true" />}
              {signupStatus === "success" ? "Success" : "Sign Up"}
            </Button>
          </motion.div>

          <motion.p variants={itemVariants} className="text-center text-sm text-ink-muted">
            Already have an account?{" "}
            <Link to={schoolMode ? "/school/login" : "/login"} className="font-semibold text-cyan-700 hover:text-cyan-800">
              Log In
            </Link>
          </motion.p>

          <AnimatePresence>
            {apiError && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                role="alert"
                className="text-sm text-center text-critical"
              >
                {apiError}
              </motion.p>
            )}
          </AnimatePresence>
        </form>
      </motion.div>

      <LiveRegion message={toast || ""} />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 28 }}
            aria-hidden="true"
            className="fixed bottom-6 right-6 rounded-xl border border-emerald-200 bg-emerald-600 px-5 py-3 text-white shadow-e3"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
