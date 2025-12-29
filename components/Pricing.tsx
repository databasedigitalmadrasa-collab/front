
import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const Pricing: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState({ days: 9, hours: 23, minutes: 59, seconds: 59 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="pricing" className="py-24 bg-white relative overflow-hidden border-t border-slate-100">
      <div className="max-w-4xl mx-auto px-6 relative z-10">

        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-navyBlack mb-4">Pricing & Launch Offer</h2>
          <p className="text-lg text-slate-600">India deserves world-class education at a fair price.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl relative">
          {/* Top Banner */}
          <div className="bg-[#0056FF] text-white text-center py-3 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2">
            <Clock size={16} /> Launch Price Ends In: {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
          </div>

          <div className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 mb-10">
              <div className="text-center opacity-60">
                <p className="text-3xl text-slate-400 line-through decoration-red-500 decoration-2">₹7,499</p>
                <p className="text-sm text-slate-500">Standard Price / Year</p>
                <p className="text-xs text-slate-400">(₹625/month)</p>
              </div>

              <div className="text-center transform scale-110">
                <div className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold mb-2">20% OFF LAUNCH OFFER</div>
                <p className="text-6xl font-bold text-navyBlack">₹5,988</p>
                <p className="text-[#0056FF] font-bold text-xl mt-2 tracking-wide">Just ₹499/month</p>
                <p className="text-xs text-slate-400 mt-1">Billed Annually</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-6 text-center mb-10 border border-slate-100">
              <div className="flex items-center justify-center gap-2 text-red-500 font-bold mb-2">
                <AlertTriangle size={18} />
                <span>Only for fast action takers</span>
              </div>
              <p className="text-slate-600 text-sm">
                After 10 days, the price returns permanently to ₹7,499.<br />
                No extensions. No exceptions.
              </p>
            </div>

            <div className="flex flex-col gap-4 items-center max-w-sm mx-auto">
              <Link href="/enroll/1" className="w-full py-5 bg-[#0056FF] hover:bg-blue-700 text-white rounded-xl font-bold text-xl shadow-xl transition-all hover:scale-[1.02] block text-center">
                Enroll Now for ₹5,988
              </Link>
              <p className="text-xs text-slate-400">This is the lowest price Digital Madrasa will ever offer.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
