import { motion } from "framer-motion";
import Image from "../assets/images/Image-2.png";
import { Link } from "react-router-dom";

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

export default function About() {
  return (
    <div className="overflow-x-hidden bg-[radial-gradient(circle_at_10%_10%,_#dbeafe,_#eff6ff_42%,_#ecfeff_100%)]">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#081124] via-[#0f1d42] to-[#0d182f] py-24 text-white">
        <motion.div
          animate={{ y: [0, -10, 0], opacity: [0.5, 0.75, 0.5] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -top-20 -left-16 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 12, 0], opacity: [0.45, 0.7, 0.45] }}
          transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -bottom-20 right-0 h-80 w-80 rounded-full bg-blue-300/20 blur-3xl"
        />

        <div className="relative mx-auto max-w-6xl px-6 md:px-16">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="rounded-3xl border border-white/20 bg-white/10 px-6 py-10 text-center backdrop-blur-2xl shadow-[0_30px_110px_rgba(2,8,23,0.45)] md:px-12"
          >
            <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-black leading-tight">
              Rethinking How Medicine Is Learned
            </motion.h1>
            <motion.p variants={fadeUp} className="mx-auto mt-5 max-w-3xl text-base md:text-lg text-cyan-100/90">
              Kanthast transforms complex medical topics into visual reasoning pathways that improve retention,
              confidence, and exam outcomes.
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
          className="mx-auto max-w-7xl px-6 md:px-16"
        >
          <div className="grid items-center gap-10 rounded-3xl border border-white/60 bg-white/62 p-6 backdrop-blur-2xl shadow-[0_25px_70px_rgba(15,23,42,0.13)] md:grid-cols-2 md:p-8">
            <motion.div variants={fadeUp}>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900">Why We Started Kanthast</h2>
              <p className="mt-4 text-slate-600 text-lg leading-relaxed">
                Traditional medical learning is overloaded with disconnected facts. We built Kanthast to make learning
                systems-driven and intuitive, not memorization-heavy.
              </p>
              <p className="mt-4 text-slate-600 text-lg leading-relaxed">
                Our animation-first framework helps learners think like clinicians while staying practical and accessible
                for every serious student.
              </p>
            </motion.div>

            <motion.div
              variants={fadeUp}
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ duration: 0.35 }}
              className="overflow-hidden rounded-2xl border border-slate-200 shadow-xl"
            >
              <motion.img
                src={Image}
                alt="About Kanthast"
                className="h-[380px] w-full object-cover"
                whileHover={{ scale: 1.04 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </motion.div>
          </div>
        </motion.div>
      </section>

      <section className="py-10 md:py-14">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={sectionViewport}
          className="mx-auto max-w-7xl px-6 md:px-16"
        >
          <div className="rounded-3xl border border-white/20 bg-gradient-to-br from-[#081124]/95 via-[#0f1d42]/95 to-[#0d182f]/95 p-8 text-white backdrop-blur-2xl shadow-[0_25px_85px_rgba(3,8,23,0.45)] md:p-10">
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-black text-center">
              Our Learning Philosophy
            </motion.h2>
            <motion.p variants={fadeUp} className="mx-auto mt-5 max-w-3xl text-center text-lg text-cyan-100/90">
              Build mental models first. Facts stick better when learners understand mechanisms, patterns, and clinical
              context.
            </motion.p>

            <motion.div variants={stagger} className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "Visual First",
                  desc: "Every lesson is animation-driven to create strong memory anchors.",
                },
                {
                  title: "Exam Focused",
                  desc: "USMLE, MCAT, and NCLEX priorities are mapped into every module.",
                },
                {
                  title: "Clinical Thinking",
                  desc: "Learners practice real decision pathways, not passive recall.",
                },
              ].map((item) => (
                <motion.div
                  key={item.title}
                  variants={fadeUp}
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl"
                >
                  <h3 className="text-xl font-bold">{item.title}</h3>
                  <p className="mt-3 text-cyan-100/90">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </section>

      <section className="py-10 md:py-14">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={sectionViewport}
          className="mx-auto max-w-7xl px-6 md:px-16"
        >
          <div className="grid gap-6 rounded-3xl border border-white/60 bg-white/62 p-8 text-center backdrop-blur-2xl shadow-[0_25px_70px_rgba(15,23,42,0.13)] md:grid-cols-3">
            {[
              { number: "50K+", label: "Active Students" },
              { number: "95%", label: "Exam Success Rate" },
              { number: "1000+", label: "Animated Concepts" },
            ].map((stat) => (
              <motion.div key={stat.label} variants={fadeUp} whileHover={{ y: -6, scale: 1.02 }}>
                <h3 className="text-4xl font-black text-slate-900">{stat.number}</h3>
                <p className="mt-2 text-slate-600">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="pb-20 pt-10">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={sectionViewport}
          className="mx-auto max-w-5xl px-6 md:px-16"
        >
          <div className="rounded-3xl border border-white/60 bg-white/62 p-10 text-center backdrop-blur-2xl shadow-[0_25px_70px_rgba(15,23,42,0.13)]">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900">Ready to Think Like a Specialist?</h2>

            <motion.div whileHover={{ y: -3, scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-flex">
              <Link
                to="/signup"
                className="mt-7 inline-flex rounded-xl bg-slate-900 px-8 py-3.5 font-semibold text-white transition hover:bg-slate-800"
              >
                Start Learning
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
