import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const Pricing: React.FC = () => {
  return (
    <section id="pricing" className="py-24 bg-slate-50 relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-6 relative z-10">

        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-navyBlack mb-4">Pricing & Digital Republic Sale</h2>
          <p className="text-lg text-slate-600">Celebrating skill-first India with a limited-time Digital Republic Sale.</p>
        </div>

        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl relative">
          {/* Top Banner */}
          <div className="bg-[#0056FF] text-white text-center py-3 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2">
            <Clock size={16} /> 🇮🇳 DIGITAL REPUBLIC SALE · ENDS 26 JAN
          </div>

          <div className="p-8 md:p-12">
            {/* Pricing Area */}
            <div className="flex flex-col items-center justify-center mb-10 w-full relative">

              {/* Sale Badge */}
              <div className="absolute top-0 right-0 md:static md:mb-4">
                <div className="inline-block px-4 py-1.5 bg-green-100 text-green-600 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider">
                  DIGITAL REPUBLIC SALE
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 w-full mt-8 md:mt-0">
                {/* Standard Price (Crossed Out) */}
                <div className="text-center md:text-right">
                  <div className="relative inline-block">
                    <div className="text-4xl md:text-5xl font-bold text-slate-300">
                      ₹7,499
                    </div>
                    {/* Red Strikethrough line */}
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-red-400 rotate-[-5deg]"></div>
                  </div>
                  <div className="text-xs md:text-sm font-bold text-slate-400 mt-1">
                    Standard Price / Year (₹625/month)
                  </div>
                </div>

                {/* Sale Price (Big) */}
                <div className="text-center md:text-left">
                  <div className="text-7xl md:text-8xl font-bold text-navyBlack tracking-tighter leading-none mb-2">
                    ₹5,988
                  </div>
                  <div className="text-xl text-center md:text-2xl text-[#0056FF] font-bold mb-1">
                    Just ₹499/month
                  </div>
                  <p className="text-slate-400  text-center text-xs font-medium uppercase tracking-widest">BILLED ANNUALLY</p>
                </div>
              </div>
            </div>

            {/* Warning Box */}
            <div className="bg-blue-50/50 rounded-2xl p-8 text-center mb-10 border border-blue-100 max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-2 mb-4">
                <AlertTriangle size={20} className="text-red-500" />
                <span className="text-red-500 font-bold text-lg">Limited-Time Republic Sale</span>
              </div>
              <p className="text-slate-600 mb-1">
                Valid only from 20–26 January.
              </p>
              <p className="text-slate-600 mb-1">
                After this period, the price returns permanently to ₹7,499/year.
              </p>
              <p className="text-slate-600">
                No extensions. No exceptions.
              </p>
            </div>

            {/* CTA Button */}
            <div className="flex flex-col gap-4 items-center max-w-md mx-auto">
              <Link href="/enroll/1" className="w-full py-5 bg-[#0056FF] hover:bg-blue-700 text-white rounded-xl font-bold text-2xl shadow-xl shadow-blue-500/30 transition-all hover:scale-[1.02] block text-center">
                Enroll Now for ₹5,988
              </Link>
              <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
                THIS SPECIAL REPUBLIC SALE PRICE IS AVAILABLE FOR A LIMITED TIME ONLY.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Features Footer */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-xs font-bold text-slate-300 tracking-widest uppercase">
          <span>ONE YEAR ACCESS</span>
          <span>PREMIUM MENTORSHIP</span>
          <span>AI MODULES INCLUDED</span>
        </div>

      </div>
    </section>
  );
};

export default Pricing;