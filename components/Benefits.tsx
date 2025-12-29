
import React from 'react';
import { Check, Globe, Layers, Gift, Star, PlayCircle, FileText, Users, ArrowRight, Mail, Target } from 'lucide-react';

const Benefits: React.FC = () => {
   return (
      <section id="benefits" className="py-24 bg-navy-black text-white overflow-hidden relative">
         {/* Background Shine */}
         <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-royal-blue/10 rounded-full blur-[120px]"></div>
         </div>

         <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-royal-blue mb-8 shadow-[0_0_30px_-5px_rgba(0,86,255,0.6)]">
               <Globe size={32} className="text-white" />
            </div>

            <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tight">One Enrollment → Access Everything</h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-24">
               Your enrollment unlocks all current 5 skills PLUS all future skills coming soon. No extra payment. No hidden fees. No upsells.
            </p>

            {/* 3D Mockup Display Area */}
            <div className="relative w-full max-w-6xl mx-auto h-[600px] md:h-[700px] mb-20 flex justify-center items-center perspective-1000 group">

               {/* Central "Hub" Screen */}
               <div className="absolute z-30 w-[320px] md:w-[550px] aspect-video bg-white rounded-2xl shadow-[0_0_60px_-15px_rgba(255,255,255,0.3)] border-4 border-slate-800 flex flex-col items-center justify-center p-8 transform transition-transform duration-500 hover:scale-105">
                  <div className="text-navy-black font-extrabold text-3xl md:text-5xl mb-3 tracking-tight">DIGITAL MADRASA</div>
                  <div className="text-royal-blue font-bold tracking-[0.2em] uppercase text-sm md:text-base border-b-2 border-royal-blue/20 pb-1">All Access Pass</div>
                  <div className="mt-8 flex gap-6">
                     <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shadow-sm"><PlayCircle className="text-navy-black w-8 h-8" /></div>
                     <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shadow-sm"><Star className="text-navy-black w-8 h-8" /></div>
                     <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shadow-sm"><Users className="text-navy-black w-8 h-8" /></div>
                  </div>
                  <div className="mt-8 px-6 py-2 bg-green-100 text-green-700 rounded-full text-sm font-bold flex items-center gap-2">
                     <Check size={16} /> Status: Active
                  </div>
               </div>

               {/* Floating Course Cards */}

               {/* Top Left: Content Creation */}
               <div className="absolute z-20 left-0 md:left-[5%] top-[2%] md:top-[5%] w-48 md:w-64 aspect-[4/3] bg-gradient-to-br from-purple-600 to-indigo-800 rounded-xl shadow-2xl border border-white/30 transform -rotate-12 hover:rotate-0 hover:z-40 hover:scale-110 transition-all duration-300 flex flex-col justify-end p-5 group/card cursor-pointer">
                  <div className="absolute top-4 right-4 bg-white/20 p-2 rounded-lg backdrop-blur-md"><PlayCircle size={20} className="text-white" /></div>
                  <span className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1">Skill 01</span>
                  <span className="text-white font-bold text-xl md:text-2xl leading-tight">Content Creation</span>
               </div>

               {/* Middle Left: Client Acquisition */}
               <div className="absolute z-20 left-[-2%] md:left-[1%] top-[50%] -translate-y-1/2 w-48 md:w-64 aspect-[4/3] bg-gradient-to-br from-emerald-600 to-green-800 rounded-xl shadow-2xl border border-white/30 transform -rotate-2 hover:rotate-0 hover:z-40 hover:scale-110 transition-all duration-300 flex flex-col justify-end p-5 group/card cursor-pointer">
                  <div className="absolute top-4 right-4 bg-white/20 p-2 rounded-lg backdrop-blur-md"><Target size={20} className="text-white" /></div>
                  <span className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1">In Every Skill</span>
                  <span className="text-white font-bold text-xl md:text-2xl leading-tight">Client Acquisition</span>
               </div>

               {/* Bottom Left: YouTube */}
               <div className="absolute z-20 left-[5%] md:left-[2%] bottom-[2%] md:bottom-[5%] w-48 md:w-64 aspect-[4/3] bg-gradient-to-br from-red-600 to-rose-800 rounded-xl shadow-2xl border border-white/30 transform -rotate-6 hover:rotate-0 hover:z-40 hover:scale-110 transition-all duration-300 flex flex-col justify-end p-5 group/card cursor-pointer">
                  <div className="absolute top-4 right-4 bg-white/20 p-2 rounded-lg backdrop-blur-md"><PlayCircle size={20} className="text-white" /></div>
                  <span className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1">Skill 02</span>
                  <span className="text-white font-bold text-xl md:text-2xl leading-tight">YouTube Thumbnails</span>
               </div>

               {/* Bottom Center-Left: Resources */}
               <div className="absolute z-10 left-[25%] md:left-[22%] bottom-[-5%] md:bottom-[0%] w-40 md:w-52 aspect-[3/4] bg-white text-navy-black rounded-xl shadow-2xl border-2 border-slate-200 transform rotate-3 hover:rotate-0 hover:z-40 hover:scale-110 transition-all duration-300 flex flex-col items-center justify-center p-5 text-center cursor-pointer overflow-hidden">
                  <div className="absolute top-3 left-3 bg-royal-blue text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider z-20">FREE</div>
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3 text-royal-blue"><FileText size={24} /></div>
                  <span className="font-bold text-lg leading-tight mb-2">Cheatsheets & Templates</span>
                  <span className="text-xs text-slate-400 font-medium">Downloadable PDF Resources</span>
               </div>

               {/* Top Right: Social Media */}
               <div className="absolute z-20 right-0 md:right-[5%] top-[2%] md:top-[5%] w-48 md:w-64 aspect-[4/3] bg-gradient-to-br from-blue-600 to-cyan-700 rounded-xl shadow-2xl border border-white/30 transform rotate-12 hover:rotate-0 hover:z-40 hover:scale-110 transition-all duration-300 flex flex-col justify-end p-5 group/card cursor-pointer">
                  <div className="absolute top-4 right-4 bg-white/20 p-2 rounded-lg backdrop-blur-md"><PlayCircle size={20} className="text-white" /></div>
                  <span className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1">Skill 03</span>
                  <span className="text-white font-bold text-xl md:text-2xl leading-tight">Social Media Manager</span>
               </div>

               {/* Middle Right: Email Boss */}
               <div className="absolute z-20 right-[-2%] md:right-[1%] top-[50%] -translate-y-1/2 w-48 md:w-64 aspect-[4/3] bg-gradient-to-br from-amber-500 to-orange-700 rounded-xl shadow-2xl border border-white/30 transform rotate-2 hover:rotate-0 hover:z-40 hover:scale-110 transition-all duration-300 flex flex-col justify-end p-5 group/card cursor-pointer">
                  <div className="absolute top-4 right-4 bg-white/20 p-2 rounded-lg backdrop-blur-md"><Mail size={20} className="text-white" /></div>
                  <span className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1">Skill 05</span>
                  <span className="text-white font-bold text-xl md:text-2xl leading-tight">Email Boss</span>
               </div>

               {/* Bottom Right: WordPress */}
               <div className="absolute z-20 right-[5%] md:right-[2%] bottom-[2%] md:bottom-[5%] w-48 md:w-64 aspect-[4/3] bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl shadow-2xl border border-white/30 transform rotate-6 hover:rotate-0 hover:z-40 hover:scale-110 transition-all duration-300 flex flex-col justify-end p-5 group/card cursor-pointer">
                  <div className="absolute top-4 right-4 bg-white/20 p-2 rounded-lg backdrop-blur-md"><PlayCircle size={20} className="text-white" /></div>
                  <span className="text-white/80 text-xs font-bold uppercase tracking-wider mb-1">Skill 04</span>
                  <span className="text-white font-bold text-xl md:text-2xl leading-tight">WordPress Dev</span>
               </div>

               {/* Top Center-Right: AI Bonus */}
               <div className="absolute z-10 right-[25%] md:right-[22%] top-[-2%] md:top-[0%] w-40 md:w-52 aspect-[3/4] bg-amber-500 text-white rounded-xl shadow-2xl border border-white/30 transform -rotate-3 hover:rotate-0 hover:z-40 hover:scale-110 transition-all duration-300 flex flex-col items-center justify-center p-5 text-center cursor-pointer overflow-hidden">
                  <div className="absolute top-3 left-3 bg-white text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider z-20 shadow-sm">FREE</div>
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3 text-white"><Star size={24} /></div>
                  <span className="font-bold text-lg leading-tight mb-2">Bonus AI Modules</span>
                  <span className="text-xs text-white/80 font-medium">Included with every skill</span>
               </div>

               {/* Decorative elements */}
               <div className="absolute top-10 left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
               <div className="absolute bottom-10 right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

            </div>

            {/* Feature Lists */}
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto text-left relative z-30">
               <div className="bg-white/5 border border-white/10 p-8 md:p-10 rounded-3xl backdrop-blur-sm hover:bg-white/10 transition-colors">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                     <Layers className="text-royal-blue" /> Current Access
                  </h3>
                  <ul className="space-y-4">
                     {['All 5 Launch Skills', 'Client Acquisition Modules', 'AI Integration Training', 'International Mentor Support', '1 Year Continuous Updates'].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-slate-300 font-medium text-lg">
                           <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                              <Check size={14} className="text-green-400" />
                           </div>
                           {item}
                        </li>
                     ))}
                  </ul>
               </div>

               <div className="bg-gradient-to-br from-royal-blue/20 to-white/5 border border-white/10 p-8 md:p-10 rounded-3xl backdrop-blur-sm relative overflow-hidden hover:border-royal-blue/40 transition-colors group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                     <Gift size={120} />
                  </div>
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                     <Gift className="text-blue-400" /> Future Skills (Free)
                  </h3>
                  <p className="text-base text-slate-400 mb-6">Coming soon to your dashboard at no extra cost:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                     {['Copywriting', 'Video Editing', 'Figma Design', 'Graphic Design', 'Personal Branding'].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-white font-medium bg-white/10 px-4 py-3 rounded-xl hover:bg-white/20 transition-colors border border-white/5">
                           <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></span> {item}
                        </div>
                     ))}
                  </div>
                  <div className="mt-auto pt-6 border-t border-white/10 text-center">
                     <div className="inline-flex items-center gap-2 text-blue-400 font-bold text-sm uppercase tracking-widest bg-blue-500/10 px-4 py-2 rounded-full">
                        Real Value Locked In <ArrowRight size={14} />
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>
   );
};

export default Benefits;
