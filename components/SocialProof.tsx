import React from 'react';
import { Quote } from 'lucide-react';

const SocialProof: React.FC = () => {
  return (
    <section className="py-24 bg-offWhite">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center text-navyBlack mb-16">Student Experiences</h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              text: "Within 30 days, I landed my first international client. This platform is different from everything I tried.",
              author: "Rohit",
              role: "Delhi"
            },
            {
              text: "The AI modules changed my workflow completely. I feel ready for the future.",
              author: "Ayesha",
              role: "Bangalore"
            },
            {
              text: "The client scripts alone are worth the entire fee.",
              author: "Aman",
              role: "Lucknow"
            }
          ].map((t, i) => (
            <div key={i} className="bg-white p-10 rounded-2xl shadow-sm border border-slate-100 relative hover:-translate-y-1 transition-transform duration-300 flex flex-col text-center items-center">
              <Quote className="text-royalBlue/20 w-12 h-12 fill-current mb-6" />
              <p className="text-slate-700 mb-6 text-lg italic leading-relaxed font-medium">"{t.text}"</p>
              <div className="mt-auto">
                <h4 className="font-bold text-navyBlack text-base">{t.author}</h4>
                <p className="text-sm text-slate-400">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;