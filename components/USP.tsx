
'use client';

import Link from 'next/link';
import { Zap, Target, CheckCircle2, XCircle, Rocket, Star } from 'lucide-react';
import { apiClient } from '../lib/api-client';

import React, { useState, useEffect } from 'react';

// --- Real AI Brand Logos (SVG Paths with Brand Colors) ---

const OpenAILogo = (props: React.SVGProps<SVGSVGElement>) => (
   <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M22.28 9.82a5.98 5.98 0 0 0-.51-4.91 6.05 6.05 0 0 0-6.51-2.9A6.06 6.06 0 0 0 4.98 4.18a5.98 5.98 0 0 0-4 2.9 6.05 6.05 0 0 0 .74 7.1 5.98 5.98 0 0 0 .51 4.91 6.05 6.05 0 0 0 6.51 2.9 5.98 5.98 0 0 0 8.52-2.1 6.05 6.05 0 0 0 5.77-4.2 5.99 5.99 0 0 0-3.99-2.9 6.06 6.06 0 0 0-.75-7.07zm-9.02 12.6a4.48 4.48 0 0 1-2.88-1.04l.14-.08 4.78-2.76a.8.8 0 0 0 .39-.68v-6.74l2.02 1.17a1.54 1.54 0 0 0 .04-.1v6.19a4.56 4.56 0 0 1-4.49 4.04zm-7.34-6.29a4.54 4.54 0 0 1 .55-4.17l1.93 1.11v6.8a.8.8 0 0 0 .4.68l4.74 2.74a4.49 4.49 0 0 1-4.67-.44l-.05-.02-2.9-1.67v-5.03zm-1.01-7.42l1.98 1.14a4.5 4.5 0 0 1 3.72-.86l-.15.08-4.77 2.75a.8.8 0 0 0-.39.68v6.74l-2.03-1.17a1.54 1.54 0 0 0-.04.1V8.51a4.56 4.56 0 0 1 1.68-3.79zm9.1-1.5c.31.12.62.27.9.46L13 8.79V2a.8.8 0 0 0-.4-.69L7.85 4.56a4.49 4.49 0 0 1 4.7.44l.04.02 2.9 1.68V1.21zm7.34 6.29a4.55 4.55 0 0 1-.55 4.17l-1.93-1.11v-6.8a.8.8 0 0 0-.4-.68L17 3.54a4.49 4.49 0 0 1 4.68.44l.04.02 2.9 1.68v5.02zM9.4 12l2.6 1.5 2.6-1.5V9l-2.6-1.5L9.4 10.5z" fill="#10a37f" />
   </svg>
);

const GeminiLogo = (props: React.SVGProps<SVGSVGElement>) => (
   <svg viewBox="0 0 24 24" fill="none" {...props}>
      <defs>
         <linearGradient id="gemini_gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#4E75F0" />
            <stop offset="1" stopColor="#C658DE" />
         </linearGradient>
      </defs>
      <path d="M12 2L14.12 9.88L22 12L14.12 14.12L12 22L9.88 14.12L2 12L9.88 9.88L12 2Z" fill="url(#gemini_gradient)" />
   </svg>
);

const MidjourneyLogo = (props: React.SVGProps<SVGSVGElement>) => (
   <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12.6 2C13.9 2 15 3.1 15 4.4V19.6C15 20.9 13.9 22 12.6 22H11.4C10.1 22 9 20.9 9 19.6V4.4C9 3.1 10.1 2 11.4 2H12.6ZM18.6 7.8C19.5 7.8 20.2 8.5 20.2 9.4V14.6C20.2 15.5 19.5 16.2 18.6 16.2H17.4C16.5 16.2 15.8 15.5 15.8 14.6V9.4C15.8 8.5 16.5 7.8 17.4 7.8H18.6ZM5.4 7.8C6.3 7.8 7 8.5 7 9.4V14.6C7 15.5 6.3 16.2 5.4 16.2H4.2C3.3 16.2 2.6 15.5 2.6 14.6V9.4C2.6 8.5 3.3 7.8 4.2 7.8H5.4Z" fill="white" />
   </svg>
);

const ClaudeLogo = (props: React.SVGProps<SVGSVGElement>) => (
   <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M18 3H6C4.34 3 3 4.34 3 6v12c0 1.66 1.34 3 3 3h12c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3zm-6 13h-2v-2h2v2zm0-4h-2V8h2v4z" fill="#D97757" />
   </svg>
);

const NotionLogo = (props: React.SVGProps<SVGSVGElement>) => (
   <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M4.3 20.9l-.1.1h-.2l.1-.3 5.6-17 .1-.1h2.7l-.1.1-1.6 4.6 5.6-4.4.1-.1h2.8l-.1.3-6.1 17.9-.1.1H10l.1-.1 1.7-5-5.9 2.9-.1.1H4.3z" fill="white" />
   </svg>
);

const JasperLogo = (props: React.SVGProps<SVGSVGElement>) => (
   <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10zm0-18c4.41 0 8 3.59 8 8s-3.59 8-8 8-8-3.59-8-8 3.59-8 8-8zm-1 4h2v5h-2zm0 7h2v2h-2z" fill="#9F7AEA" />
   </svg>
);

const GithubLogo = (props: React.SVGProps<SVGSVGElement>) => (
   <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" fill="white" />
   </svg>
);

const CanvaLogo = (props: React.SVGProps<SVGSVGElement>) => (
   <svg viewBox="0 0 24 24" fill="none" {...props}>
      <defs>
         <linearGradient id="canva_gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00C4CC" />
            <stop offset="1" stopColor="#7D2AE8" />
         </linearGradient>
      </defs>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5.67 1.5 1.5S16.33 14 15.5 14 14 13.33 14 12.5 14.67 11 15.5 11zm-7 0c.83 0 1.5.67 1.5 1.5S9.33 14 8.5 14 7 13.33 7 12.5 7.67 11 8.5 11z" fill="url(#canva_gradient)" />
   </svg>
);

const AdobeLogo = (props: React.SVGProps<SVGSVGElement>) => (
   <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M15.1 2H24v20L15.1 2zM8.9 2H0v20L8.9 2zM12 9.4L17.6 22h-3.8l-1.6-4H8.1L12 9.4z" fill="#FF0000" />
   </svg>
);

const PerplexityLogo = (props: React.SVGProps<SVGSVGElement>) => (
   <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12 4.5L14 9l4.5 2-4.5 2L12 17.5 10 13l-4.5-2 4.5-2L12 4.5zM12 2L9 9 2 12l7 3 3 7 3-7 7-3-7-3-3-7z" fill="#22bfa5" />
   </svg>
);

const StableDiffusionLogo = (props: React.SVGProps<SVGSVGElement>) => (
   <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8-8-3.6-8-8zm8-6c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6z" fill="#7c3aed" />
      <path d="M12 8l2 4h-4l2-4z" fill="#a78bfa" />
   </svg>
);

const RunwayLogo = (props: React.SVGProps<SVGSVGElement>) => (
   <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M6 4h5a5 5 0 0 1 0 10H8v6H6V4zm5 8a3 3 0 0 0 0-6H8v6h3z" fill="#FACC15" />
      <path d="M13.5 13l3 7h2.5l-3.3-7H13.5z" fill="#FACC15" />
   </svg>
);

const CopyAILogo = (props: React.SVGProps<SVGSVGElement>) => (
   <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M14 2H6C4.9 2 4 2.9 4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="#a3e635" />
   </svg>
);

const SynthesiaLogo = (props: React.SVGProps<SVGSVGElement>) => (
   <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" fill="#34d399" />
   </svg>
);

const DescriptLogo = (props: React.SVGProps<SVGSVGElement>) => (
   <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M5 4h7c3.31 0 6 2.69 6 6s-2.69 6-6 6H5V4zm7 10c2.21 0 4-1.79 4-4s-1.79-4-4-4H7v8h5z" fill="#3b82f6" />
   </svg>
);

// --- End Brand Logos ---

const LogoItem: React.FC<{ name: string; Icon: React.FC<React.SVGProps<SVGSVGElement>> }> = ({ name, Icon }) => (
   <div className="mx-10 flex items-center gap-3 transition-all duration-300 cursor-pointer group">
      <div className="h-8 w-8 relative flex-shrink-0">
         <Icon className="w-full h-full" />
      </div>
      <span className="text-xl font-bold font-sans text-white tracking-tight group-hover:text-white/90 select-none">{name}</span>
   </div>
);

// --- Review Component ---
const FeedbackCard: React.FC<{ takeaway: string; text: string; name: string; tag: string; avatar: string }> = ({ takeaway, text, name, tag, avatar }) => (
   <div className="bg-[#0f111a] border border-white/5 p-8 rounded-[2rem] flex flex-col justify-between h-full min-h-[400px] transition-all duration-500 hover:border-royalBlue/30 hover:shadow-2xl hover:shadow-royalBlue/10 group">
      <div>
         <div className="flex gap-1.5 mb-8">
            {[1, 2, 3, 4, 5].map((s) => (
               <Star key={s} size={16} className="fill-[#0056D2] text-[#0056D2]" />
            ))}
         </div>
         <h3 className="text-white font-bold text-xl md:text-2xl mb-4 leading-snug font-heading tracking-tight group-hover:text-[#0056D2] transition-colors duration-300">
            {takeaway}
         </h3>
         <p className="text-slate-400 text-base leading-relaxed mb-8 font-medium">
            {text}
         </p>
      </div>
      <div className="flex items-center gap-4 mt-auto">
         <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 shrink-0 ring-2 ring-transparent group-hover:ring-[#0056D2]/50 transition-all">
            <img src={avatar} alt={name} className="w-full h-full object-cover" />
         </div>
         <div>
            <h4 className="text-white font-bold text-base tracking-tight">{name}</h4>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{tag}</p>
         </div>
      </div>
   </div>
);

const USP: React.FC = () => {
   // State initialization moved above to handle feedbacks state
   // const [activeSlide, setActiveSlide] = useState(0); 
   // const [isPaused, setIsPaused] = useState(false);
   // const [isDesktop, setIsDesktop] = useState(true);

   useEffect(() => {
      const handleResize = () => setIsDesktop(window.innerWidth >= 768);

      if (typeof window !== 'undefined') {
         handleResize();
         window.addEventListener('resize', handleResize);
         return () => window.removeEventListener('resize', handleResize);
      }
   }, []);

   const aiTools = [
      { name: "ChatGPT", icon: OpenAILogo },
      { name: "Midjourney", icon: MidjourneyLogo },
      { name: "Claude", icon: ClaudeLogo },
      { name: "Gemini", icon: GeminiLogo },
      { name: "Jasper", icon: JasperLogo },
      { name: "Notion AI", icon: NotionLogo },
      { name: "Stable Diffusion", icon: StableDiffusionLogo },
      { name: "Runway", icon: RunwayLogo },
      { name: "GitHub Copilot", icon: GithubLogo },
      { name: "Canva Magic", icon: CanvaLogo },
      { name: "Adobe Firefly", icon: AdobeLogo },
      { name: "Perplexity", icon: PerplexityLogo },
      { name: "Synthesia", icon: SynthesiaLogo },
      { name: "Descript", icon: DescriptLogo },
      { name: "Copy.ai", icon: CopyAILogo }
   ];




   interface Testimonial {
      id: number;
      name: string;
      title?: string;
      designation?: string;
      testimony: string;
      rating?: number;
      profile_pic_url?: string;
      // ... other backend fields
   }

   const [activeSlide, setActiveSlide] = useState(0);
   const [isPaused, setIsPaused] = useState(false);
   const [isDesktop, setIsDesktop] = useState(true);
   const [feedbacks, setFeedbacks] = useState<any[]>([]); // Using any[] to match mapped format

   const staticStudentFeedback = [
      {
         takeaway: "Well-structured & practical learning.",
         text: "It has been a very good learning experience with Digital Madrasa. The course content is well-structured, practical, and easy to understand, even for beginners. The lessons are explained clearly and are very helpful for building strong design skills.",
         name: "Aisha Sami",
         tag: "Teacher from Uttar Pradesh",
         avatar: "https://i.pravatar.cc/150?u=aisha"
      },
      {
         takeaway: "Completely worth the investment.",
         text: "I was hesitating to join digital madrasa but now I think it's completely worth it. From skills to support everything is good. This is so helpful for beginners who wants to learn high income skills and no experience needed. 🩷 if you are a beginner and don't know which skill to learn then don't hesitate to join digital madrasa. It's completely worth.",
         name: "Sumaiyah Shaheen",
         tag: "College Student from Andhra Pradesh",
         avatar: "https://i.pravatar.cc/150?u=sumaiyah"
      },
      {
         takeaway: "Clear, motivating & respectful learning.",
         text: "Alhamdulillah, this DIGITAL MADRASA has been a great source of learning new technologies for me. The teaching style is clear and motivating, and the environment is respectful and Islamic. I am truly grateful for the knowledge I have gained here. May Allah grant barakah in their efforts.",
         name: "Tasneem Sultana",
         tag: "Housewife From Karnataka",
         avatar: "https://i.pravatar.cc/150?u=tasneem"
      }];

   useEffect(() => {
      const fetchTestimonials = async () => {
         try {
            const res = await apiClient.get<{ items: Testimonial[] }>('/testimonials?limit=9&featured=true');
            if (res.success && res.data?.items && res.data.items.length > 0) {
               const mapped = res.data.items.map((t: Testimonial) => {
                  // Derive takeaway: priority to title, else truncate testimony
                  let takeaway = t.title || "Student Success Story";
                  if (!t.title && t.testimony) {
                     const sentences = t.testimony.match(/[^\.!\?]+[\.!\?]+/g);
                     if (sentences && sentences.length > 0) {
                        takeaway = sentences[0].length > 60 ? sentences[0].substring(0, 57) + "..." : sentences[0];
                     } else {
                        takeaway = t.testimony.length > 60 ? t.testimony.substring(0, 57) + "..." : t.testimony;
                     }
                  }

                  return {
                     takeaway: takeaway,
                     text: t.testimony,
                     name: t.name,
                     tag: t.designation || "Verified Student", // Using designation from backend
                     avatar: t.profile_pic_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=random`
                  };
               });
               // Fill up to 3 minimum if needed, or just use what we have. 
               // If we have API data, use it. If very few, maybe mix? For now, replacing logic.
               setFeedbacks(mapped);
            } else {
               setFeedbacks(staticStudentFeedback);
            }
         } catch (error) {
            console.error("Failed to fetch testimonials", error);
            setFeedbacks(staticStudentFeedback);
         }
      };

      fetchTestimonials();
   }, []);

   const studentFeedback = feedbacks.length > 0 ? feedbacks : staticStudentFeedback;

   const totalDesktopPages = Math.ceil(studentFeedback.length / 3);
   const totalMobilePages = studentFeedback.length;

   useEffect(() => {
      if (isPaused) return;
      const interval = setInterval(() => {
         setActiveSlide((prev) => (prev + 1) % (isDesktop ? totalDesktopPages : totalMobilePages));
      }, 5000);
      return () => clearInterval(interval);
   }, [isPaused, isDesktop, totalDesktopPages, totalMobilePages]);


   return (
      <section className="bg-off-white">

         {/* AI Advantage Section */}
         <div className="py-24 bg-navy-black relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-royal-blue/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="max-w-7xl mx-auto px-6 relative z-10">
               <div className="text-center mb-16">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-royal-blue/20 border border-royal-blue/30 mb-4">
                     <Zap size={16} className="text-yellow-400 fill-yellow-400" />
                     <span className="text-royal-blue font-bold text-sm uppercase tracking-wider">The AI Advantage</span>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-snug">The Only Platform That Makes You<br />Skill-Ready + AI-Ready</h2>
                  <p className="text-slate-400 text-lg max-w-2xl mx-auto">Every skill includes dedicated AI modules so you become:</p>
               </div>

               <div className="grid md:grid-cols-3 gap-8 mb-20">
                  <div className="bg-white/5 border border-white/10 p-8 rounded-2xl text-center backdrop-blur-sm hover:bg-white/10 transition-colors">
                     <h3 className="text-2xl font-bold text-white mb-2">⚡ Skill Ready</h3>
                     <p className="text-slate-400">Master the core fundamentals.</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-8 rounded-2xl text-center backdrop-blur-sm hover:bg-white/10 transition-colors">
                     <h3 className="text-2xl font-bold text-white mb-2">⚡ AI Ready</h3>
                     <p className="text-slate-400">Leverage tools to work 3X faster.</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-8 rounded-2xl text-center backdrop-blur-sm hover:bg-white/10 transition-colors">
                     <h3 className="text-2xl font-bold text-white mb-2">⚡ Future Ready</h3>
                     <p className="text-slate-400">Prepare for the 2026 landscape.</p>
                  </div>
               </div>

               <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700 max-w-4xl mx-auto mb-24">
                  <h4 className="text-white font-bold mb-6 text-center text-lg">Learn how to use AI to:</h4>
                  <div className="flex flex-wrap justify-center gap-4 text-sm md:text-base">
                     {['Speed up workflow', 'Create better content', 'Build smarter strategies', 'Become 3X more productive', 'Outperform outdated freelancers'].map((item, i) => (
                        <span key={i} className="px-5 py-2.5 bg-navy-black rounded-lg text-slate-300 border border-slate-700 shadow-sm hover:border-royal-blue/50 transition-colors cursor-default">{item}</span>
                     ))}
                  </div>
               </div>
            </div>

            {/* Scrolling AI Logos */}
            <div className="w-full border-y border-white/5 bg-white/5 backdrop-blur-sm py-12 overflow-hidden">
               <p className="text-center text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mb-10">Master The Tools Shifting The World</p>

               <div className="relative flex overflow-hidden group">
                  <div className="flex animate-marquee whitespace-nowrap items-center">
                     {/* Set 1 */}
                     {aiTools.map((tool, index) => (
                        <LogoItem key={`a-${index}`} name={tool.name} Icon={tool.icon} />
                     ))}
                     {/* Set 2 for seamless loop */}
                     {aiTools.map((tool, index) => (
                        <LogoItem key={`b-${index}`} name={tool.name} Icon={tool.icon} />
                     ))}
                  </div>

                  {/* Gradient Overlays for Fade Effect */}
                  <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-navy-black to-transparent z-10"></div>
                  <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-navy-black to-transparent z-10"></div>
               </div>
            </div>
         </div>

         {/* Client Acquisition Section */}
         <div className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-6">
               <div className="grid md:grid-cols-2 gap-16 items-center">
                  <div>
                     <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 border border-green-200 mb-4">
                        <Target size={16} className="text-green-600" />
                        <span className="text-green-700 font-bold text-sm uppercase tracking-wider">The Game Changer</span>
                     </div>
                     <h2 className="text-4xl font-bold text-navy-black mb-6">The Client Acquisition Advantage</h2>
                     <h3 className="text-xl font-medium text-slate-500 mb-6">This is where most platforms fail. We don’t.</h3>
                     <p className="text-slate-600 text-lg mb-8">
                        Every skill includes a <strong>Client Acquisition Module</strong>. Because learning a skill is not enough. Learning how to earn with it — is everything.
                     </p>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {['Ready-to-use scripts', 'DM templates', 'Portfolio-building methods', 'International client strategies', 'Outreach formulas', 'Pricing systems', 'Closing high-paying clients'].map((item, i) => (
                           <div key={i} className="flex items-center gap-2">
                              <CheckCircle2 size={18} className="text-royal-blue shrink-0" />
                              <span className="text-slate-700 font-medium">{item}</span>
                           </div>
                        ))}
                     </div>
                  </div>
                  <div className="bg-off-white p-8 rounded-3xl border border-slate-100 shadow-lg relative">
                     {/* Abstract representation of success */}
                     <div className="space-y-4">
                        <div className="bg-white p-5 rounded-xl shadow-sm flex items-center justify-between border border-slate-100">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-lg">Up</div>
                              <div>
                                 <p className="font-bold text-navy-black text-base">Proposal Accepted</p>
                                 <p className="text-xs text-slate-500">International Client • Upwork</p>
                              </div>
                           </div>
                           <span className="text-green-600 font-bold text-lg">$1,200</span>
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm flex items-center justify-between opacity-75 border border-slate-100">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">Li</div>
                              <div>
                                 <p className="font-bold text-navy-black text-base">Inbound Lead</p>
                                 <p className="text-xs text-slate-500">LinkedIn Optimization</p>
                              </div>
                           </div>
                           <span className="text-slate-400 text-xs font-medium">Just now</span>
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm flex items-center justify-between opacity-50 border border-slate-100">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-lg">Em</div>
                              <div>
                                 <p className="font-bold text-navy-black text-base">Email Reply</p>
                                 <p className="text-xs text-slate-500">"Let's book a call"</p>
                              </div>
                           </div>
                           <span className="text-slate-400 text-xs font-medium">2 mins ago</span>
                        </div>
                     </div>
                     <div className="mt-10 text-center">
                        <Rocket size={48} className="mx-auto text-royal-blue mb-4" />
                        <p className="font-bold text-navy-black text-lg">We don't just teach.</p>
                        <p className="text-slate-500">We prepare you to compete — globally.</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>



         <div className="py-24 bg-[#05070a] border-t border-white/5 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
               <div className="text-center mb-16">
                  <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 font-heading tracking-tight leading-tight">What Early Students Are Saying</h2>
                  <p className="text-slate-500 text-sm md:text-base max-w-xl mx-auto tracking-wide">
                     Real feedback from learners who joined Digital Madrasa during launch.
                  </p>
               </div>

               <div
                  className="relative"
                  onMouseEnter={() => setIsPaused(true)}
                  onMouseLeave={() => setIsPaused(false)}
               >
                  {/* Desktop Carousel (3 at a time) */}
                  <div className="hidden md:grid grid-cols-3 gap-8">
                     {studentFeedback.slice(activeSlide * 3, (activeSlide * 3) + 3).map((feedback, idx) => (
                        <FeedbackCard key={idx} {...feedback} />
                     ))}
                  </div>

                  {/* Mobile Carousel (1 at a time) */}
                  <div className="md:hidden">
                     <FeedbackCard {...studentFeedback[activeSlide % studentFeedback.length]} />
                  </div>

                  {/* Pagination Dots */}
                  <div className="flex justify-center gap-2 mt-12">
                     {Array.from({ length: isDesktop ? totalDesktopPages : totalMobilePages }).map((_, i) => (
                        <button
                           key={i}
                           onClick={() => setActiveSlide(i)}
                           className={`h-2 rounded-full transition-all duration-300 ${activeSlide === i ? 'bg-[#0056D2] w-6' : 'bg-slate-800 w-2 hover:bg-slate-700'
                              }`}
                           aria-label={`Go to slide ${i + 1}`}
                        />
                     ))}
                  </div>
               </div>
            </div>
         </div>


         {/* Comparison Section */}
         <div className="py-24 bg-off-white border-t border-slate-200">
            <div className="max-w-5xl mx-auto px-6">
               <h2 className="text-3xl font-bold text-center text-navy-black mb-12">Digital Madrasa vs Outdated Platforms</h2>
               <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-xl bg-white mb-12">
                  <table className="w-full text-left border-collapse">
                     <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                           <th className="p-6 text-slate-500 font-medium w-1/2 uppercase tracking-wider text-sm">Old Platforms</th>
                           <th className="p-6 text-royal-blue font-bold w-1/2 bg-blue-50/50 uppercase tracking-wider text-sm">Digital Madrasa</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {[
                           { old: "Outdated 2018 videos", new: "Fresh 2026 content" },
                           { old: "Lifetime access (but useless)", new: "1 Year Access with continuous updates" },
                           { old: "No AI training", new: "AI + Skill combo" },
                           { old: "Theory-heavy", new: "Real-world practical training" },
                           { old: "No client acquisition", new: "Dedicated earning module" },
                           { old: "Random mentors", new: "Verified global experts" },
                        ].map((row, i) => (
                           <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="p-6 flex items-start gap-3 text-slate-500 group-hover:text-slate-700 transition-colors">
                                 <XCircle size={20} className="text-red-400 shrink-0 mt-0.5" /> {row.old}
                              </td>
                              <td className="p-6 text-navy-black font-medium bg-blue-50/10 border-l border-slate-100">
                                 <div className="flex items-start gap-3">
                                    <CheckCircle2 size={20} className="text-royal-blue shrink-0 mt-0.5" /> {row.new}
                                 </div>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>

               <div className="flex justify-center">
                  <Link href="/enroll/1" className="bg-royal-blue hover:bg-blue-600 text-white px-10 py-4 rounded-full font-bold text-lg shadow-xl shadow-blue-500/30 transition-all transform hover:scale-105 inline-block">
                     Give Me Access Now
                  </Link>
               </div>
            </div>
         </div>

      </section>
   );
};

export default USP;
