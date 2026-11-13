import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { FaCompass, FaHouse } from "react-icons/fa6";
import { Accent } from "../components/ui/Brandmarks";

const NotFound = () => {
  return (
    <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#fbfdff_0%,#f5f9ff_52%,#edf5ff_100%)] px-4 py-16">
      <Helmet>
        <title>Page Not Found | Kanthast School</title>
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
          className="bh-eyebrow"
        >
          <FaCompass className="h-3.5 w-3.5" />
          404
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.05 }}
          className="kx-title mx-auto mt-6 text-balance text-[2.2rem] sm:text-[2.8rem] lg:text-[3.4rem]"
        >
          This page went{" "}
          <Accent>off the map</Accent>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="kx-page-lead mx-auto mt-5 max-w-[28rem]"
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
            className="bh-btn bh-btn-primary"
          >
            <FaHouse className="h-4 w-4" />
            Back to Home
          </Link>
          <Link
            to="/contact"
            className="bh-btn bh-btn-ghost"
          >
            Contact Support
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default NotFound;
