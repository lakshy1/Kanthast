import { motion } from "framer-motion";
import Image1 from "../assets/images/Image-3.png";
import Image2 from "../assets/images/Image-4.png";
import Image3 from "../assets/images/Image-5.png";

const fadeUp = {
  hidden: { opacity: 0, y: 60 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8 },
  },
};

export default function Courses() {
  return (
    <div className="scroll-smooth">
      {/* ================= COURSES OVERVIEW STRIP ================= */}
      <section className="py-24 bg-linear-to-br from-blue-900 via-blue-950 to-[#0f172a] text-white relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-cyan-400/10 blur-3xl rounded-full pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto px-6 md:px-16 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold mb-16"
          >
            Designed for Every Stage of Medical Mastery
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-10">
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
                desc: "Practical patient care thinking and exam-ready visual training.",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                viewport={{ once: true }}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition duration-300"
              >
                <h3 className="text-xl font-semibold mb-4 text-yellow-400">
                  {item.title}
                </h3>

                <p className="text-gray-300 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= MEDICINE (WHITE) ================= */}
      <section
        id="medicine"
        className="h-screen bg-white text-slate-900 flex items-center"
      >
        <div className="max-w-7xl mx-auto px-6 md:px-16 grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Medicine / USMLE
            </h1>

            <p className="text-lg text-slate-600 mb-8">
              Master complex physiology, pathology, and clinical reasoning
              through immersive 3D animation-driven lessons designed
              specifically for USMLE success.
            </p>

            <button className="bg-blue-950 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:bg-blue-900 transition">
              Explore Medicine
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="h-105 rounded-3xl shadow-xl overflow-hidden"
          >
            <img
              src={Image1}
              alt="Course preview"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </div>
      </section>

      {/* ================= PREMED (BLUE) ================= */}
      <section
        id="premed"
        className="h-screen bg-linear-to-br from-blue-900 via-blue-950 to-[#0f172a] text-white flex items-center"
      >
        <div className="max-w-7xl mx-auto px-6 md:px-16 grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="h-105 rounded-3xl shadow-xl overflow-hidden"
          >
            <img
              src={Image2}
              alt="Course preview"
              className="w-full h-full object-cover"
            />
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Premedicine / MCAT
            </h1>

            <p className="text-lg text-gray-300 mb-8">
              Concept-driven animated lessons simplifying biology, chemistry,
              and reasoning skills to build strong foundations for MCAT
              excellence.
            </p>

            <button className="bg-yellow-400 text-black px-8 py-4 rounded-xl font-semibold shadow-lg hover:bg-yellow-300 transition">
              Explore Premed
            </button>
          </motion.div>
        </div>
      </section>

      {/* ================= NURSING (WHITE) ================= */}
      <section
        id="nursing"
        className="h-screen bg-white text-slate-900 flex items-center"
      >
        <div className="max-w-7xl mx-auto px-6 md:px-16 grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Nursing / NCLEX
            </h1>

            <p className="text-lg text-slate-600 mb-8">
              Interactive visual modules designed to simplify patient care,
              pharmacology, and real-world nursing scenarios for NCLEX mastery.
            </p>

            <button className="bg-blue-950 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:bg-blue-900 transition">
              Explore Nursing
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="h-105 rounded-3xl shadow-xl overflow-hidden"
          >
            <img
              src={Image3}
              alt="Course preview"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </div>
      </section>
    </div>
  );
}
