
import React from 'react';
import Link from 'next/link';
import { Zap, Target, CheckCircle2, XCircle, Rocket } from 'lucide-react';

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

const USP: React.FC = () => {
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
