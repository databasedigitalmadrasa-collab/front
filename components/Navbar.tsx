"use client"

import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';

interface NavbarProps {
  onNavigate?: (view: 'home' | 'about') => void;
  currentView?: 'home' | 'about';
}

import Image from 'next/image';

import { usePathname, useRouter } from 'next/navigation';

const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentView }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeHash, setActiveHash] = useState<string>("#");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Initialize active hash
    setActiveHash(window.location.hash || "#");

    const handleHashChange = () => {
      setActiveHash(window.location.hash || "#");
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#', view: 'home' as const },
    { name: 'About Us', href: '#about', view: 'about' as const },
    { name: 'Skills', href: '#skills', view: 'home' as const },
    { name: 'Mentors', href: '#mentors', view: 'home' as const },
    { name: 'Pricing', href: '#pricing', view: 'home' as const }
  ];

  const handleLinkClick = (view: 'home' | 'about', href: string) => {
    setIsMobileMenuOpen(false);
    setActiveHash(href); // Optimistic update

    // If not on homepage, navigate to homepage first
    if (pathname !== '/') {
      if (href === '#') router.push('/');
      else router.push(`/${href}`); // e.g., /#about
      return;
    }

    if (onNavigate) onNavigate(view);
    if (view === 'home' && href !== '#') {
      setTimeout(() => {
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 0);
    } else if (href === '#') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Clear hash without reload
      history.pushState(null, "", " ");
      setActiveHash("#");
    }
  };

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled || currentView === 'about'
        ? 'bg-navy-black/80 backdrop-blur-md border-b border-white/10 py-4'
        : 'bg-transparent py-6'
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => handleLinkClick('home', '#')}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform overflow-hidden relative">
            <Image
              src="/logo/logo_icon.png"
              alt="Digital Madrasa Logo"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Digital Madrasa
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((item) => (
            <a
              key={item.name}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick(item.view, item.href);
              }}
              className={`text-sm font-medium transition-colors ${(activeHash === item.href) || (item.name === 'Home' && activeHash === '#' && !isScrolled)
                ? 'text-white border-b-2 border-royal-blue pb-1'
                : 'text-slate-300 hover:text-white'
                }`}
            >
              {item.name}
            </a>
          ))}
          <Link
            href="/login"
            className="text-slate-300 hover:text-white text-sm font-medium transition-colors"
          >
            Login
          </Link>
          <Link
            href="/enroll/1"
            className="bg-royal-blue hover:bg-blue-600 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-lg shadow-blue-500/20"
          >
            Enroll Now
          </Link>
        </div>

        <div className="md:hidden text-white">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-navy-black border-b border-slate-800 py-6 px-6 flex flex-col gap-5 shadow-2xl animate-in fade-in slide-in-from-top-4">
          {navLinks.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="text-slate-300 hover:text-white text-lg font-medium block border-b border-white/5 pb-2 border-b-0"
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick(item.view, item.href);
              }}
            >
              <span className={activeHash === item.href ? "text-white border-b-2 border-royal-blue pb-1" : ""}>
                {item.name}
              </span>
            </a>
          ))}
          <Link
            href="/login"
            className="text-slate-300 hover:text-white text-lg font-medium block border-b border-white/5 pb-2"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Login
          </Link>
          <Link
            href="/enroll/1"
            className="bg-royal-blue hover:bg-blue-600 w-full py-4 rounded-xl text-white font-bold text-lg text-center"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Enroll Now
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
