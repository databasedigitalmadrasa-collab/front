
import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
   Heart,
   ArrowRight,
   Laptop,
   Plane,
   Coffee,
   Zap,
   CheckCircle2,
   Mic2,
   MousePointer2,
   Sparkles,
   Users,
   Compass
} from 'lucide-react';

const AboutPage: React.FC = () => {
   const fadeInUp = {
      initial: { opacity: 0, y: 20 },
      whileInView: { opacity: 1, y: 0 },
      viewport: { once: true, margin: "-100px" },
      transition: { duration: 0.6, ease: "easeOut" }
   };

   const staggerContainer = {
      initial: { opacity: 0 },
      whileInView: { opacity: 1 },
      viewport: { once: true },
      transition: { staggerChildren: 0.2 }
   };

   const cardVariants = {
      initial: { opacity: 0, y: 30 },
      whileInView: { opacity: 1, y: 0 },
      transition: { duration: 0.5, ease: "backOut" }
   };

   return (
      <div className="bg-white text-navy-black overflow-x-hidden pt-20 selection:bg-royal-blue selection:text-white">

         {/* 1. THE HOOK - MINIMALIST HERO */}
         <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-6 bg-navy-black overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
               <div className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-royal-blue rounded-full blur-[160px]"></div>
            </div>

            <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ duration: 1.2 }}
               className="relative z-10 max-w-4xl mx-auto"
            >
               <h1 className="text-4xl md:text-7xl font-bold text-white mb-8 leading-tight tracking-tight">
                  It Didn’t Start With a <span className="text-royal-blue">Startup</span>.<br />
                  It Started With a <span className="italic font-serif text-slate-300">Feeling</span>.
               </h1>
               <p className="text-lg md:text-2xl text-slate-400 font-light leading-relaxed mb-12">
                  Scroll for a moment. Because this story might feel familiar.
               </p>
               <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="flex flex-col items-center gap-3 text-slate-600"
               >
                  <MousePointer2 size={20} />
                  <span className="text-[10px] uppercase tracking-[0.4em]">Read the journey</span>
               </motion.div>
            </motion.div>
         </section>

         {/* NARRATIVE CONTAINER */}
         <div className="max-w-5xl mx-auto px-6 py-24 space-y-32">

            {/* 2. ALWAYS LOVED TEACHING + FOUNDER IMAGE */}
            <motion.section {...fadeInUp} className="grid md:grid-cols-2 gap-12 items-center">
               <div className="space-y-8 order-2 md:order-1">
                  <div className="flex items-center gap-4 mb-4">
                     <div className="w-12 h-px bg-royal-blue"></div>
                     <span className="text-royal-blue font-bold text-xs uppercase tracking-widest">The Beginning</span>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-navy-black leading-tight">I’ve Always Loved Teaching.</h2>
                  <div className="space-y-6 text-lg md:text-xl text-slate-600 leading-relaxed font-normal">
                     <p>My name is <span className="text-navy-black font-semibold underline decoration-royal-blue/30 underline-offset-4">Tipu Khan</span>, and I’m from India.</p>
                     <p>Even back in college, I was never the quiet one in the classroom. I loved standing up, explaining ideas, and giving presentations.</p>
                     <p>Teaching didn’t feel like a task. <span className="text-navy-black italic">It felt natural.</span></p>
                     <p>At the same time, I was deeply curious about content creation. I created short ads. I made a short film for a college competition. That film was even awarded by the authorities.</p>
                     <p className="text-navy-black font-medium bg-royal-blue/5 p-4 rounded-xl border-l-4 border-royal-blue">
                        Without realizing it, I was already building the foundation of my future.
                     </p>
                  </div>
               </div>

               <div className="relative order-1 md:order-2">
                  <div className="absolute -inset-4 bg-royal-blue/5 rounded-[2.5rem] rotate-3"></div>
                  <div className="relative aspect-[3/4] rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white bg-slate-100">
                     <img
                        src="https://cdn.digitalmadrasa.co.in/site-content/founder.png"
                        alt="Tipu Khan - Founder"
                        className="w-full h-full object-cover"
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-navy-black/60 via-transparent to-transparent"></div>
                     <div className="absolute bottom-6 left-6 text-white">
                        <div className="flex items-center gap-2 mb-1">
                           <Mic2 size={16} className="text-royal-blue" />
                           <span className="text-[10px] uppercase tracking-widest font-bold">Inspiration Speaker</span>
                        </div>
                        <p className="text-xl font-bold">Tipu Khan</p>
                        <p className="text-xs text-slate-300">Founder, Digital Madrasa</p>
                     </div>
                  </div>
               </div>
            </motion.section>

            {/* 3. CONTENT AS LANGUAGE (Centered for readability) */}
            <motion.section {...fadeInUp} className="max-w-3xl mx-auto space-y-8">
               <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-navy-black">Content Became My Language.</h2>
               <div className="space-y-6 text-lg md:text-xl text-slate-600 leading-relaxed">
                  <p>Over the years, that curiosity turned into experience. I now have <span className="text-navy-black font-bold">8+ years</span> of content creation experience.</p>
                  <p>For the last 4 years, I’ve consistently created content on social media—learning what works, what doesn’t, and how digital platforms really function.</p>
                  <p>It wasn’t overnight success. It was trial, error, and relentless learning. But the biggest turning point was yet to come.</p>
               </div>
            </motion.section>
         </div>

         {/* 4. THE CINEMATIC MOMENT - DUBAI AIRPORT */}
         <section className="relative py-32 bg-navy-black text-white overflow-hidden">
            <div className="max-w-4xl mx-auto px-6 relative z-10">
               <motion.div {...fadeInUp} className="text-center space-y-10">
                  <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-royal-blue text-xs font-bold uppercase tracking-widest">
                     <Plane size={16} /> 2023: The Turning Point
                  </div>
                  <h2 className="text-4xl md:text-7xl font-bold tracking-tighter leading-none italic font-serif">
                     2023. Dubai Airport.<br />
                     <span className="text-royal-blue">One Moment Changed Everything.</span>
                  </h2>

                  <div className="text-left space-y-8 max-w-2xl mx-auto pt-10 border-t border-white/10">
                     <p className="text-xl md:text-2xl text-slate-300 font-light leading-relaxed">
                        I resigned from a toxic job in Dubai. I was exhausted. Mentally drained. Questioning everything.
                     </p>
                     <p className="text-xl md:text-2xl text-slate-300 font-light leading-relaxed">
                        While returning to India, I stopped at a café inside Dubai Airport. That’s when I saw him.
                     </p>

                     <div className="p-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm group hover:border-royal-blue/50 transition-colors">
                        <div className="flex gap-6 items-start mb-6">
                           <div className="w-12 h-12 rounded-full bg-royal-blue/20 flex items-center justify-center text-royal-blue shrink-0">
                              <Laptop size={24} />
                           </div>
                           <p className="text-xl md:text-2xl text-white font-medium italic">
                              "A guy sitting alone with his laptop. Calm. Focused. Free. He was editing a video—most likely using DaVinci Resolve—for a client."
                           </p>
                        </div>
                        <p className="text-slate-400 text-lg ml-12 border-l border-white/10 pl-6">
                           No boss. No office. No pressure. Just <span className="text-white font-bold">skill + laptop + freedom.</span>
                        </p>
                     </div>

                     <h3 className="text-3xl md:text-5xl font-bold text-center pt-8 tracking-tight">
                        “This is the life I want.”
                     </h3>
                  </div>
               </motion.div>
            </div>
         </section>

         {/* NARRATIVE CONTINUES */}
         <div className="max-w-3xl mx-auto px-6 py-32 space-y-32">

            {/* 5. THE MANIFESTO */}
            <motion.section {...fadeInUp} className="space-y-8">
               <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-navy-black leading-tight">Not a Corporate Slave.<br /><span className="text-royal-blue">A Free Digital Professional.</span></h2>
               <div className="space-y-6 text-lg md:text-xl text-slate-600 leading-relaxed">
                  <p>That single moment changed how I looked at work forever. I didn’t want a life tied to a cubicle. I didn’t want to trade freedom for a paycheck.</p>
                  <div className="bg-off-white p-8 rounded-3xl space-y-4 border border-slate-100">
                     <p className="font-bold text-navy-black uppercase tracking-widest text-sm mb-4">I Wanted:</p>
                     <div className="flex items-center gap-4 text-navy-black font-medium">
                        <CheckCircle2 size={20} className="text-royal-blue" /> Freedom to work from anywhere
                     </div>
                     <div className="flex items-center gap-4 text-navy-black font-medium">
                        <CheckCircle2 size={20} className="text-royal-blue" /> Freedom to choose my clients
                     </div>
                     <div className="flex items-center gap-4 text-navy-black font-medium">
                        <CheckCircle2 size={20} className="text-royal-blue" /> Freedom to build something meaningful
                     </div>
                  </div>
                  <p>So when I returned to India, I made a decision. I would learn everything about freelancing and digital skills—properly, practically, and globally.</p>
               </div>
            </motion.section>

            {/* 6. THE STRUGGLE */}
            <motion.section {...fadeInUp} className="space-y-8">
               <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-navy-black">Two Years of Learning. Failing. Growing.</h2>
               <div className="space-y-6 text-lg md:text-xl text-slate-600 leading-relaxed">
                  <p>For the next two years, I worked relentlessly. I learned how freelancing actually works. How global clients think. Which skills pay. Which skills don’t.</p>
                  <p className="italic">I made mistakes—so you don’t have to. I struggled—so others can move faster.</p>
                  <p className="text-navy-black font-semibold text-2xl">And slowly, a vision became clear.</p>
               </div>
            </motion.section>

            {/* 7. THE BIRTH OF DM */}
            <motion.section {...fadeInUp} className="space-y-8 text-center bg-royal-blue text-white p-12 rounded-[3rem] shadow-2xl shadow-royal-blue/20 overflow-hidden relative group">
               <div className="absolute inset-0 bg-gradient-to-tr from-blue-700 via-royal-blue to-blue-500 opacity-90"></div>
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
               <div className="relative z-10 space-y-6">
                  <h2 className="text-3xl md:text-5xl font-bold tracking-tight">That Vision Became Digital Madrasa.</h2>
                  <div className="space-y-6 text-lg md:text-xl text-blue-50 leading-relaxed">
                     <p>Digital Madrasa was created with one clear purpose: <br /><strong>To help Indians learn real, high‑income skills and earn from anywhere in the world.</strong></p>
                     <div className="flex flex-wrap justify-center gap-4 pt-4 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">
                        <div className="px-6 py-3 border border-white/30 rounded-full bg-white/5 backdrop-blur-sm">No Theory</div>
                        <div className="px-6 py-3 border border-white/30 rounded-full bg-white/5 backdrop-blur-sm">No Fluff</div>
                        <div className="px-6 py-3 border border-white/30 rounded-full bg-white/5 backdrop-blur-sm">Real Earning</div>
                     </div>
                  </div>
               </div>
            </motion.section>

            {/* 8. AI INTEGRATION */}
            <motion.section {...fadeInUp} className="space-y-8">
               <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-navy-black">Why AI Is Inside Every Skill.</h2>
               <div className="space-y-6 text-lg md:text-xl text-slate-600 leading-relaxed">
                  <p>The world is changing fast. So I made sure Digital Madrasa stays ahead.</p>
                  <p>Every skill inside DM comes with a <span className="text-navy-black font-bold">Dedicated AI Module</span>, so students don’t just learn skills—they learn how to use AI with skills, exactly as the future demands.</p>
                  <blockquote className="text-2xl md:text-3xl font-serif italic text-navy-black border-l-8 border-royal-blue pl-8 py-2 bg-royal-blue/5 rounded-r-2xl">
                     "Because learning a skill is never an expense. It’s an investment in yourself."
                  </blockquote>
               </div>
            </motion.section>

            {/* 9. THE REVOLUTION - REDESIGNED */}
            <section className="pt-24 pb-12">
               <motion.div {...fadeInUp} className="text-center mb-16">
                  <span className="inline-block text-royal-blue font-bold tracking-[0.3em] uppercase text-xs mb-4">Our Commitment</span>
                  <h2 className="text-4xl md:text-7xl font-bold tracking-tighter text-navy-black mb-6 leading-[1.1]">
                     This is <span className="text-royal-blue">Bigger</span> <br className="hidden md:block" /> Than a Platform.
                  </h2>
                  <p className="text-lg md:text-xl text-slate-500 font-light max-w-xl mx-auto">
                     Digital Madrasa is a movement built for the next generation of global Indian talent.
                  </p>
               </motion.div>

               <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  whileInView="whileInView"
                  viewport={{ once: true }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24"
               >
                  {[
                     {
                        title: "Dreamers",
                        desc: "Who feel stuck in a system that doesn't value their potential.",
                        icon: <Compass className="text-royal-blue" size={28} />,
                        accent: "bg-blue-50"
                     },
                     {
                        title: "Learners",
                        desc: "Who want the freedom to work on their own terms, anywhere.",
                        icon: <Sparkles className="text-amber-500" size={28} />,
                        accent: "bg-amber-50"
                     },
                     {
                        title: "Indians",
                        desc: "Who know they deserve a global career without leaving home.",
                        icon: <Users className="text-emerald-500" size={28} />,
                        accent: "bg-emerald-50"
                     }
                  ].map((item, i) => (
                     <motion.div
                        key={i}
                        variants={cardVariants}
                        className="group relative p-10 bg-white rounded-[2.5rem] border border-slate-100 hover:border-royal-blue/20 transition-all duration-500 hover:shadow-2xl hover:shadow-royal-blue/5 overflow-hidden flex flex-col items-center text-center"
                     >
                        <div className={`w-16 h-16 rounded-2xl ${item.accent} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}>
                           {item.icon}
                        </div>
                        <h3 className="text-2xl font-bold text-navy-black mb-4">{item.title}</h3>
                        <p className="text-slate-500 leading-relaxed">{item.desc}</p>
                        <div className="mt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                           <div className="w-10 h-10 rounded-full bg-navy-black flex items-center justify-center text-white">
                              <ArrowRight size={18} />
                           </div>
                        </div>
                     </motion.div>
                  ))}
               </motion.div>

               <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="relative py-24 px-8 rounded-[4rem] bg-navy-black overflow-hidden text-center"
               >
                  {/* Background Graphics */}
                  <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                     <div className="absolute -top-24 -left-24 w-96 h-96 bg-royal-blue rounded-full blur-[100px]"></div>
                     <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-500 rounded-full blur-[100px]"></div>
                  </div>

                  <div className="relative z-10 max-w-4xl mx-auto space-y-12">
                     <p className="text-royal-blue font-bold tracking-[0.5em] uppercase text-sm">The Vision</p>
                     <h2 className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-none">
                        Digital India ka <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-royal-blue via-blue-400 to-indigo-400">
                           Digital Revolution.
                        </span>
                     </h2>

                     <div className="flex flex-col items-center gap-10 pt-10">
                        <div className="flex flex-col items-center gap-4">
                           <div className="w-24 h-24 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center shadow-2xl relative group cursor-pointer border border-white/10">
                              <div className="absolute inset-0 rounded-full bg-royal-blue/40 animate-ping group-hover:animate-none"></div>
                              <Heart className="text-red-500 fill-red-500 group-hover:scale-125 transition-transform duration-500" size={40} />
                           </div>
                           <p className="text-slate-400 font-medium text-lg italic tracking-wide">"Built with pure purpose by Tipu Khan"</p>
                        </div>

                        <div className="w-16 h-px bg-white/10"></div>
                        <p className="text-slate-500 font-bold tracking-[0.3em] uppercase text-[10px]">And this is only the beginning</p>
                     </div>
                  </div>
               </motion.div>
            </section>

         </div>

         {/* CALL TO ACTION FOOTER FOR ABOUT PAGE */}
         <section className="bg-off-white py-32 border-t border-slate-200">
            <div className="max-w-4xl mx-auto px-6 text-center space-y-12">
               <h2 className="text-4xl md:text-6xl font-bold text-navy-black tracking-tight">Ready to start your <br className="hidden md:block" /> own story?</h2>
               <p className="text-xl text-slate-500 font-light max-w-2xl mx-auto leading-relaxed">
                  Don't wait for the future. Create it. Join thousands of students already bridging the gap to a global career.
               </p>
               <div className="pt-4">
                  <Link
                     href="/enroll/1"
                     className="inline-flex items-center justify-center px-12 py-6 bg-royal-blue text-white rounded-full font-bold text-xl shadow-2xl shadow-royal-blue/40 hover:scale-105 hover:bg-blue-600 transition-all group"
                  >
                     Enroll Now <ArrowRight size={24} className="ml-4 group-hover:translate-x-2 transition-transform" />
                  </Link>
               </div>
            </div>
         </section>

      </div>
   );
};

export default AboutPage;
