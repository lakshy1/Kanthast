import React from 'react';
import { FaFacebookF, FaInstagram, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

const Footer = () => {
  return (
    <>
    {/* ================= DARK FOOTER ================= */}
      <footer className="w-full bg-linear-to-br from-[#0B1120] via-blue-950 to-[#0f172a] text-white pt-10 pb-12">

        <div className="max-w-7xl mx-auto px-6 md:px-16 grid md:grid-cols-3 gap-16">

          {/* Brand */}
          <div className="flex flex-col gap-6">
            <h3 className="text-2xl font-bold tracking-wide">
              Kanthast
            </h3>

            <p className="text-gray-400 max-w-sm">
              Visual learning platform designed to help you master complex
              medical concepts through immersive animation.
            </p>

            <div className="flex gap-4 text-gray-400 text-lg">
              <FaFacebookF className="hover:text-white cursor-pointer transition" />
              <FaInstagram className="hover:text-white cursor-pointer transition" />
              <FaXTwitter className="hover:text-white cursor-pointer transition" />
              <FaYoutube className="hover:text-white cursor-pointer transition" />
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-4">
            <h4 className="text-lg font-semibold mb-2">Company</h4>
            <a href="#" className="text-gray-400 hover:text-white transition">Pricing</a>
            <a href="#" className="text-gray-400 hover:text-white transition">About</a>
            <a href="#" className="text-gray-400 hover:text-white transition">Careers</a>
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-4">
            <h4 className="text-lg font-semibold mb-2">Legal</h4>
            <a href="#" className="text-gray-400 hover:text-white transition">Terms & Privacy</a>
            <a href="#" className="text-gray-400 hover:text-white transition">Contact Us</a>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-16 border-t border-white/10 pt-6 text-center text-gray-500 text-sm">
          © 2026 Kanthast Inc. All rights reserved.
        </div>

      </footer>
    </>
     
  )
}

export default Footer