
import React from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronRight, Play } from 'lucide-react';
import { motion } from 'framer-motion';

// --- Tool Icons Configuration ---
// Using Simple Icons CDN for verified logos
const tools = [
  { name: 'Adobe Photoshop', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Adobe_Photoshop_CC_icon.svg/1024px-Adobe_Photoshop_CC_icon.svg.png?20200616073617' },
  { name: 'Mailchimp', url: 'https://cdn.simpleicons.org/mailchimp/FFE01B' },
  { name: 'Yoast SEO', url: 'https://cdn.simpleicons.org/yoast/A4C639' },
  { name: 'Elementor', url: 'https://cdn.simpleicons.org/elementor/92003B' },
  { name: 'DaVinci Resolve', url: 'https://cdn.simpleicons.org/davinciresolve/FF5C00' },
  { name: 'Substack', url: 'https://cdn.simpleicons.org/substack/FF6719' },
  // { name: 'Snovio', url: 'https://cdn.simpleicons.org/snovio/9D28B0' }, // Snov.io purple
  { name: 'WordPress', url: 'https://cdn.simpleicons.org/wordpress/21759B' },
  // { name: 'Kit', url: 'https://cdn.simpleicons.org/convertkit/FF6B6B' }, // ConvertKit rebrand
  { name: 'HubSpot', url: 'https://cdn.simpleicons.org/hubspot/FF7A59' },
  { name: 'Payoneer', url: 'https://cdn.simpleicons.org/payoneer/FF4800' },
  { name: 'Calendly', url: 'https://cdn.simpleicons.org/calendly/006BFF' },
  { name: 'RankMath', url: 'https://rankmath.com/wp-content/uploads/2022/08/rank-math-logo-square.png' },
  // { name: 'Smartlead', url: 'https://cdn.simpleicons.org/salesforce/00A1E0' }, // Placeholder using Salesforce blue as proxy for Smartlead style
  // { name: 'Klaviyo', url: 'https://cdn.simpleicons.org/klaviyo/25E7FA' },
  // { name: 'Clipchamp', url: 'https://cdn.simpleicons.org/clipchamp/3C1E96' }
];

const Hero: React.FC = () => {
  return (
    <section className="relative w-full min-h-screen bg-navy-black flex flex-col justify-between overflow-hidden pt-20 lg:pt-20 pb-0">
      {/* Ambient Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-royal-blue/15 rounded-full blur-[120px] opacity-50 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-navy-black to-transparent z-10" />

      <div className="relative z-20 w-full max-w-7xl mx-auto px-6 flex flex-col flex-grow justify-center">

        {/* 1. Header Section (Centered) */}
        <div className="text-center mb-8 lg:mb-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-4"
          >
            <span className="text-royal-blue font-heading font-bold tracking-[0.2em] uppercase text-xs md:text-sm">
              A Digital Revolution In India
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-heading font-bold text-white tracking-tighter leading-[1] mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-500"
          >
            The Future Belongs<br />
            to the Skilled.
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-xl md:text-3xl font-heading text-white font-medium tracking-tight"
          >
            2026... belongs to you.
          </motion.h2>
        </div>

        {/* 2. Split Content Section (Left: Text/CTA, Right: Video) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

          {/* Left Side: Copy & CTA */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="order-2 lg:order-1 lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left space-y-8"
          >
            <p className="text-sm md:text-base text-slate-400 font-light leading-relaxed max-w-lg">
              Introducing <strong>Digital Madrasa</strong> — an EdTech platform designed to transform beginners into global freelancers ready for real clients, real projects in 90 days.
            </p>

            {/* Features List */}
            <div className="flex flex-col gap-3 text-sm md:text-base text-slate-500 font-medium">
              <span className="flex items-center gap-2 justify-center lg:justify-start"><ChevronRight size={18} className="text-royal-blue" /> One platform</span>
              <span className="flex items-center gap-2 justify-center lg:justify-start"><ChevronRight size={18} className="text-royal-blue" /> Five powerful skills</span>
              <span className="flex items-center gap-2 justify-center lg:justify-start"><ChevronRight size={18} className="text-royal-blue" /> Endless opportunities</span>
            </div>

            {/* DESKTOP CTA (Hidden on Mobile) */}
            <div className="hidden lg:flex flex-col gap-4 items-center lg:items-start w-full">
              <Link href="/enroll/1" className="w-full sm:w-auto group relative px-8 py-5 bg-royal-blue text-white rounded-full font-semibold text-lg overflow-hidden transition-all hover:scale-105 shadow-[0_0_40px_-10px_rgba(0,86,255,0.5)] inline-flex">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite]" />
                <span className="flex items-center justify-center gap-2 w-full">
                  Enroll Now – Launch Offer <ArrowRight size={20} />
                </span>
              </Link>
              <p className="text-sm text-slate-400 font-medium">
                Trusted Tools Used by Industry Experts You Will Discover Inside DM
              </p>
            </div>
          </motion.div>

          {/* Right Side: VSL Video */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="order-1 lg:order-2 lg:col-span-7 w-full"
          >
            <div className="relative aspect-video w-full max-w-2xl mx-auto bg-slate-900 rounded-2xl overflow-hidden shadow-[0_0_60px_-15px_rgba(0,86,255,0.2)] border border-white/10 group cursor-pointer transition-all hover:shadow-[0_0_80px_-20px_rgba(0,86,255,0.4)] mb-4">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1600&auto=format&fit=crop"
                alt="Digital Madrasa Intro"
                className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-500"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-royal-blue/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300 border border-white/20">
                  <Play className="w-8 h-8 md:w-10 md:h-10 text-white fill-white ml-1" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/90 to-transparent text-left">
                <p className="text-white font-bold text-lg md:text-xl">Watch the Manifesto</p>
                <p className="text-slate-400 text-sm">See how we are changing education in India.</p>
              </div>
            </div>

            {/* MOBILE CTA (Visible only on Mobile, immediately under video) */}
            <div className="flex lg:hidden flex-col gap-4 items-center w-full mt-2">
              <Link href="/enroll/1" className="w-full group relative px-8 py-5 bg-royal-blue text-white rounded-full font-semibold text-lg overflow-hidden transition-all shadow-[0_0_40px_-10px_rgba(0,86,255,0.5)] block text-center">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite]" />
                <span className="flex items-center justify-center gap-2">
                  Enroll Now – Launch Offer <ArrowRight size={20} />
                </span>
              </Link>
              {/* Removed the text from here */}
            </div>

          </motion.div>
        </div>
      </div>

      {/* Mobile Only Text before Marquee */}
      <div className="block lg:hidden text-center mt-6 mb-2 px-6 relative z-20">
        <p className="text-sm text-slate-400 font-medium">
          Trusted Tools Used by Industry Experts You Will Discover Inside DM
        </p>
      </div>

      {/* --- TOOLS MARQUEE SECTION --- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.8 }}
        className="w-full relative overflow-hidden mt-4 lg:mt-8 mb-4 border-t border-white/5 bg-white/5 backdrop-blur-sm"
      >
        {/* Fade Masks */}
        <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-navy-black to-transparent z-10"></div>
        <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-navy-black to-transparent z-10"></div>

        {/* Scrolling Content */}
        <div className="flex w-max animate-marquee hover:[animation-play-state:paused] py-4">
          {/* First Set */}
          <div className="flex items-center gap-12 pr-12">
            {tools.map((tool, i) => (
              <div key={i} className="flex flex-col items-center gap-3 opacity-90 hover:opacity-100 transition-all duration-300 transform hover:scale-110 cursor-pointer group">
                <div className="w-20 h-20 flex items-center justify-center bg-white/5 rounded-2xl p-4 backdrop-blur-sm border border-white/10 shadow-lg group-hover:border-white/20 group-hover:bg-white/10">
                  <img
                    src={tool.url}
                    alt={tool.name}
                    className="w-full h-full object-contain"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const container = target.closest('.group');
                      if (container) {
                        (container as HTMLElement).style.display = 'none';
                      }
                    }}
                  />
                </div>
                <span className="text-white/60 text-xs font-medium group-hover:text-white transition-colors">{tool.name}</span>
              </div>
            ))}
          </div>
          {/* Duplicate Set for loop */}
          <div className="flex items-center gap-12 pr-12">
            {tools.map((tool, i) => (
              <div key={`dup-${i}`} className="flex flex-col items-center gap-3 opacity-90 hover:opacity-100 transition-all duration-300 transform hover:scale-110 cursor-pointer group">
                <div className="w-20 h-20 flex items-center justify-center bg-white/5 rounded-2xl p-4 backdrop-blur-sm border border-white/10 shadow-lg group-hover:border-white/20 group-hover:bg-white/10">
                  <img
                    src={tool.url}
                    alt={tool.name}
                    className="w-full h-full object-contain"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const container = target.closest('.group');
                      if (container) {
                        (container as HTMLElement).style.display = 'none';
                      }
                    }}
                  />
                </div>
                <span className="text-white/60 text-xs font-medium group-hover:text-white transition-colors">{tool.name}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;
