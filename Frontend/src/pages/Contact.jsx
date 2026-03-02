import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { FaEnvelope, FaPhoneAlt, FaMapMarkerAlt } from "react-icons/fa";

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

export default function Contact() {
  const [status, setStatus] = useState("idle");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");

    const form = e.target;
    const formData = new FormData(form);

    try {
      await fetch("/", { method: "POST", body: formData });
      setStatus("success");
      form.reset();
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

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
            <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-black">
              Let&apos;s Connect
            </motion.h1>
            <motion.p variants={fadeUp} className="mx-auto mt-5 max-w-3xl text-base md:text-lg text-cyan-100/90">
              Have questions about Kanthast? Share your requirements and our team will respond quickly.
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
            { icon: <FaEnvelope />, title: "Email Us", desc: "support@kanthast.com" },
            { icon: <FaPhoneAlt />, title: "Call Us", desc: "+91 98765 43210" },
            { icon: <FaMapMarkerAlt />, title: "Location", desc: "Mumbai, India" },
          ].map((item) => (
            <motion.div
              key={item.title}
              variants={fadeUp}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="rounded-2xl border border-white/60 bg-white/55 p-7 backdrop-blur-2xl shadow-[0_18px_55px_rgba(15,23,42,0.11)]"
            >
              <motion.div whileHover={{ rotate: -6, scale: 1.12 }} className="text-2xl text-cyan-600">
                {item.icon}
              </motion.div>
              <h3 className="mt-4 text-xl font-bold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-slate-600">{item.desc}</p>
            </motion.div>
          ))}
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
          <motion.div
            whileHover={{ y: -4 }}
            className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/62 p-8 backdrop-blur-2xl shadow-[0_25px_70px_rgba(15,23,42,0.13)] md:p-10"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
              className="pointer-events-none absolute -top-16 -right-10 h-56 w-56 rounded-full bg-cyan-200/30 blur-3xl"
            />

            <h2 className="relative text-center text-3xl md:text-4xl font-black text-slate-900">Send Us a Message</h2>

            <form
              name="contact"
              method="POST"
              data-netlify="true"
              onSubmit={handleSubmit}
              className="relative mt-8 space-y-5"
            >
              <input type="hidden" name="form-name" value="contact" />

              <div className="grid gap-5 md:grid-cols-2">
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  required
                  className="w-full rounded-xl border border-slate-300/70 bg-white/80 px-4 py-3 text-slate-900 outline-none transition focus:ring-2 focus:ring-cyan-400"
                />
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  type="email"
                  name="email"
                  placeholder="Your Email"
                  required
                  className="w-full rounded-xl border border-slate-300/70 bg-white/80 px-4 py-3 text-slate-900 outline-none transition focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <motion.input
                whileFocus={{ scale: 1.01 }}
                type="text"
                name="subject"
                placeholder="Subject"
                className="w-full rounded-xl border border-slate-300/70 bg-white/80 px-4 py-3 text-slate-900 outline-none transition focus:ring-2 focus:ring-cyan-400"
              />

              <motion.textarea
                whileFocus={{ scale: 1.01 }}
                name="message"
                rows="5"
                placeholder="Your Message"
                required
                className="w-full rounded-xl border border-slate-300/70 bg-white/80 px-4 py-3 text-slate-900 outline-none transition focus:ring-2 focus:ring-cyan-400"
              />

              <motion.button
                whileTap={{ scale: 0.98 }}
                whileHover={{ y: -2, scale: 1.01 }}
                type="submit"
                disabled={status === "loading"}
                className={`w-full rounded-xl py-3.5 font-semibold transition ${
                  status === "loading"
                    ? "cursor-not-allowed bg-slate-300 text-slate-600"
                    : "bg-slate-900 text-white hover:bg-slate-800"
                }`}
              >
                {status === "loading" ? "Sending..." : "Send Message"}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      </section>

      <AnimatePresence>
        {status === "success" && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.92 }}
            className="fixed bottom-6 right-6 z-50 rounded-xl bg-emerald-500 px-5 py-3 text-white shadow-2xl"
          >
            Message sent successfully.
          </motion.div>
        )}
        {status === "error" && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.92 }}
            className="fixed bottom-6 right-6 z-50 rounded-xl bg-red-500 px-5 py-3 text-white shadow-2xl"
          >
            Something went wrong. Please try again.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
