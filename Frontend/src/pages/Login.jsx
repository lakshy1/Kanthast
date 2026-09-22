import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button, Field, LiveRegion } from "../components/ui";
import { login } from "../utils/authApi";
import { trackAnalyticsEvent } from "../utils/settings";
import { getClientDeviceInfo, requestBrowserLocation } from "../utils/device";
import { updateCurrentSessionLocation } from "../utils/authApi";
import EdtechLoader from "./EdtechLoader";
import { isSchoolTrack, setSelectedSchoolClass } from "../utils/schoolTrack";

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
  const schoolMode = isSchoolTrack();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [toast, setToast] = useState(null);
  const [apiError, setApiError] = useState("");
  const [showEdtechLoader, setShowEdtechLoader] = useState(false);
  const timersRef = useRef([]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
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
      const deviceInfo = getClientDeviceInfo();
      const data = await login({ ...form, deviceSession: deviceInfo });
      localStorage.setItem("kanthastToken", data.token);
      localStorage.setItem("kanthastUser", JSON.stringify(data.user));
      if (schoolMode && data.user?.schoolClass) setSelectedSchoolClass(data.user.schoolClass);
      trackAnalyticsEvent("login_success", { userId: data.user?._id });

      requestBrowserLocation().then((location) => {
        if (!location) return;
        updateCurrentSessionLocation(data.token, {
          locationSource: location.source,
          locationLabel: location.label,
          geo: {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
          },
        }).catch(() => {});
      });

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
      <Helmet>
        <title>{schoolMode ? "School Login | Kanthast" : "Log In | Kanthast"}</title>
        <meta name="description" content={schoolMode ? "Log in to Kanthast School to continue class-wise visual learning." : "Log in to your Kanthast account to access your USMLE, NEET PG, and INI CET study materials."} />
        <link rel="canonical" href="https://kanthast.in/login" />
      </Helmet>
      <Motion.div
        animate={{ y: [0, -10, 0], opacity: [0.52, 0.75, 0.52] }}
        transition={{ duration: 5.6, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -top-20 -left-16 h-72 w-72 rounded-full bg-cyan-300/25 blur-3xl"
      />
      <Motion.div
        animate={{ y: [0, 12, 0], opacity: [0.4, 0.66, 0.4] }}
        transition={{ duration: 6.1, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -bottom-20 right-0 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl"
      />
      <Motion.div
        variants={panelVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 w-full max-w-md rounded-3xl border border-white/60 bg-surface/70 p-7 md:p-9 backdrop-blur-2xl shadow-e5"
      >
        <Motion.div variants={itemVariants}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">Welcome Back</p>
          <h1 className="mt-2 text-3xl md:text-4xl font-black text-ink">Sign In</h1>
          <p className="mt-2 text-sm md:text-base text-ink-muted">
            {schoolMode ? "Continue your class-wise visual learning journey." : "Continue your medical learning journey."}
          </p>
        </Motion.div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Motion.div variants={itemVariants}>
            <Field
              label="Email"
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Email address"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
            />
          </Motion.div>

          <Motion.div variants={itemVariants}>
            <Field
              label="Password"
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
            />
          </Motion.div>

          <Motion.div variants={itemVariants}>
            <Button
              type="submit"
              fullWidth
              loading={status === "loading"}
              loadingText="Logging In..."
            >
              Sign In
            </Button>
          </Motion.div>

          <Motion.p variants={itemVariants} className="text-center text-sm text-ink-muted">
            Don't have an account?{" "}
            <Link to="/signup" className="font-semibold text-cyan-700 hover:text-cyan-800">
              Sign Up
            </Link>
          </Motion.p>

          <AnimatePresence>
            {apiError && (
              <Motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                role="alert"
                className="text-sm text-center text-critical"
              >
                {apiError}
              </Motion.p>
            )}
          </AnimatePresence>
        </form>
      </Motion.div>

      <LiveRegion message={toast || ""} />

      <AnimatePresence>
        {toast && (
          <Motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 28 }}
            aria-hidden="true"
            className="fixed bottom-6 right-6 rounded-xl border border-emerald-200 bg-emerald-600 px-5 py-3 text-white shadow-e3"
          >
            {toast}
          </Motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{showEdtechLoader && <EdtechLoader />}</AnimatePresence>
    </div>
  );
}
