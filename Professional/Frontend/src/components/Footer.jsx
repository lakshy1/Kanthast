import { FaLinkedinIn } from "react-icons/fa";
import { Link } from "react-router-dom";
import { HashLink } from "react-router-hash-link";

const socialLinks = [
  { icon: <FaLinkedinIn />, label: "LinkedIn", href: "https://www.linkedin.com/company/kanthast/" },
];

const BLURB = "Visual learning platform designed to help you master complex medical concepts through immersive animation.";
const STRAP = "Built for medical learners worldwide";

const Footer = () => {

  return (
    <footer className="w-full kb-footer text-white">
      <div className="site-container pt-12 pb-8">

        {/* Top: brand + columns */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-10 md:gap-16">

          {/* Brand */}
          <div className="flex flex-col gap-4">
            <span className="text-xl font-black tracking-tight text-white">Kanthast Professional</span>
            <p className="text-sm text-white/70 leading-relaxed max-w-xs">
              {BLURB}
            </p>
            <div className="flex flex-wrap gap-1 mt-1 -ml-2">
              {socialLinks.map(({ icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="btn-icon border border-white/15 bg-white/5 text-white/70 hover:text-white hover:border-white/40 hover:bg-white/10 text-sm"
                >
                  <span aria-hidden="true">{icon}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Company + Legal: side by side on mobile too */}
          <div className="grid grid-cols-2 gap-8 md:contents">
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70 mb-1">Company</p>
              <HashLink smooth to="/pricing" className="text-sm text-white/70 hover:text-white transition">Pricing</HashLink>
              <Link to="/about" className="text-sm text-white/70 hover:text-white transition">About</Link>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70 mb-1">Legal</p>
              <Link to="/terms" className="text-sm text-white/70 hover:text-white transition">Terms of Use</Link>
              <Link to="/privacy" className="text-sm text-white/70 hover:text-white transition">Privacy Policy</Link>
              <Link to="/refunds" className="text-sm text-white/70 hover:text-white transition">Refund Policy</Link>
              <Link to="/contact" className="text-sm text-white/70 hover:text-white transition">Contact Us</Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-[#1d3249] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/60">
          <span>&copy; 2026 Kanthast Inc. All rights reserved.</span>
          <span className="hidden sm:block">
            {STRAP}
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
