import { motion } from "framer-motion";
import Image from "../assets/images/Image-2.png";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7 },
  },
};

export default function About() {
  return (
    <div className="overflow-x-hidden">
      {/* ================= HERO ================= */}
      <section className="bg-linear-to-br from-[#0B1120] via-blue-950 to-[#0f172a] text-white py-16">
        <div className="max-w-6xl mx-auto px-6 md:px-16 text-center">
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="text-4xl md:text-6xl font-bold leading-tight"
          >
            Rethinking how medicine is learned
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.2 }}
            className="mt-8 text-lg md:text-xl text-gray-300 max-w-3xl mx-auto"
          >
            Kanthast was built to transform complex medical knowledge into
            intuitive visual reasoning. We don’t teach memorization — we train
            thinking.
          </motion.p>
        </div>
      </section>

      {/* ================= OUR STORY ================= */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-16 grid md:grid-cols-2 gap-20 items-center">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
              Why we started Kanthast
            </h2>

            <p className="text-slate-600 leading-relaxed mb-6">
              Medical education today is overloaded with information. Students
              are expected to memorize pathways, mechanisms, and rare conditions
              — often without truly understanding the systems behind them. We
              believed there was a better way.
            </p>

            <p className="text-slate-600 leading-relaxed">
              A visual-first, animation-driven approach that helps learners
              think like specialists instead of cramming facts — delivered in a
              format that is accessible, practical, and affordable for every
              serious student. Because world-class medical education shouldn’t
              be a luxury.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <img
              src={Image}
              alt="About Kanthast"
              className="rounded-3xl bg-slate-100 h-87.5 w-full object-cover shadow-xl"
            />
          </motion.div>
        </div>
      </section>

      {/* ================= PHILOSOPHY ================= */}
      <section className="py-16 bg-linear-to-b from-slate-50 to-cyan-50">
        <div className="max-w-6xl mx-auto px-6 md:px-16 text-center">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-slate-900"
          >
            Our Learning Philosophy
          </motion.h2>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
            className="mt-8 text-lg text-slate-600 max-w-3xl mx-auto"
          >
            The brain retains visuals far more effectively than isolated facts.
            We build animated mental models that mirror how real physicians
            think.
          </motion.p>
        </div>

        {/* ================= DIFFERENTIATORS ================= */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-6 md:px-16 grid md:grid-cols-3 gap-12">
            {[
              {
                title: "Visual First",
                desc: "Every lesson is animation-driven to create strong mental anchors.",
              },
              {
                title: "Exam Focused",
                desc: "We highlight what matters for USMLE, MCAT, and NCLEX.",
              },
              {
                title: "Clinical Thinking",
                desc: "We simulate how specialists approach real-world cases.",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-50 rounded-2xl p-10 shadow-md hover:shadow-xl transition"
              >
                <h3 className="text-xl font-semibold text-slate-900 mb-4">
                  {item.title}
                </h3>
                <p className="text-slate-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </section>

      {/* ================= TRUST SECTION ================= */}
      <section className="py-16 bg-slate-50 text-center">
        <div className="max-w-6xl mx-auto px-6 md:px-16 grid md:grid-cols-3 gap-12">
          {[
            { number: "50K+", label: "Active Students" },
            { number: "95%", label: "Exam Success Rate" },
            { number: "1000+", label: "Animated Concepts" },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              viewport={{ once: true }}
            >
              <h3 className="text-4xl font-bold text-yellow-400">
                {stat.number}
              </h3>
              <p className="text-gray-800 mt-2">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="py-16 bg-slate-50 text-center">
        <div className="max-w-4xl mx-auto px-6 md:px-16">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-slate-900"
          >
            Ready to think like a specialist?
          </motion.h2>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-8 bg-yellow-400 text-black font-semibold px-8 py-4 rounded-xl shadow-lg hover:bg-yellow-300 transition"
          >
            Start Learning
          </motion.button>
        </div>
      </section>
    </div>
  );
}
