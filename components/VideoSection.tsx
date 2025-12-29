import React from 'react';
import { Play } from 'lucide-react';

const VideoSection: React.FC = () => {
  return (
    <section className="py-0 bg-black relative overflow-hidden group cursor-pointer">
      <div className="absolute inset-0 opacity-60">
        <img 
          src="https://picsum.photos/1920/1080?blur=2" 
          alt="Video Background" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-navyBlack/80 via-navyBlack/40 to-navyBlack/90"></div>

      <div className="relative z-10 min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <h2 className="text-4xl md:text-6xl font-bold text-white mb-10 tracking-tight">A New Era of Learning Begins.</h2>
        
        <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center transition-transform transform group-hover:scale-110 group-hover:bg-white/20">
          <Play size={32} className="text-white fill-white ml-2" />
        </div>
        
        <p className="mt-8 text-white/70 text-sm font-medium tracking-widest uppercase">Watch the Reveal</p>
      </div>
    </section>
  );
};

export default VideoSection;