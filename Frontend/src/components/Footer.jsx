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
    <footer className="w-full bg-gradient-to-br from-[#0B1120] via-blue-950 to-[#0f172a] text-white pt-10 pb-12">
      <div className="max-w-7xl mx-auto px-6 md:px-16 grid md:grid-cols-3 gap-16">
        <div className="flex flex-col gap-6">
          <h3 className="text-2xl font-bold tracking-wide">Kanthast</h3>
          <p className="text-gray-400 max-w-sm">
            Visual learning platform designed to help you master complex medical concepts through immersive animation.
          </p>
          <div className="flex gap-4 text-gray-400 text-lg">
            {socialLinks.map(({ icon, label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded"
              >
                {icon}
              </a>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h4 className="text-lg font-semibold mb-2">Company</h4>
          <Link to="/subscription" className="text-gray-400 hover:text-white transition">Pricing</Link>
          <Link to="/about" className="text-gray-400 hover:text-white transition">About</Link>
          <a href="#" className="text-gray-400 hover:text-white transition">Careers</a>
        </div>

        <div className="flex flex-col gap-4">
          <h4 className="text-lg font-semibold mb-2">Legal</h4>
          <a href="#" className="text-gray-400 hover:text-white transition">Terms &amp; Privacy</a>
          <Link to="/contact" className="text-gray-400 hover:text-white transition">Contact Us</Link>
        </div>
      </div>

      <div className="mt-16 border-t border-white/10 pt-6 text-center text-gray-500 text-sm">
        &copy; 2026 Kanthast Inc. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;