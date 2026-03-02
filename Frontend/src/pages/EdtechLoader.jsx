import { motion } from "framer-motion";

export default function EdtechLoader() {
  const text = "KANTHAST";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed inset-0 z-[10000] grid place-items-center overflow-hidden bg-[radial-gradient(circle_at_18%_22%,_rgba(34,211,238,0.22),_transparent_34%),radial-gradient(circle_at_82%_14%,_rgba(59,130,246,0.22),_transparent_28%),linear-gradient(135deg,#081124,#101a35,#0e1a30)]"
    >
      <motion.div
        initial={{ y: 16, scale: 0.96, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative w-[min(90vw,760px)] rounded-3xl border border-white/20 bg-white/10 px-6 py-10 md:px-10 md:py-12 backdrop-blur-2xl shadow-[0_32px_120px_rgba(2,12,27,0.55)]"
      >
        <div className="pointer-events-none absolute inset-x-8 top-1/2 h-14 -translate-y-1/2 overflow-hidden opacity-90">
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 1000 120"
            preserveAspectRatio="none"
          >
            <motion.path
              d="M0 70 L120 70 L170 70 L205 15 L245 105 L295 35 L350 70 L520 70 L560 70 L595 22 L635 100 L685 40 L730 70 L1000 70"
              fill="none"
              stroke="rgba(103, 232, 249, 0.92)"
              strokeWidth="4.5"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0.5 }}
              animate={{ pathLength: 1, opacity: [0.45, 0.95, 0.45] }}
              transition={{ pathLength: { duration: 1.2 }, opacity: { duration: 1.8, repeat: Infinity } }}
            />
          </svg>

          <motion.div
            className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-cyan-200 shadow-[0_0_20px_rgba(103,232,249,0.95)]"
            animate={{ left: ["-2%", "102%"] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="relative flex justify-center">
          <h2 className="flex flex-wrap justify-center gap-1 md:gap-2 text-3xl md:text-6xl font-black tracking-[0.18em] text-white/95">
            {text.split("").map((letter, index) => (
              <motion.span
                key={`${letter}-${index}`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.06, duration: 0.3 }}
                className="bg-gradient-to-r from-cyan-200 via-cyan-100 to-blue-200 bg-clip-text text-transparent"
              >
                {letter}
              </motion.span>
            ))}
          </h2>
        </div>
      </motion.div>
    </motion.div>
  );
}
