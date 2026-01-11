
import React from 'react';
import Link from 'next/link';

const Pricing: React.FC = () => {
  return (
    <section id="pricing" className="py-24 bg-white relative overflow-hidden border-t border-slate-100">
      <div className="max-w-4xl mx-auto px-6 relative z-10">

        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-navyBlack mb-4">Pricing</h2>
          <p className="text-lg text-slate-600">India deserves world-class education at a fair price.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl relative">

          <div className="p-8 md:p-12">
            <div className="flex flex-col items-center justify-center gap-4 mb-10">
              <div className="text-center">
                <p className="text-6xl font-bold text-navyBlack">₹7,499</p>
                <p className="text-xl text-slate-500 mt-2">Standard Price / Year</p>
                <p className="text-lg text-slate-400 mt-1">(₹625/month)</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 items-center max-w-sm mx-auto">
              <Link href="/enroll/1" className="w-full py-5 bg-[#0056FF] hover:bg-blue-700 text-white rounded-xl font-bold text-xl shadow-xl transition-all hover:scale-[1.02] block text-center">
                Enroll Now for ₹7,499
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
