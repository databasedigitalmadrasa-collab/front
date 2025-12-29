
import React, { useState } from 'react';
import { Video, Youtube, Share2, Layout, Mail, Sparkles, Check, Lock } from 'lucide-react';

const skills = [
  {
    id: 1,
    title: "Content Creation",
    subtitle: "King",
    icon: Video,
    description: "Script writing. Viral storytelling. Reel production. Become the creator brands are fighting to hire.",
    gradient: "from-fuchsia-600 to-purple-700",
    spine: "bg-purple-900",
    shadow: "shadow-purple-500/30",
    modules: ["Viral Scripting", "Editing Hacks", "Camera Confidence"],
    stats: { modules: "8 Modules", chapters: "40 Chapters", timeline: "Timeline 30 Days" }
  },
  {
    id: 2,
    title: "YouTube Thumbnail",
    subtitle: "Champ",
    icon: Youtube,
    description: "High CTR designs. Click psychology. Visuals that stop the scroll and force the click.",
    gradient: "from-red-500 to-orange-600",
    spine: "bg-red-900",
    shadow: "shadow-red-500/30",
    modules: ["Click Psychology", "CTR Booster", "Visual Hooks"],
    stats: { modules: "7 Modules", chapters: "38 Chapters", timeline: "Timeline 60 Days" }
  },
  {
    id: 3,
    title: "Social Media Manager",
    subtitle: "Pro",
    icon: Share2,
    description: "Account handling. Organic growth strategies. Analytics. Manage high-ticket client profiles.",
    gradient: "from-blue-500 to-cyan-600",
    spine: "bg-blue-900",
    shadow: "shadow-blue-500/30",
    modules: ["Brand Strategy", "Automation", "Community Growth"],
    stats: { modules: "9 Modules", chapters: "50 Chapters", timeline: "Timeline 60 Days" }
  },
  {
    id: 4,
    title: "WordPress",
    subtitle: "Domination",
    icon: Layout,
    description: "Build premium websites. No coding required. Create high-value business sites from scratch.",
    gradient: "from-slate-700 to-slate-900",
    spine: "bg-black",
    shadow: "shadow-slate-500/30",
    modules: ["Elementor Pro", "Landing Pages", "E-Commerce"],
    stats: { modules: "10 Modules", chapters: "50 Chapters", timeline: "Timeline 30 Days" }
  },
  {
    id: 5,
    title: "Email",
    subtitle: "Boss",
    icon: Mail,
    description: "List building. Automations. Sales funnels that generate revenue on autopilot.",
    gradient: "from-amber-400 to-orange-500",
    spine: "bg-orange-800",
    shadow: "shadow-orange-500/30",
    modules: ["Cold Outreach", "Drip Sequences", "Newsletter Growth"],
    stats: { modules: "10 Modules", chapters: "47 Chapters", timeline: "Timeline 60 Days" }
  },
  {
    id: 6,
    title: "Future Skills",
    subtitle: "Stack",
    icon: Sparkles,
    description: "Unlock Video Editing, Figma, Copywriting and more at no extra cost.",
    gradient: "from-emerald-400 to-teal-600",
    spine: "bg-teal-900",
    shadow: "shadow-teal-500/30",
    isLocked: true,
    modules: ["Video Editing", "Copywriting", "Figma Design"],
    stats: null
  }
];

const Skills: React.FC = () => {
  const [activeSkill, setActiveSkill] = useState<number | null>(null);
  return (
    <section id="skills" className="py-24 bg-offWhite relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[50%] -translate-x-1/2 w-[800px] h-[800px] bg-royalBlue/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <span className="text-royalBlue font-bold tracking-widest uppercase text-xs mb-3 block">The Curriculum</span>
          <h2 className="text-4xl md:text-6xl font-bold text-navyBlack mb-6">
            5 High-Income <span className="text-[#3366FF]">Skill Stacks</span>
          </h2>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto">
            A single enrollment gives you access to all five premium skills, powered with Al modules, client acquisition training, and international-level standards.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
          {skills.map((skill) => (
            <div
              key={skill.id}
              className="flex flex-col items-center group perspective-1000 cursor-pointer"
              onClick={() => setActiveSkill(activeSkill === skill.id ? null : skill.id)}
            >

              {/* Tooltip Overlay */}
              {skill.stats && (
                <div className={`absolute top-[20%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 bg-neutral-900/95 backdrop-blur-md rounded-xl p-5 shadow-2xl transition-all duration-500 pointer-events-none z-50 border border-white/10 ${activeSkill === skill.id ? 'opacity-100 translate-y-0 delay-0' : 'opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 delay-100'}`}>
                  <h4 className="text-white font-bold text-sm mb-1 uppercase leading-tight">
                    {skill.title}
                  </h4>
                  <h5 className="text-white/50 text-[10px] font-bold tracking-widest uppercase mb-4">
                    Details
                  </h5>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white font-semibold">Modules:</span>
                      <span className="text-white/80">{skill.stats.modules}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white font-semibold">Chapters:</span>
                      <span className="text-white/80">{skill.stats.chapters}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white font-semibold">Timeline:</span>
                      <span className="text-white/80">{skill.stats.timeline}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center gap-2">
                    <Check size={12} className="text-green-500" />
                    <span className="text-green-500 text-[10px] font-bold uppercase tracking-wide">Future Updates Included</span>
                  </div>
                </div>
              )}

              {/* 3D Box Visual */}
              <div className="relative w-64 h-80 transition-all duration-500 ease-out transform-style-3d group-hover:rotate-y-[-15deg] group-hover:rotate-x-[5deg] group-hover:-translate-y-4 cursor-pointer mb-8">

                {/* Shadow underneath */}
                <div className={`absolute bottom-0 left-4 w-[90%] h-4 bg-black/20 blur-xl rounded-full transition-all duration-500 group-hover:scale-90 group-hover:opacity-40`}></div>

                {/* Front Face (Cover) */}
                <div className={`absolute inset-0 bg-gradient-to-br ${skill.gradient} rounded-r-lg rounded-l-[2px] shadow-2xl ${skill.shadow} flex flex-col items-center justify-center p-6 text-center border-r-2 border-white/20 backface-hidden z-20`}>

                  {/* Sheen Effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none"></div>

                  {/* Content on Cover */}
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-white/30 shadow-inner">
                    <skill.icon size={32} className="text-white" />
                  </div>

                  <h3 className="text-2xl font-bold text-white uppercase leading-none tracking-tight">
                    {skill.title}
                  </h3>
                  <h4 className="text-white/80 font-medium text-sm tracking-[0.2em] mt-2 uppercase">
                    {skill.subtitle}
                  </h4>

                  <div className="mt-auto w-full border-t border-white/20 pt-4">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <span className="text-white font-bold text-xs">AI</span>
                      </div>
                      <span className="text-white/90 text-xs font-medium">Integrated</span>
                    </div>
                  </div>
                </div>

                {/* Spine (Left Side) */}
                <div className={`absolute top-[2px] bottom-[2px] left-0 w-12 ${skill.spine} origin-left rotate-y-[-90deg] translate-z-[1px] rounded-l-sm border-l border-white/10 flex flex-col items-center justify-center py-4 z-10`}>
                  <span className="text-white/40 font-bold text-xs tracking-widest uppercase rotate-90 whitespace-nowrap">Digital Madrasa</span>
                </div>

                {/* Pages (Right Side Thickness) */}
                <div className="absolute top-[3px] bottom-[3px] right-0 w-8 bg-white origin-right rotate-y-[90deg] translate-z-[0px] rounded-r-sm bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px)] bg-[length:2px_100%]"></div>

              </div>

              {/* Description & Modules below the box */}
              <div className="text-center max-w-xs relative z-30">
                {skill.isLocked ? (
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-slate-200 text-slate-500 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                    <Lock size={12} /> Coming Soon
                  </div>
                ) : (
                  <div className="space-y-2 mb-4">
                    {skill.modules.map((mod, i) => (
                      <div key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-600 shadow-sm mx-1">
                        <Check size={10} className="text-royalBlue" /> {mod}
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-slate-500 text-sm leading-relaxed">
                  {skill.description}
                </p>
              </div>

            </div>
          ))}
        </div>

        {/* Style helper for 3D transforms */}
        <style>{`
          .perspective-1000 { perspective: 1000px; }
          .transform-style-3d { transform-style: preserve-3d; }
          .rotate-y-\[-90deg\] { transform: rotateY(-90deg); }
          .rotate-y-\[90deg\] { transform: rotateY(90deg); }
          .rotate-y-\[-15deg\] { transform: rotateY(-15deg); }
          .rotate-x-\[5deg\] { transform: rotateX(5deg); }
          .backface-hidden { backface-visibility: hidden; }
        `}</style>
      </div>
    </section>
  );
};

export default Skills;
