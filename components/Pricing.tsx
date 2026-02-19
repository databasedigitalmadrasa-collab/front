import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Check, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

interface Plan {
  id: number
  title: string
  description: string
  currency: string
  monthly_amount: number
  yearly_amount: number
  discounted_amount?: number
  offer_title?: string
  subscription_type: "monthly" | "annual" | "both"
  gst_tax: number
  whats_included?: string[]
  start_date?: string
  end_date?: string
  is_featured?: boolean
  created_at: string
  updated_at: string
}

interface PricingProps {
  plan?: Plan | null;
}

const Pricing: React.FC<PricingProps> = ({ plan }) => {
  // Timer state logic moved here or passed down?
  // Implementing local timer based on plan.end_date if passed
  const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);

  useEffect(() => {
    if (!plan?.end_date) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const difference = +new Date(plan.end_date!) - +new Date();
      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        };
      }
      return null;
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [plan?.end_date]);

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: plan?.currency || 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const monthlyPrice =  499; // Fallback
  const yearlyPrice = plan?.yearly_amount || 5988; // Fallback
  // Logic for original/standard price
  const finalPrice = plan?.yearly_amount ?? 5988;
  const standardPrice = plan ? (plan.monthly_amount * 12) : 7499;
  const discountedPrice = plan?.discounted_amount ?? 5988;

  // formatting date for banner
  const endDateObj = plan?.end_date ? new Date(plan.end_date) : null;
  const dateString = endDateObj ? endDateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'LIMITED TIME';

  // Config derived from plan
  const title = `Pricing & ${plan?.title || "Digital Republic Sale"}`;
  const subtitle = "India deserves world-class education at a fair price.";
  const statusText = `🇮🇳 ${plan?.offer_title || "DIGITAL REPUBLIC SALE"} IS LIVE`;
  const timerLabel = `SALE ENDS ${dateString.toUpperCase()}`;
  const isSaleMode = true; // Always active for Republic Sale

  // Ensure benefits is always an array
  let includedItems: string[] = [];

  if (plan?.whats_included) {
    if (Array.isArray(plan.whats_included)) {
      includedItems = plan.whats_included;
    } else if (typeof plan.whats_included === 'string') {
      try {
        const parsed = JSON.parse(plan.whats_included);
        if (Array.isArray(parsed)) includedItems = parsed;
      } catch (e) {
        // fallback if parse fails
        includedItems = [plan.whats_included];
      }
    }
  }

  const benefits = includedItems.length > 0 ? includedItems : [
    "Access to all current & future skills",
    "Dedicated AI modules in every course",
    "Client Acquisition Blueprint included",
    "Assignments, resources & certificates",
    "Continuous updates at no extra cost",
    "Priority community support"
  ];

  const ctaTextPrefix = "Enroll Now for";

  return (
    <section id="pricing" className="py-24 bg-offWhite relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-royalBlue/20 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">

        {/* SECTION HEADER (Editable) */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-navyBlack mb-4 tracking-tight">
            {title}
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        {/* PRICING CARD (Fixed UI / Editable Zones) */}
        <div className="max-w-4xl mx-auto bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden group">

          {/* TOP STATUS BAR (Editable Mode Switch) */}
          <div className={`py-4 flex items-center justify-center gap-3 px-4 transition-colors duration-500 ${isSaleMode ? 'bg-blue-600 text-white' : 'bg-navyBlack text-slate-300'}`}>
            {timeLeft ? <Clock size={18} className="shrink-0 animate-pulse" /> : <ShieldCheck size={18} className="shrink-0" />}
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">
              {timeLeft ? `${statusText} · ${timerLabel}` : statusText}
            </span>
          </div>

          <div className="p-8 md:p-16">
            <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">

              {/* LEFT: Price Display Area */}
              <div className="lg:w-1/2 flex flex-col justify-center items-center lg:items-start text-center lg:text-left">

                {/* Optional Discount Badge */}
                {isSaleMode && (
                  <div className="mb-6 px-4 py-1.5 bg-[#E6FFF2] text-[#00C06B] rounded-full text-[10px] font-bold uppercase tracking-wider border border-[#00C06B]/10">
                    20% OFF SALE
                  </div>
                )}

                <div className="flex flex-col items-center lg:items-start mb-6">
                  {/* Optional Strikethrough Price */}
                  <div className="text-2xl md:text-3xl font-bold text-slate-300 line-through decoration-red-400/50 decoration-2 mb-2">
                    {formatCurrency(finalPrice)}
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-6xl md:text-8xl font-bold text-navyBlack tracking-tighter leading-none">
                      {formatCurrency(discountedPrice)}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 mb-8">
                  <div className="text-xl md:text-2xl  text-blue-600 font-bold">
                    Just {formatCurrency(monthlyPrice)}/month
                  </div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                    Billed Annually
                  </p>
                </div>

                <div className="hidden lg:block w-full">
                  <div className="inline-block px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                    {plan?.offer_title || "LIMITED TIME REPUBLIC SALE"}
                  </div>
                </div>
              </div>

              {/* RIGHT: Benefits List (Dynamic List) */}
              <div className="lg:w-1/2 border-t lg:border-t-0 lg:border-l border-slate-100 pt-10 lg:pt-0 lg:pl-16 flex flex-col justify-center">
                <h4 className="text-navyBlack font-bold text-sm uppercase tracking-widest mb-6 block lg:hidden text-center">What's Included</h4>
                <ul className="space-y-4 mb-8">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3 group/item">
                      <div className="mt-1 w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center shrink-0 group-hover/item:bg-royalBlue transition-colors duration-300">
                        <Check size={12} className="text-royalBlue group-hover/item:text-white" />
                      </div>
                      <span className="text-slate-600 text-sm md:text-base font-medium">
                        {benefit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* CTA SECTION (Syncs with Price) */}
            <div className="mt-12 flex flex-col items-center">
              <Link href={`/enroll/${plan?.id || 1}`} className="w-full max-w-2xl py-6 bg-royalBlue bg-blue-700 text-white rounded-[1.25rem] font-bold text-xl md:text-2xl shadow-[0_20px_40px_-10px_rgba(0,86,255,0.4)] transition-all transform hover:scale-[1.01] active:scale-[0.98] block text-center">
                {ctaTextPrefix} {formatCurrency(discountedPrice)}
              </Link>

              {/* TRUST FOOTER (Static UI) */}
              <div className="mt-8 flex flex-col items-center gap-4">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                  Full 1-Year Access • All Updates Included
                </p>
                <div className="flex items-center gap-6 opacity-40 grayscale">
                  <img src="https://cdn.simpleicons.org/visa/1A1F71" alt="Visa" className="h-4" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" className="h-3" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/c/cb/Rupay-Logo.png" alt="RuPay" className="h-6 object-contain" />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Small Verification Line */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 text-slate-300 text-[10px] font-bold uppercase tracking-[0.2em]">
            <ShieldCheck size={14} />
            <span>Secure SSL Encrypted Checkout</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;