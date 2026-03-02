import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaArrowRight } from "react-icons/fa";
import { Link } from "react-router-dom";
import video1 from "../assets/videos/Video-1.mp4";
import video2 from "../assets/videos/Video-2.mp4";
import video3 from "../assets/videos/Kanthast.mp4"
import heroImage from "../assets/images/Image-1.png"

const Homepage = () => {
  const courses = [
    {
      title: "Medicine / USMLE",
      desc: "Immersive 3D animations, clinical cases, and exam-focused preparation.",
    },
    {
      title: "Premedicine / MCAT",
      desc: "Concept-driven visual lessons simplifying biology and chemistry.",
    },
    {
      title: "Nursing / NCLEX",
      desc: "Interactive modules for patient care mastery and exam readiness.",
    },
  ];

  const roles = [
    "Cardiothoracic Surgeon",
    "Plastic Surgeon",
    "Neonatal ICU Nurse",
  ];

  const [currentRole, setCurrentRole] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const role = roles[currentRole];
    const speed = isDeleting ? 40 : 70;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        setDisplayText(role.substring(0, displayText.length + 1));
      } else {
        setDisplayText(role.substring(0, Math.max(0, displayText.length - 1)));
      }

      if (!isDeleting && displayText === role) {
        setTimeout(() => setIsDeleting(true), 1200);
      }

      if (isDeleting && displayText === "") {
        setIsDeleting(false);
        setCurrentRole((prev) => (prev + 1) % roles.length);
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [currentRole, displayText, isDeleting, roles]);

  return (
    <div className="bg-gradient-to-br from-[#0B1120] via-blue-950 text-white overflow-x-hidden">
      <section className="relative py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B1120] via-blue-950"></div>

        <div className="relative max-w-7xl mx-auto px-6 md:px-16 grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Learn Medicine Through
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-cyan-500">
                Immersive Animations
              </span>
            </h1>

            <p className="text-lg text-gray-400 max-w-xl">
              Transform complex medical topics into clear visual learning
              experiences designed for deep understanding and retention.
            </p>

            <div className="flex gap-4">
              <Link
                to="/signup"
                className="bg-cyan-500 hover:bg-cyan-400 text-black px-6 py-3 rounded-lg font-semibold transition"
              >
                Get Started
              </Link>
              <Link
                to="/lists"
                className="border border-white/20 px-6 py-3 rounded-lg hover:bg-white/10 transition"
              >
                Watch Demo
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="rounded-2xl overflow-hidden shadow-2xl border border-white/10"
          >
            <video
              src={video3}
              controls
              muted
              autoPlay
              loop
              playsInline
              className="w-full rounded-xl"
            />
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-[#0B1120] via-blue-950">
        <div className="max-w-7xl mx-auto px-6 md:px-16 grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <video
              src={video1}
              controls
              muted
              autoPlay
              loop
              playsInline
              className="rounded-2xl shadow-2xl"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-4xl font-bold">
              Think visually. Learn deeply.
            </h2>

            <p className="text-gray-400">
              Your brain processes patterns and visuals faster than text. Our
              animation-first lessons turn complex concepts into clarity.
            </p>

            <Link to="/signup" className="text-cyan-400 font-semibold flex items-center gap-2">
              Try It Free <FaArrowRight />
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-white text-slate-800">
        <div className="max-w-7xl mx-auto px-6 md:px-16 text-center mb-20">
          <h2 className="text-5xl font-bold">Our Programs</h2>
          <p className="text-gray-500 mt-4">
            Structured paths for medical excellence.
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-16 grid md:grid-cols-3 gap-10">
          {courses.map((course, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -8 }}
              className="bg-white border border-gray-200 rounded-2xl p-8 shadow-md hover:shadow-2xl transition"
            >
              <h3 className="text-2xl font-semibold mb-4">{course.title}</h3>
              <p className="text-gray-600 mb-6">{course.desc}</p>
              <button className="text-cyan-600 font-semibold">
                Learn More
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative w-full bg-gradient-to-b from-white to-slate-50 py-16 overflow-hidden">
        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight text-center pb-12">
          How Kanthast Works?
        </h2>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight text-center pb-12">
          AFTERLOAD <span className="text-slate-400">-&gt;</span>{" "}
          <span className="text-cyan-600">HYPERTENSION</span>
        </h2>

        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[37.5rem] h-[37.5rem] bg-cyan-100 blur-3xl rounded-full opacity-40 pointer-events-none"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-16 grid md:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="rounded-3xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.15)] border border-slate-200 bg-white">
              <video
                src={video2}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
            className="flex flex-col gap-10"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className="flex gap-6"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-cyan-100 text-cyan-700 font-bold">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Breaking Down the Concept
                </h3>
                <p className="text-slate-600">
                  We simplify the physiology into clear, exam-ready principles
                  so you understand the core mechanism instantly.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="flex gap-6"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Visualizing the Mechanism
                </h3>
                <p className="text-slate-600">
                  Pressure becomes force. Resistance becomes narrowing pipes.
                  You see the concept instead of memorizing isolated facts.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              viewport={{ once: true }}
              className="flex gap-6"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 text-purple-700 font-bold">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Creating a Recall Story
                </h3>
                <p className="text-slate-600">
                  The animation becomes a mental shortcut you can replay
                  instantly during the exam, making recall effortless.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="relative bg-white py-16 overflow-hidden">
        <div className="absolute top-40 left-1/2 -translate-x-1/2 w-[43.75rem] min-h-screen bg-cyan-200/30 blur-3xl rounded-full pointer-events-none"></div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-16 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 leading-tight"
          >
            Think like a{" "}
            <span className="relative inline-block">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-red-600">
                {displayText}
              </span>

              <motion.span
                layout
                className="absolute left-0 -bottom-2 h-1 w-full bg-red-400 rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.4 }}
              />

              <span className="animate-pulse text-red-500">|</span>
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            viewport={{ once: true }}
            className="mt-8 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto"
          >
            Train your brain to approach medicine with specialist-level
            reasoning. See the physiology, anticipate the complications, and
            think beyond memorization.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 60 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="mt-20 rounded-3xl overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.15)] border border-slate-200"
          >
            <img
              src={heroImage}
              alt="Medical animation preview"
              className="w-full rounded-2xl object-cover"
            />
          </motion.div>
        </div>
      </section>

                {/* ================= CTA SECTION ================= */}
      <section className="w-full bg-slate-50 py-16 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 md:px-16 flex flex-col md:flex-row items-center justify-between gap-10">

          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight max-w-2xl"
          >
            Join thousands of students learning with Kanthast
          </motion.h2>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="inline-block"
          >
            <Link
              to="/signup"
              className="bg-purple-600 text-white px-8 py-4 rounded-xl shadow-lg hover:bg-purple-700 transition-all duration-300 text-lg font-semibold inline-block"
            >
              Try it Free
            </Link>
          </motion.div>

        </div>
      </section>
    </div>
  );
};

export default Homepage;
