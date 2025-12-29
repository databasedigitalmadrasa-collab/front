
import React from 'react';
import Image from 'next/image';

const Authority: React.FC = () => {
  const badges = [
    {
      title: "MSME Registered",
      sub: "Govt. of India Recognized",
      color: "#F59E0B", // Amber
      image: "/msme_emblem.png"
    },
    {
      title: "ISO 9001:2015",
      sub: "Quality Certified",
      color: "#10B981", // Emerald
      image: "/iso.jpg"
    },
    {
      title: "QC Certified",
      sub: "Quality Control",
      color: "#3B82F6", // Blue
      image: "/quality.jpg"
    }
  ];

  return (
    <section className="py-20 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-navy-black mb-3">Recognized Authority & Standards</h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            We are committed to delivering education that meets global benchmarks and government recognition.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-8 md:gap-10">
          {badges.map((badge, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center p-8 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 w-full sm:w-48 group"
            >
              <div className="transition-transform duration-300 group-hover:scale-110 mb-4">
                <div className="relative w-20 h-20">
                  <Image
                    src={badge.image}
                    alt={badge.title}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              <h3 className="font-bold text-navy-black text-lg leading-tight mb-1">{badge.title}</h3>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{badge.sub}</p>

            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Authority;
