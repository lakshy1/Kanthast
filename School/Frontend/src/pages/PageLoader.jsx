import { motion as Motion } from "framer-motion";

export default function PageLoader() {
  return (
    <Motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-surface text-ink"
      role="status"
      aria-label="Loading Kanthast"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2.5">
          <svg className="h-8 w-8" viewBox="0 0 40 40" aria-hidden="true">
            <defs>
              <linearGradient id="pl-k-a" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#2563eb" />
                <stop offset="1" stopColor="#1d4ed8" />
              </linearGradient>
              <linearGradient id="pl-k-b" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#60a5fa" />
                <stop offset="1" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <rect x="4" y="3" width="10" height="34" rx="3.5" fill="url(#pl-k-a)" />
            <path d="M17.5 21.5 L30 4.5 Q31.4 3 33.4 3 H37 Q38.6 3 37.6 4.4 L25 21.5 Z" fill="url(#pl-k-a)" />
            <path d="M17.5 21.5 H25 L37.6 35.6 Q38.6 37 37 37 H33.4 Q31.4 37 30 35.5 Z" fill="url(#pl-k-b)" />
          </svg>
          <span className="font-display text-2xl font-extrabold tracking-tight text-ink">
            Kanthast
          </span>
        </div>

        <div className="h-1 w-44 overflow-hidden rounded-full bg-surface-sunken">
          <Motion.div
            className="h-full w-1/2 rounded-full bg-brand motion-reduce:w-full motion-reduce:animate-none"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 1.25, ease: "easeInOut", repeat: Infinity }}
          />
        </div>
      </div>
    </Motion.div>
  );
}
