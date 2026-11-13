import { useState } from "react";
import { FaEnvelope, FaLocationDot, FaPaperPlane, FaComments, FaArrowRight } from "react-icons/fa6";
import Seo from "../components/Seo";
import SectionHead from "../components/landing/SectionHead";
import { ORGANIZATION_ID, SITE_URL, breadcrumbSchema } from "../utils/seo";

// Messages go to the Kanthast support inbox through the contact API on this domain.
const CONTACT_API = "/professional/api/v1/contact";

const TOPICS = ["Kanthast Professional", "Kanthast School", "Partnership", "Something else"];

const EMPTY = { name: "", email: "", topic: TOPICS[0], message: "" };

export default function Contact() {
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [error, setError] = useState("");

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      const res = await fetch(CONTACT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, subject: form.topic, message: form.message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not send your message.");
      setStatus("sent");
      setForm(EMPTY);
    } catch (err) {
      setStatus("error");
      setError(err.message || "Could not send your message. Please email us instead.");
    }
  };

  return (
    <div className="brand-page overflow-x-clip text-ink">
      <Seo
        title="Contact Kanthast | Questions about Professional or School"
        description="Get in touch with Kanthast about Kanthast Professional, Kanthast School or a partnership. Email support@kanthast.in or send us a message."
        path="/contact"
        jsonLd={[
          {
            "@type": "ContactPage",
            "@id": `${SITE_URL}/contact#webpage`,
            url: `${SITE_URL}/contact`,
            name: "Contact Kanthast",
            about: { "@id": ORGANIZATION_ID },
            isPartOf: { "@id": `${SITE_URL}/#website` },
          },
          breadcrumbSchema([
            { name: "Kanthast", path: "/" },
            { name: "Contact", path: "/contact" },
          ]),
        ]}
      />

      <section className="kx-section kx-page-hero kx-section-last" aria-labelledby="contact-title">
        <SectionHead
          as="h1"
          id="contact-title"
          eyebrow="Contact"
          icon={FaComments}
          before="Let's"
          accent="Talk"
          note="Questions about Kanthast Professional or Kanthast School, or want to work with us? We read every message."
        />

        <div className="kx-contact">
          <div className="kx-contact-side">
            <a href="mailto:support@kanthast.in" className="kx-ai-card kx-contact-card">
              <span className="kx-badge" aria-hidden="true"><FaEnvelope /></span>
              <span className="kx-ai-text">
                <span className="kx-ai-title">Email us</span>
                <span className="kx-ai-body">support@kanthast.in</span>
              </span>
            </a>
            <div className="kx-ai-card kx-contact-card">
              <span className="kx-badge" aria-hidden="true"><FaLocationDot /></span>
              <span className="kx-ai-text">
                <span className="kx-ai-title">Location</span>
                <span className="kx-ai-body">Mumbai, India</span>
              </span>
            </div>
            <div className="kx-contact-links">
              <a href="/professional/" className="bh-btn bh-btn-ghost">Kanthast Professional <FaArrowRight aria-hidden="true" className="text-[0.8em]" /></a>
              <a href="/school/" className="bh-btn bh-btn-ghost">Kanthast School <FaArrowRight aria-hidden="true" className="text-[0.8em]" /></a>
            </div>
          </div>

          <form className="kx-panel kx-contact-form" onSubmit={submit} noValidate={false}>
            <h2 className="kx-form-title">Send us a message</h2>
            <div className="kx-form-row">
              <label className="kx-field">
                <span>Your name</span>
                <input required autoComplete="name" value={form.name} onChange={update("name")} />
              </label>
              <label className="kx-field">
                <span>Your email</span>
                <input required type="email" autoComplete="email" value={form.email} onChange={update("email")} />
              </label>
            </div>
            <label className="kx-field">
              <span>Topic</span>
              <select value={form.topic} onChange={update("topic")}>
                {TOPICS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label className="kx-field">
              <span>Message</span>
              <textarea required rows={5} value={form.message} onChange={update("message")} />
            </label>
            <div className="kx-form-foot">
              <button type="submit" className="bh-btn bh-btn-primary" disabled={status === "sending"}>
                <FaPaperPlane aria-hidden="true" className="text-[0.85em]" />
                {status === "sending" ? "Sending…" : "Send message"}
              </button>
              <p className="kx-form-status" role="status" aria-live="polite">
                {status === "sent" && "Thanks! Your message is on its way. We'll reply by email."}
                {status === "error" && error}
              </p>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
