
import React from 'react';
import { ArrowRight, Check, X, Tv, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

const FinalCTA: React.FC = () => {
  return (
    <section className="py-20 bg-[#020617] relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#0056FF]/10 rounded-full blur-[90px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-[90px]"></div>
      </div>

      <div className="max-w-5xl mx-auto px-8 relative z-10">
        <div className="text-center mb-12">
          <span className="text-slate-400 text-xs font-bold tracking-[0.2em] uppercase mb-3 block">In 2026</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">The Choice Is Yours</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto items-stretch">
          {/* LEFT BOX - Negative */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 flex flex-col items-center text-center relative overflow-hidden group transition-all duration-300 hover:border-slate-700">
            {/* Dull Overlay */}
            <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>

            <div className="mb-6 relative z-10 opacity-50">
              <Tv size={40} className="mx-auto text-slate-500 mb-2" />
            </div>

            <h3 className="text-2xl font-bold text-slate-300 mb-2 relative z-10">
              Go Watch K-Drama
            </h3>
            <p className="text-slate-500 text-sm mb-6 relative z-10">(or scroll Instagram… again)</p>

            <p className="text-slate-400 text-base font-medium mb-6 relative z-10 border-b border-slate-800 pb-6 w-full">
              Lose another year of your life doing nothing.
            </p>

            <ul className="space-y-3 mb-8 text-left w-full max-w-xs mx-auto relative z-10">
              {[
                "Stay stuck with low income",
                "Keep watching others succeed",
                "Work a boring 9–5 that drains your soul",
                "Stay confused about which skill to learn",
                "Watch outdated YouTube tutorials",
                "Take random courses with no direction",
                "Keep dreaming about freelancing but never start",
                "Let AI replace people who refuse to upgrade",
                "Waste time… instead of valuing it"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-500 text-sm">
                  <X size={16} className="shrink-0 mt-0.5 opacity-50" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <button className="mt-auto w-full py-4 bg-slate-800 text-slate-500 rounded-xl font-medium cursor-not-allowed relative z-10 border border-slate-700/50 hover:bg-slate-800 transition-colors text-sm">
              Remain Where You Are
            </button>
          </div>

          {/* RIGHT BOX - Positive */}
          <div className="bg-gradient-to-b from-[#0056FF]/10 to-[#020617] border border-[#0056FF]/30 rounded-2xl p-8 flex flex-col items-center text-center relative shadow-[0_0_40px_-15px_rgba(0,86,255,0.3)] z-20">
            <div className="absolute inset-0 bg-gradient-to-b from-[#0056FF]/5 to-transparent pointer-events-none rounded-2xl"></div>

            <h3 className="text-3xl font-bold text-white mb-2 relative z-10">
              Take Action
            </h3>
            <p className="text-blue-200 text-sm mb-6 relative z-10">Start Building Your Digital Career Today</p>

            <div className="mb-6 relative z-10 border-b border-[#0056FF]/20 pb-6 w-full">
              <p className="text-4xl md:text-5xl font-bold text-[#0056FF] mb-2">₹5,988</p>
              <p className="text-slate-400 text-sm">/ Year (Just ₹499/mo)</p>
              <p className="text-red-500 font-bold text-sm mt-2 line-through decoration-2 opacity-90">Standard Price Rs 7499/Year</p>
              <div className="inline-block bg-green-500/10 text-green-400 text-xs font-bold px-3 py-1 rounded-full mt-3 border border-green-500/20 uppercase tracking-wide">
                Launch Offer: 20% OFF
              </div>
            </div>

            <ul className="space-y-3 mb-8 text-left w-full max-w-sm mx-auto relative z-10">
              {[
                "Learn 5 Skills + All Future Skills for 1 Full Year",
                "Become Skill-Ready + AI-Ready for 2026",
                "Dedicated AI Modules in every skill",
                "International-standard curriculum",
                "Learn directly from mentors working with global clients",
                "Client Acquisition Blueprint included",
                "Regular updates (NOT outdated 2018-style courses)",
                "Proven frameworks to get international clients",
                "Learn at your own pace, anywhere",
                "Build a real earning career from your home"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-white text-sm">
                  <Check size={16} className="shrink-0 mt-0.5 text-[#0056FF]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link href="/enroll/1" className="w-full py-4 bg-gradient-to-r from-[#0056FF] to-blue-600 hover:to-blue-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 relative z-10 group text-center">
              Join Digital Madrasa Now <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>




            {/* Secure Payment & Features Section */}
            <div className="mt-8 pt-6 border-t border-white/10 w-full flex flex-col items-center relative z-10 text-center">

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <ShieldCheck size={16} className="text-green-500" />
                <span className="text-white font-bold text-xs uppercase tracking-wider">100% Secure Payment By</span>
              </div>

              {/* Payment Logos */}
              <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
                <div className="bg-white rounded-md w-16 h-10 flex items-center justify-center p-2 shadow-sm">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Visa_2021.svg/1200px-Visa_2021.svg.png" alt="Visa" className="h-full w-auto object-contain" />
                </div>
                <div className="bg-white rounded-md w-16 h-10 flex items-center justify-center p-2 shadow-sm">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/1200px-UPI-Logo-vector.svg.png" alt="UPI" className="h-full w-auto object-contain" />
                </div>
                <div className="bg-white rounded-md w-16 h-10 flex items-center justify-center p-1 shadow-sm">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/c/cb/Rupay-Logo.png" alt="RuPay" className="h-full w-auto object-contain" />
                </div>
                <div className="bg-white rounded-md w-16 h-10 flex items-center justify-center p-2 shadow-sm">
                  <img src="https://cdn.simpleicons.org/phonepe/5f259f" alt="PhonePe" className="h-full w-auto object-contain scale-125" />
                </div>
              </div>

              {/* Divider & Bullets */}
              <div className="w-full border-t border-white/10 pt-4 flex flex-col items-center space-y-2 text-xs text-slate-400">
                <p className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
                  <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span> Full 1-Year Access</span>
                  <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span> All Updates Included</span>
                </p>
                <p className="flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span> All Future Skills Included
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
