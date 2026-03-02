import { motion } from "framer-motion";

export default function PageLoader() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_20%_20%,_rgba(34,211,238,0.20),_transparent_35%),radial-gradient(circle_at_80%_15%,_rgba(96,165,250,0.20),_transparent_30%),linear-gradient(135deg,#081124,#0f1d42,#0d182f)]"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative h-60 w-60 rounded-full border border-white/20 bg-white/10 shadow-[0_30px_120px_rgba(2,12,27,0.55)] backdrop-blur-2xl"
      >
        <motion.div
          className="absolute inset-3 rounded-full border border-cyan-200/35"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, ease: "linear", repeat: Infinity }}
        >
          <span className="absolute -top-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.9)]" />
        </motion.div>

        <motion.div
          className="absolute inset-8 rounded-full border border-dashed border-blue-200/35"
          animate={{ rotate: -360 }}
          transition={{ duration: 10, ease: "linear", repeat: Infinity }}
        >
          <span className="absolute -right-1 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-blue-300 shadow-[0_0_16px_rgba(147,197,253,0.85)]" />
        </motion.div>

        <motion.div
          className="absolute inset-16 rounded-full border border-white/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 4.2, ease: "linear", repeat: Infinity }}
        />

        <div className="absolute inset-0 grid place-items-center">
          <motion.div
            animate={{ scale: [0.95, 1.08, 0.95], opacity: [0.75, 1, 0.75] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="grid h-24 w-24 place-items-center rounded-full border border-white/35 bg-gradient-to-br from-cyan-300/45 via-white/25 to-blue-300/40 text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-[inset_0_2px_10px_rgba(255,255,255,0.35)]"
          >
            Loading
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        className="pointer-events-none absolute h-96 w-96 rounded-full bg-cyan-300/10 blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.55, 0.3] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="pointer-events-none absolute right-[12%] top-[18%] h-36 w-36 rounded-full bg-blue-300/15 blur-3xl"
        animate={{ y: [0, -14, 0], x: [0, 8, 0] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="pointer-events-none absolute left-[14%] bottom-[16%] h-32 w-32 rounded-full bg-cyan-200/15 blur-3xl"
        animate={{ y: [0, 12, 0], x: [0, -10, 0] }}
        transition={{ duration: 4.6, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: [0.45, 0.85, 0.45], y: 0 }}
        transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[14%] text-xs font-medium uppercase tracking-[0.3em] text-cyan-100/90"
      >
        Kanthast
      </motion.p>
    </motion.div>
  );
}
