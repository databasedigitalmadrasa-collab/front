
import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const faqs = [
  { q: "What is Digital Madrasa?", a: "Digital Madrasa is a premium EdTech and freelancing platform designed to transform beginners into earning professionals. We combine high-income skills with AI mastery and client acquisition strategies to help you launch a successful freelance career." },
  { q: "Do I need experience?", a: "No. Everything starts from beginner level." },
  { q: "Will I learn AI?", a: "Yes. Every skill includes dedicated AI training modules." },
  { q: "Can I get international clients?", a: "Absolutely. We teach proven global client acquisition methods in our dedicated module." },
  { q: "Is this a one-time payment?", a: "Yes. One yearly payment gives you access to all current skills + all future skills." },
  { q: "Is the content updated?", a: "Yes. We provide regular updates for 2026 and beyond." },
  { q: "Can I learn from my phone?", a: "Yes. The platform is 100% mobile-friendly." }
];

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-24 bg-white border-t border-slate-100">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-navyBlack mb-12 text-center">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-royalBlue/40 transition-colors">
              <button
                className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="font-semibold text-navyBlack pr-8 text-lg">{faq.q}</span>
                {openIndex === index ? <Minus className="text-royalBlue shrink-0" /> : <Plus className="text-slate-400 shrink-0" />}
              </button>
              <div
                className={`px-6 transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-48 pb-6 opacity-100' : 'max-h-0 opacity-0'
                  }`}
              >
                <p className="text-slate-600 leading-relaxed">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
