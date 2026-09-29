import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { FaCompass, FaHouse } from "react-icons/fa6";

const NotFound = () => {
  return (
    <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_52%,#edf5ff_100%)] px-4 py-16">
      <Helmet>
        <title>Page Not Found | Kanthast</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:84px_84px] opacity-[0.16]" />
      <div className="absolute right-[-8rem] top-[10%] h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,rgba(0,166,251,0.18),transparent_64%)] blur-3xl" />
      <div className="absolute bottom-[5%] left-[-10rem] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,rgba(90,75,239,0.14),transparent_64%)] blur-3xl" />

      <div className="relative mx-auto w-full max-w-[36rem] text-center">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="inline-flex items-center gap-2 rounded-full border border-[rgba(37,99,235,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(236,245,255,0.92))] px-4 py-2 text-micro font-semibold uppercase tracking-[0.2em] text-[#1d4ed8] shadow-glow-brand"
        >
          <FaCompass className="h-3.5 w-3.5" />
          404
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.05 }}
          className="mx-auto mt-6 text-balance text-[1.9rem] font-semibold leading-[0.98] tracking-[-0.075em] text-[#0d1d4d] sm:text-[2.35rem] lg:text-[2.85rem]"
        >
          This page went{" "}
          <span className="text-[#2563eb]">off the map.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="mx-auto mt-5 max-w-[28rem] text-mini leading-6 text-[#4d6189] sm:text-sm sm:leading-7"
        >
          The link may be broken, or the page may have moved. Let's get you
          back to somewhere useful.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            to="/"
            className="inline-flex h-[2.75rem] items-center justify-center gap-2 rounded-[0.7rem] bg-[linear-gradient(135deg,#023e8a_0%,#00a6fb_100%)] px-6 text-mini font-semibold text-white shadow-glow-brand transition hover:brightness-110"
          >
            <FaHouse className="h-4 w-4" />
            Back to Home
          </Link>
          <Link
            to="/contact"
            className="inline-flex h-[2.75rem] items-center justify-center gap-2 rounded-[0.7rem] border border-[#e4eafb] bg-white px-6 text-mini font-semibold text-[#0d1d4d] shadow-e3 transition hover:bg-[#f5f9ff]"
          >
            Contact Support
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default NotFound;
