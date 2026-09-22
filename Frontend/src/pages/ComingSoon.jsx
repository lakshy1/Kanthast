import { motion } from "framer-motion";
import {
  FaLayerGroup,
  FaBrain,
  FaClapperboard,
  FaChartLine,
  FaBuilding,
  FaWandMagicSparkles,
} from "react-icons/fa6";

const highlights = [
  { title: "Interactive Learning", icon: FaLayerGroup },
  { title: "AI Driven Content", icon: FaBrain },
  { title: "Visual Storytelling", icon: FaClapperboard },
  { title: "Smart Analytics", icon: FaChartLine },
  { title: "Enterprise Training", icon: FaBuilding },
];

const ComingSoon = () => {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_52%,#edf5ff_100%)] px-4 py-16">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:84px_84px] opacity-[0.16]" />
      <div className="absolute right-[-8rem] top-[10%] h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,rgba(0,166,251,0.18),transparent_64%)] blur-3xl" />
      <div className="absolute bottom-[5%] left-[-10rem] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,rgba(90,75,239,0.14),transparent_64%)] blur-3xl" />

      <div className="relative mx-auto w-full max-w-[42rem] text-center">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="inline-flex items-center gap-2 rounded-full border border-[rgba(37,99,235,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(236,245,255,0.92))] px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[#1d4ed8] shadow-[0_14px_35px_rgba(37,99,235,0.08)]"
        >
          <FaWandMagicSparkles className="h-3.5 w-3.5" />
          Coming Soon
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.05 }}
          className="mx-auto mt-6 text-balance text-[1.9rem] font-semibold leading-[0.98] tracking-[-0.075em] text-[#0d1d4d] sm:text-[2.35rem] lg:text-[2.85rem]"
        >
          Kanthast is getting a{" "}
          <span className="text-[#2563eb]">new chapter.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="mx-auto mt-5 max-w-[32rem] text-[0.82rem] leading-6 text-[#4d6189] sm:text-[0.9rem] sm:leading-7"
        >
          We&apos;re rebuilding Kanthast into a sharper visual learning
          experience. Here&apos;s a glimpse of what&apos;s on the way.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mx-auto mt-10 flex max-w-[46rem] flex-wrap items-center justify-center gap-3"
        >
          {highlights.map(({ title, icon: Icon }) => (
            <span
              key={title}
              className="inline-flex items-center gap-2 rounded-full border border-[#e4eafb] bg-white px-4 py-2.5 text-[0.8rem] font-semibold text-[#0d1d4d] shadow-[0_10px_28px_rgba(20,35,90,0.06)]"
            >
              <Icon className="h-4 w-4 text-[#2563eb]" />
              {title}
            </span>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10"
        >
          <span className="inline-flex h-[2.75rem] items-center justify-center gap-2 rounded-[0.7rem] bg-[linear-gradient(135deg,#023e8a_0%,#00a6fb_100%)] px-6 text-[0.8rem] font-semibold text-white shadow-[0_18px_40px_rgba(2,62,138,0.26)]">
            <FaWandMagicSparkles className="h-4 w-4" />
            Stay Tuned
          </span>
        </motion.div>
      </div>
    </section>
  );
};

export default ComingSoon;
