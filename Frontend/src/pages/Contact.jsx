import { Helmet } from "react-helmet-async";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";
import { Button, Field, LiveRegion } from "../components/ui";
import { apiFetch } from "../utils/apiBase";
import PageHero from "../components/landing/PageHero";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
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

const sectionViewport = { once: true, amount: 0.2 };

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
    <div className="home-page overflow-x-clip bg-surface text-ink">
      <Helmet>
        <title>Contact Kanthast | Learning Support</title>
        <meta name="description" content="Get in touch with the Kanthast team for support, partnerships, or questions about our learning platforms for both medical and school education." />
        <link rel="canonical" href="https://kanthast.in/contact" />
        <meta property="og:title" content="Contact Kanthast | Learning Support" />
        <meta property="og:description" content="Get in touch with the Kanthast team for support, partnerships, or questions about our learning platforms for both medical and school education." />
        <meta property="og:url" content="https://kanthast.in/contact" />
      </Helmet>

      <PageHero
        kicker="Contact"
        title="Let's"
        accent="connect."
        lead="Have questions about Kanthast Medical or Kanthast School? Share your requirements and our team will respond quickly."
        aside={
          <motion.ul variants={stagger} initial="hidden" animate="show" className="grid gap-4">
            {[
              { icon: <FaEnvelope />, title: "Email us", desc: "support@kanthast.in", href: "mailto:support@kanthast.in" },
              { icon: <FaMapMarkerAlt />, title: "Location", desc: "Mumbai, India" },
            ].map((item) => {
              const body = (
                <>
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-control bg-brand-soft text-lg text-brand">
                    {item.icon}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold uppercase tracking-[0.14em] text-ink-muted">{item.title}</span>
                    <span className="mt-1 block text-lg font-semibold text-ink">{item.desc}</span>
                  </span>
                </>
              );
              const cls =
                "flex items-center gap-5 rounded-card border border-line bg-surface-raised px-6 py-5 transition-colors duration-200";
              return (
                <motion.li key={item.title} variants={fadeUp}>
                  {item.href ? (
                    <a href={item.href} className={`${cls} hover:border-brand/60`}>
                      {body}
                    </a>
                  ) : (
                    <div className={cls}>{body}</div>
                  )}
                </motion.li>
              );
            })}
          </motion.ul>
        }
      />

      <section className="relative overflow-hidden bg-surface-sunken py-20 md:py-28">
        <div aria-hidden="true" className="home-glow home-glow-close" />
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={sectionViewport}
          className="site-container relative grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20"
        >
          <div>
            <h2 className="text-4xl text-ink md:text-5xl">Send us a message</h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-muted">
              Tell us what you need, whether it is a plan, the library, school access or a partnership, and we will get back to you.
            </p>
          </div>

          <div className="rounded-card border border-line bg-surface-raised p-7 shadow-e3 md:p-10">
            <form onSubmit={handleSubmit} className="space-y-5">
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
          </div>
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
            className="fixed bottom-6 right-6 z-50 rounded-xl border border-brand/40 bg-surface-raised px-5 py-3 font-semibold text-brand shadow-e4"
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
