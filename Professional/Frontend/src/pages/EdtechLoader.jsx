import { motion as Motion } from "framer-motion";

// Full-screen brand loader used inside the app (e.g. while signing in).
// Same look as the boot loader in index.html: the K assembles, then breathes.
export default function EdtechLoader({ label = "Loading Kanthast Professional" }) {
  return (
    <Motion.div
      className="app-loader"
      role="status"
      aria-live="polite"
      aria-label={label}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="app-loader-card">
        <svg className="app-loader-k" viewBox="0 0 40 40" aria-hidden="true">
          <rect className="al-stem" x="4" y="3" width="10" height="34" rx="3.5" fill="#1d4ed8" />
          <path className="al-up" d="M17.5 21.5 L30 4.5 Q31.4 3 33.4 3 H37 Q38.6 3 37.6 4.4 L25 21.5 Z" fill="#1d4ed8" />
          <path className="al-down" d="M17.5 21.5 H25 L37.6 35.6 Q38.6 37 37 37 H33.4 Q31.4 37 30 35.5 Z" fill="#3b82f6" />
        </svg>
        <div className="app-loader-word">
          Kanthast<span style={{ color: "#1d4ed8" }}>Professional</span>
        </div>
        <div className="app-loader-track" aria-hidden="true"><span /></div>
      </div>
    </Motion.div>
  );
}
