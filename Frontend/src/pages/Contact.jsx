import { Helmet } from "react-helmet-async";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { FaEnvelope, FaPhoneAlt, FaMapMarkerAlt } from "react-icons/fa";
import { Button, Field, LiveRegion } from "../components/ui";
import { apiFetch } from "../utils/apiBase";

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
    const { name, email, subject, message } = Object.fromEntries(new FormData(form));

    try {
      const res = await apiFetch("/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Server error");
      setStatus("success");
      form.reset();
      setTimeout(() => setStatus("idle"), 4000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 4000);
    }
  };

  return (
    <div className="overflow-x-hidden bg-[radial-gradient(circle_at_10%_10%,_#dbeafe,_#eff6ff_42%,_#ecfeff_100%)]">
      <Helmet>
        <title>Contact Kanthast | Learning Support</title>
        <meta name="description" content="Get in touch with the Kanthast team for support, partnerships, or questions about our learning platforms for both medical and school education." />
        <link rel="canonical" href="https://kanthast.in/contact" />
        <meta property="og:title" content="Contact Kanthast | Learning Support" />
        <meta property="og:description" content="Get in touch with the Kanthast team for support, partnerships, or questions about our learning platforms for both medical and school education." />
        <meta property="og:url" content="https://kanthast.in/contact" />
      </Helmet>
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
            className="rounded-3xl border border-white/20 bg-white/10 px-6 py-10 text-center backdrop-blur-2xl shadow-e5 md:px-12"
          >
            <motion.h1 variants={fadeUp} className="text-3xl sm:text-4xl md:text-6xl font-black">
              Let&apos;s Connect
            </motion.h1>
            <motion.p variants={fadeUp} className="mx-auto mt-5 max-w-3xl text-base md:text-lg text-cyan-100/90">
              Have questions about Kanthast Medical or Kanthast School? Share your requirements and our team will respond quickly.
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
            { icon: <FaEnvelope />, title: "Email Us", desc: "support@kanthast.in" },
            { icon: <FaPhoneAlt />, title: "Call Us", desc: "+91 98765 43210" },
            { icon: <FaMapMarkerAlt />, title: "Location", desc: "Mumbai, India" },
          ].map((item) => (
            <motion.div
              key={item.title}
              variants={fadeUp}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="rounded-2xl border border-white/60 bg-surface/55 p-7 backdrop-blur-2xl shadow-e3"
            >
              <motion.div whileHover={{ rotate: -6, scale: 1.12 }} className="text-2xl text-cyan-600">
                {item.icon}
              </motion.div>
              <h3 className="mt-4 text-xl font-bold text-ink">{item.title}</h3>
              <p className="mt-2 text-ink-muted">{item.desc}</p>
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
            className="relative overflow-hidden rounded-3xl border border-white/60 bg-surface/62 p-8 backdrop-blur-2xl shadow-e4 md:p-10"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
              className="pointer-events-none absolute -top-16 -right-10 h-56 w-56 rounded-full bg-cyan-200/30 blur-3xl"
            />

            <h2 className="relative text-center text-3xl md:text-4xl font-black text-ink">Send Us a Message</h2>

            <form
              onSubmit={handleSubmit}
              className="relative mt-8 space-y-5"
            >

              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="Your Name"
                  id="contact-name"
                  type="text"
                  name="name"
                  autoComplete="name"
                  placeholder="Your Name"
                  required
                />
                <Field
                  label="Your Email"
                  id="contact-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="Your Email"
                  required
                />
              </div>

              <Field
                label="Subject"
                id="contact-subject"
                type="text"
                name="subject"
                placeholder="Subject"
              />

              <div>
                <label htmlFor="contact-message" className="label">
                  Your Message
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows="5"
                  placeholder="Your Message"
                  required
                  className="field"
                />
              </div>

              <Button
                type="submit"
                fullWidth
                loading={status === "loading"}
                loadingText="Sending..."
              >
                Send Message
              </Button>
            </form>
          </motion.div>
        </motion.div>
      </section>

      <LiveRegion
        message={
          status === "success"
            ? "Message sent successfully."
            : status === "error"
            ? "Something went wrong. Please try again."
            : ""
        }
        politeness={status === "error" ? "assertive" : "polite"}
      />

      <AnimatePresence>
        {status === "success" && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.92 }}
            aria-hidden="true"
            className="fixed bottom-6 right-6 z-50 rounded-xl bg-emerald-600 px-5 py-3 text-white shadow-e4"
          >
            Message sent successfully.
          </motion.div>
        )}
        {status === "error" && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.92 }}
            aria-hidden="true"
            className="fixed bottom-6 right-6 z-50 rounded-xl bg-critical px-5 py-3 text-white shadow-e4"
          >
            Something went wrong. Please try again.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
