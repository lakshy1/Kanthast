import { FaLinkedinIn } from "react-icons/fa";

// Landing page footer, in the same design language as the sections above.
// Every destination is a separate app on kanthast.in, so these are plain links.
const COLUMNS = [
  {
    title: "Products",
    links: [
      { label: "Kanthast Professional", href: "/professional" },
      { label: "Kanthast School", href: "/school" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Use", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Refund Policy", href: "/refunds" },
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
            <a href="/" className="kx-footer-logo" aria-label="Kanthast home">
              <KMark />
              <span>Kanthast</span>
            </a>
            <p>Short animated lessons with AI help, for medical entrance exams and for school.</p>
            <a
              href="https://www.linkedin.com/company/kanthast/"
              target="_blank"
              rel="noreferrer"
              aria-label="Kanthast on LinkedIn"
              className="kx-footer-social"
            >
              <FaLinkedinIn aria-hidden="true" />
            </a>
          </div>
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title} className="kx-footer-col">
              <p className="kx-footer-heading">{col.title}</p>
              {col.links.map((l) => (
                <a key={l.href} href={l.href}>{l.label}</a>
              ))}
            </nav>
          ))}
        </div>
        <div className="kx-footer-bottom">
          <span>&copy; {new Date().getFullYear()} Kanthast. All rights reserved.</span>
          <span>Made for learners in India and worldwide.</span>
        </div>
      </div>
    </footer>
  );
}
