
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
              {/*<Clock size={16} /> Launch Price Ends In: {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s*/}
              🎓 Standard Pricing is Now Live

            </div>

            <div className="p-8 md:p-12">
              <div className="flex flex-col items-center justify-center mb-12 w-full">
                <div className="text-center">
                  <div className="inline-block px-4 py-1.5 bg-green-100 text-green-600 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider mb-3">
                    🔒 Standard Plan
                  </div>
                  {/* Reduced font weight from font-bold to font-semibold for a softer appearance */}
                  <div className="text-6xl md:text-8xl font-semibold text-navyBlack tracking-tighter leading-none mb-2">
                    ₹7,499
                  </div>
                  <div className="text-xl md:text-2xl text-blue-600  font-bold text-royalBlue mb-1">
                    Just ₹625/month
                  </div>
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">Billed Annually • Full Platform Access</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-6 text-center mb-10 border border-slate-100">
                <div className="flex items-center justify-center gap-2 mb-6">
                  <AlertTriangle size={20} className="text-royalBlue" />
                  <span className="text-navyBlack font-bold text-lg">What You Get with This Plan</span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className="inline-block px-4 py-1.5 bg-green-100 text-green-600 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider">
                    Access to All Current & Upcoming Skills
                  </div>
                  <div className="inline-block px-4 py-1.5 bg-green-100 text-green-600 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider">
                    Dedicated AI Modules in every skill
                  </div>
                  <div className="inline-block px-4 py-1.5 bg-green-100 text-green-600 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider">
                    Assignments, resources & certificates
                  </div>
                  <div className="inline-block px-4 py-1.5 bg-green-100 text-green-600 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider">
                    Continuous updates — no extra cost
                  </div>
                  <div className="inline-block px-4 py-1.5 bg-green-100 text-green-600 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider">
                    Client Acquisition Blueprint (Freelancing + Remote Work)
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 items-center max-w-sm mx-auto">
                <Link href="/enroll/1" className="w-full py-5 bg-[#0056FF] hover:bg-blue-700 text-white rounded-xl font-bold text-xl shadow-xl transition-all hover:scale-[1.02] block text-center">
                  Enroll Now for ₹7,499
                </Link>
                <p className="text-xs text-slate-400">
                  One subscription. Every skill. Learn at your own pace.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
  );
};

export default Pricing;