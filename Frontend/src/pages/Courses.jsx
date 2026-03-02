import { motion } from "framer-motion";
import Image1 from "../assets/images/Image-3.png";
import Image2 from "../assets/images/Image-4.png";
import Image3 from "../assets/images/Image-5.png";

const fadeUp = {
  hidden: { opacity: 0, y: 34 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.68, ease: [0.22, 1, 0.36, 1] },
  },
};

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
};

const sectionViewport = { once: true, amount: 0.22 };

export default function Courses() {
  return (
    <div className="overflow-x-hidden bg-[radial-gradient(circle_at_10%_10%,_#dbeafe,_#eff6ff_42%,_#ecfeff_100%)]">
      <section className="relative overflow-hidden py-24">
        <motion.div
          animate={{ y: [0, -10, 0], opacity: [0.5, 0.75, 0.5] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -top-20 -left-16 h-72 w-72 rounded-full bg-cyan-300/25 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 12, 0], opacity: [0.45, 0.7, 0.45] }}
          transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -bottom-20 right-0 h-80 w-80 rounded-full bg-blue-300/25 blur-3xl"
        />

        <div className="relative mx-auto max-w-6xl px-6 md:px-16">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="rounded-3xl border border-white/60 bg-white/70 px-6 py-10 text-center backdrop-blur-2xl shadow-[0_25px_70px_rgba(15,23,42,0.13)] md:px-12"
          >
            <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-black leading-tight text-slate-900">
              Programs Built for Every Medical Stage
            </motion.h1>
            <motion.p variants={fadeUp} className="mx-auto mt-5 max-w-3xl text-base md:text-lg text-slate-600">
              Animation-first learning tracks with exam-focused pathways across USMLE, MCAT, and NCLEX.
            </motion.p>
          </motion.div>
        </div>
      </section>

      <section className="py-14">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={sectionViewport}
          className="mx-auto grid max-w-7xl gap-8 px-6 md:grid-cols-3 md:px-16"
        >
          {[
            {
              title: "Medicine / USMLE",
              desc: "Advanced clinical reasoning and systems-based learning for future physicians.",
            },
            {
              title: "Premedicine / MCAT",
              desc: "Strong conceptual foundations in biology and chemistry with visual clarity.",
            },
            {
              title: "Nursing / NCLEX",
              desc: "Practical patient-care thinking and exam-ready visual training.",
            },
          ].map((item) => (
            <motion.div
              key={item.title}
              variants={fadeUp}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="rounded-2xl border border-white/60 bg-white/55 p-7 backdrop-blur-2xl shadow-[0_18px_55px_rgba(15,23,42,0.11)]"
            >
              <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
              <p className="mt-3 text-slate-600 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section id="medicine" className="py-10 md:py-14">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={sectionViewport}
          className="mx-auto max-w-7xl px-6 md:px-16"
        >
          <div className="grid items-center gap-10 rounded-3xl border border-white/60 bg-white/62 p-6 backdrop-blur-2xl shadow-[0_25px_70px_rgba(15,23,42,0.13)] md:grid-cols-2 md:p-8">
            <motion.div variants={fadeUp}>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900">Medicine / USMLE</h2>
              <p className="mt-4 text-slate-600 text-lg leading-relaxed">
                Master complex physiology, pathology, and clinical reasoning through immersive visual lessons designed
                for USMLE performance.
              </p>
              <motion.button
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="mt-7 rounded-xl bg-slate-900 px-7 py-3.5 font-semibold text-white transition hover:bg-slate-800"
              >
                Explore Medicine
              </motion.button>
            </motion.div>

            <motion.div
              variants={fadeUp}
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ duration: 0.35 }}
              className="overflow-hidden rounded-2xl border border-slate-200 shadow-xl"
            >
              <motion.img
                src={Image1}
                alt="Medicine course preview"
                className="h-[380px] w-full object-cover"
                whileHover={{ scale: 1.04 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </motion.div>
          </div>
        </motion.div>
      </section>

      <section id="premed" className="py-10 md:py-14">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={sectionViewport}
          className="mx-auto max-w-7xl px-6 md:px-16"
        >
          <div className="grid items-center gap-10 rounded-3xl border border-white/60 bg-white/62 p-6 backdrop-blur-2xl shadow-[0_25px_70px_rgba(15,23,42,0.13)] md:grid-cols-2 md:p-8">
            <motion.div
              variants={fadeUp}
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ duration: 0.35 }}
              className="overflow-hidden rounded-2xl border border-slate-200 shadow-xl"
            >
              <motion.img
                src={Image2}
                alt="Premedicine course preview"
                className="h-[380px] w-full object-cover"
                whileHover={{ scale: 1.04 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </motion.div>

            <motion.div variants={fadeUp}>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900">Premedicine / MCAT</h2>
              <p className="mt-4 text-slate-600 text-lg leading-relaxed">
                Concept-driven animated lessons simplifying biology, chemistry, and reasoning skills to build strong
                foundations for MCAT readiness.
              </p>
              <motion.button
                whileHover={{ y: -2 }}
                disabled
                className="mt-7 rounded-xl border border-slate-400 bg-slate-200 px-7 py-3.5 font-semibold text-slate-600 cursor-not-allowed"
              >
                Coming Soon
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </section>

      <section id="nursing" className="pb-20 pt-10 md:pt-14">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={sectionViewport}
          className="mx-auto max-w-7xl px-6 md:px-16"
        >
          <div className="grid items-center gap-10 rounded-3xl border border-white/60 bg-white/62 p-6 backdrop-blur-2xl shadow-[0_25px_70px_rgba(15,23,42,0.13)] md:grid-cols-2 md:p-8">
            <motion.div variants={fadeUp}>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900">Nursing / NCLEX</h2>
              <p className="mt-4 text-slate-600 text-lg leading-relaxed">
                Interactive visual modules designed to simplify patient care, pharmacology, and real-world nursing
                scenarios for NCLEX mastery.
              </p>
              <motion.button
                whileHover={{ y: -2 }}
                disabled
                className="mt-7 rounded-xl border border-slate-400 bg-slate-200 px-7 py-3.5 font-semibold text-slate-600 cursor-not-allowed"
              >
                Coming Soon
              </motion.button>
            </motion.div>

            <motion.div
              variants={fadeUp}
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ duration: 0.35 }}
              className="overflow-hidden rounded-2xl border border-slate-200 shadow-xl"
            >
              <motion.img
                src={Image3}
                alt="Nursing course preview"
                className="h-[380px] w-full object-cover"
                whileHover={{ scale: 1.04 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </motion.div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
