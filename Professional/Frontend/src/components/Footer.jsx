import { Link } from "react-router-dom";
import { FaLinkedinIn } from "react-icons/fa";

// Kanthast Professional footer, in the shared Kanthast design language (same
// panel, K mark and bottom bar as the kanthast.in landing page). In-app links
// use the router (basename /professional); links to the other apps are plain.
const COLUMNS = [
  {
    title: "Professional",
    links: [
      { label: "Courses", to: "/courses" },
      { label: "Library", to: "/library" },
      { label: "Pricing", to: "/pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", to: "/about" },
      { label: "Contact Us", to: "/contact" },
      { label: "Kanthast home", href: "/" },
      { label: "Kanthast School", href: "/school/" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Use", to: "/terms" },
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Refund Policy", to: "/refunds" },
    ],
  },
];

function KMark() {
  return (
    <svg className="nav-k" viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <linearGradient id="foot-k-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2563eb" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="foot-k-b" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#60a5fa" />
          <stop offset="1" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <rect x="4" y="3" width="10" height="34" rx="3.5" fill="url(#foot-k-a)" />
      <path d="M17.5 21.5 L30 4.5 Q31.4 3 33.4 3 H37 Q38.6 3 37.6 4.4 L25 21.5 Z" fill="url(#foot-k-a)" />
      <path d="M17.5 21.5 H25 L37.6 35.6 Q38.6 37 37 37 H33.4 Q31.4 37 30 35.5 Z" fill="url(#foot-k-b)" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="kx-footer">
      <div className="kx-footer-panel">
        <div className="kx-footer-top">
          <div className="kx-footer-brand">
            <Link to="/" className="kx-footer-logo" aria-label="Kanthast Professional home">
              <KMark />
              <span>Kanthast <span className="kx-footer-sub">Professional</span></span>
            </Link>
            <p>Short animated lectures for NEET-PG, INI-CET and USMLE, with AI help while you study.</p>
          </div>
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title} className="kx-footer-col">
              <p className="kx-footer-heading">{col.title}</p>
              {col.links.map((l) =>
                l.to ? (
                  <Link key={l.label} to={l.to}>{l.label}</Link>
                ) : (
                  <a key={l.label} href={l.href}>{l.label}</a>
                )
              )}
            </nav>
          ))}
        </div>
        <div className="kx-footer-bottom">
          <span className="kx-footer-copy">&copy; {new Date().getFullYear()} Kanthast. All rights reserved.</span>
          <a
            href="https://www.linkedin.com/company/kanthast/"
            target="_blank"
            rel="noreferrer"
            aria-label="Kanthast on LinkedIn"
            className="kx-footer-social"
          >
            <FaLinkedinIn aria-hidden="true" />
          </a>
          <span className="kx-footer-strap">Made for learners in India and worldwide.</span>
        </div>
      </div>
    </footer>
  );
}
