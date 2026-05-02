import { FaFacebookF, FaInstagram, FaLinkedinIn, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { Link } from "react-router-dom";

const socialLinks = [
  { icon: <FaLinkedinIn />, label: "LinkedIn", href: "https://www.linkedin.com/company/kanthast/" },
  { icon: <FaFacebookF />, label: "Facebook", href: "https://facebook.com" },
  { icon: <FaInstagram />, label: "Instagram", href: "https://instagram.com" },
  { icon: <FaXTwitter />, label: "X (Twitter)", href: "https://x.com" },
  { icon: <FaYoutube />, label: "YouTube", href: "https://youtube.com" },
];

const Footer = () => {
  return (
    <footer className="w-full bg-gradient-to-br from-[#060c16] via-[#0a1530] to-[#07101e] text-white">
      <div className="max-w-7xl mx-auto px-6 md:px-16 pt-12 pb-8">

        {/* Top: brand + columns */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-10 md:gap-16">

          {/* Brand */}
          <div className="flex flex-col gap-4">
            <span className="text-xl font-black tracking-tight text-white">Kanthast</span>
            <p className="text-sm text-white/50 leading-relaxed max-w-xs">
              Visual learning platform designed to help you master complex medical concepts through immersive animation.
            </p>
            <div className="flex gap-2 mt-1">
              {socialLinks.map(({ icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="w-8 h-8 rounded-full border border-white/15 bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:border-white/40 hover:bg-white/10 transition text-sm"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Company + Legal: side by side on mobile too */}
          <div className="grid grid-cols-2 gap-8 md:contents">
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35 mb-1">Company</p>
              <Link to="/subscription" className="text-sm text-white/55 hover:text-white transition">Pricing</Link>
              <Link to="/about" className="text-sm text-white/55 hover:text-white transition">About</Link>
              <a href="#" className="text-sm text-white/55 hover:text-white transition">Careers</a>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35 mb-1">Legal</p>
              <a href="#" className="text-sm text-white/55 hover:text-white transition">Terms &amp; Privacy</a>
              <Link to="/contact" className="text-sm text-white/55 hover:text-white transition">Contact Us</Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/30">
          <span>&copy; 2026 Kanthast Inc. All rights reserved.</span>
          <span className="hidden sm:block">Built for medical learners worldwide</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
