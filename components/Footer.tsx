
import React from 'react';
import { Instagram, Facebook, Youtube } from 'lucide-react';
import Image from 'next/image';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#020617] text-slate-400 py-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden relative">
                <Image
                  src="/logo/logo_icon.png"
                  alt="Digital Madrasa Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <h2 className="text-2xl font-bold text-white">Digital Madrasa</h2>
            </div>
            <p className="max-w-sm leading-relaxed mb-6">Empowering the next generation of Indian freelancers with AI-powered skills and international standards.</p>

            {/* Social Media Buttons */}
            <div className="flex gap-4">
              <a href="https://www.instagram.com/digitalmadrasa?igsh=enNhanB5OXdiMTR6" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-pink-600 hover:text-white transition-all duration-300 group" aria-label="Instagram">
                <Instagram size={20} />
              </a>
              <a href="https://www.facebook.com/share/1BEuZBeuvQ/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all duration-300 group" aria-label="Facebook">
                <Facebook size={20} />
              </a>
              <a href="https://youtube.com/@digitalmadarsa?si=f-s-ybSYzLioYKxJ" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all duration-300 group" aria-label="YouTube">
                <Youtube size={20} />
              </a>
            </div>
          </div>



          <div>
            <h3 className="text-white font-bold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/legal/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="/legal/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="/legal/refunds" className="hover:text-white transition-colors">Refund Policy</a></li>
              <li><a href="/legal/shipping" className="hover:text-white transition-colors">Shipping Policy</a></li>
              <li><a href="/contact" className="hover:text-white transition-colors">Contact Us</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-sm gap-4 md:gap-0">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
            <p>© 2025 Digital Madrasa. All rights reserved.</p>
            <span className="hidden md:inline text-slate-700">|</span>
            <p>
              Developed by <a href="https://wemstudios.in/" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#0066ff] transition-colors font-medium">WEM Studios</a>
            </p>
          </div>
          <p>Made with ❤️ in India.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
