import React from 'react';
import { Check, Award } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const Certificate: React.FC = () => {
   return (
      <section className="py-24 bg-navy-black text-white relative overflow-hidden">
         {/* Ambient Glows */}
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-royal-blue/10 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-royal-blue/10 rounded-full blur-[120px]"></div>
         </div>

         <div className="max-w-6xl mx-auto px-6 relative z-10 flex flex-col items-center text-center">

            {/* 1. Small Heading */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-royal-blue/10 border border-royal-blue/20 mb-6 backdrop-blur-md">
               <Award size={14} className="text-royal-blue" />
               <span className="text-royal-blue font-bold text-xs uppercase tracking-wider">Earn Your Professional Certificate</span>
            </div>

            {/* 2. Main Heading */}
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight tracking-tight text-white">
               Get Official Recognition for Every Skill You Master
            </h2>

            {/* 3. Sub-copy */}
            <p className="text-lg text-slate-400 leading-relaxed max-w-3xl mb-16">
               Your hard work deserves proof. Every time you complete a skill inside Digital Madrasa, you receive an official Certificate of Completion, digitally verifiable and recognized by international clients.
            </p>

            {/* 4. CERTIFICATE IMAGE DISPLAY */}
            <div className="relative w-full max-w-4xl mb-16 group perspective-1000">
               {/* Spotlight Effect */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[120%] bg-gradient-to-b from-royal-blue/20 to-transparent rounded-[100%] blur-[80px] pointer-events-none"></div>

               {/* Certificate Image */}
               <div className="relative rounded-xl shadow-[0_0_80px_-20px_rgba(0,86,255,0.4)] border-[12px] border-[#1e293b] overflow-hidden transform transition-transform duration-700 hover:scale-[1.02] hover:rotate-1 bg-white">
                  <Image
                     src="/cert_template.png"
                     alt="Digital Madrasa Certificate"
                     width={1200}
                     height={800}
                     className="w-full h-auto object-cover"
                  />

               </div>
            </div>

            {/* 5. Benefits Below Certificate */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
               {[
                  "Showcase on LinkedIn & Resume",
                  "Build Credibility with International Clients",
                  "Unlock More Opportunities Inside the Digital Industry"
               ].map((benefit, i) => (
                  <div key={i} className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 border border-slate-800 text-sm text-slate-300 hover:border-royal-blue/50 transition-colors">
                     <Check size={16} className="text-royal-blue" />
                     <span>{benefit}</span>
                  </div>
               ))}
            </div>

            {/* 6. Inspirational Copy */}
            <div className="text-center mb-10 space-y-2">
               <p className="text-white font-medium text-lg">When effort meets the right guidance, growth becomes guaranteed.</p>
               <p className="text-slate-500">Your certificate is proof that you’re ready for the digital world.</p>
            </div>

            {/* 7. CTA Button */}
            <Link href="/enroll/1" className="group px-8 py-4 bg-royal-blue hover:bg-blue-600 text-white rounded-full font-bold text-lg shadow-[0_0_30px_-5px_rgba(0,86,255,0.5)] transition-all hover:scale-105 hover:shadow-[0_0_50px_-10px_rgba(0,86,255,0.6)] flex items-center gap-3">
               🚀 Start Learning & Earn Your First Certificate
            </Link>

         </div>
      </section>
   );
};

export default Certificate;
