import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { FaEnvelope, FaPhoneAlt, FaMapMarkerAlt } from "react-icons/fa";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7 },
  },
};

export default function Contact() {
  const [status, setStatus] = useState("idle"); // idle | loading | success | error

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");

    const form = e.target;
    const formData = new FormData(form);

    try {
      await fetch("/", {
        method: "POST",
        body: formData,
      });

      setStatus("success");
      form.reset();

      setTimeout(() => setStatus("idle"), 3000);
    } catch (error) {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <div className="overflow-x-hidden relative">

      {/* ================= HERO ================= */}
      <section className="bg-linear-to-br from-[#0B1120] via-blue-950 to-[#0f172a] text-white py-28">
        <div className="max-w-5xl mx-auto px-6 md:px-16 text-center">
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="text-4xl md:text-6xl font-bold"
          >
            Let’s Connect
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.2 }}
            className="mt-6 text-lg md:text-xl text-gray-300"
          >
            Have questions about Kanthast? We’d love to hear from you.
            Our team is here to help.
          </motion.p>
        </div>
      </section>

      {/* ================= CONTACT INFO ================= */}
      <section className="py-24 bg-linear-to-br from-slate-50 via-white to-cyan-50 text-slate-900">
        <div className="max-w-7xl mx-auto px-6 md:px-16 grid md:grid-cols-3 gap-10">
          {[
            {
              icon: <FaEnvelope />,
              title: "Email Us",
              desc: "support@kanthast.com",
            },
            {
              icon: <FaPhoneAlt />,
              title: "Call Us",
              desc: "+91 98765 43210",
            },
            {
              icon: <FaMapMarkerAlt />,
              title: "Location",
              desc: "Mumbai, India",
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition"
            >
              <div className="text-cyan-600 text-2xl mb-4">
                {item.icon}
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {item.title}
              </h3>
              <p className="text-slate-600">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================= CONTACT FORM ================= */}
      <section className="py-28 bg-linear-to-br from-slate-50 via-white to-cyan-50 text-slate-900 relative overflow-hidden">

        {/* Glow Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w h-175 bg-cyan-200/40 blur-3xl rounded-full pointer-events-none"></div>

        <div className="relative max-w-4xl mx-auto px-6 md:px-16">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-white border border-slate-200 rounded-3xl p-10 shadow-[0_30px_80px_rgba(0,0,0,0.08)]"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
              Send Us a Message
            </h2>

            <form
              name="contact"
              method="POST"
              data-netlify="true"
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {/* Netlify Hidden Field */}
              <input type="hidden" name="form-name" value="contact" />

              <div className="grid md:grid-cols-2 gap-6">
                <input
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  required
                  className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                />

                <input
                  type="email"
                  name="email"
                  placeholder="Your Email"
                  required
                  className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                />
              </div>

              <input
                type="text"
                name="subject"
                placeholder="Subject"
                className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
              />

              <textarea
                name="message"
                rows="5"
                placeholder="Your Message"
                required
                className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
              />

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={status === "loading"}
                className={`w-full font-semibold py-4 rounded-xl shadow-lg transition ${
                  status === "loading"
                    ? "bg-yellow-300 cursor-not-allowed"
                    : "bg-yellow-400 hover:bg-yellow-300"
                } text-black`}
              >
                {status === "loading" ? "Sending..." : "Send Message"}
              </motion.button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* ================= TOAST NOTIFICATIONS ================= */}
      <AnimatePresence>
        {status === "success" && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl z-50"
          >
            ✅ Message sent successfully!
          </motion.div>
        )}

        {status === "error" && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-6 right-6 bg-red-500 text-white px-6 py-4 rounded-xl shadow-2xl z-50"
          >
            ❌ Something went wrong. Please try again.
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}