
import React from 'react';
import { X, ArrowRight, AlertTriangle, Layers, Sparkles, Globe } from 'lucide-react';

const About: React.FC = () => {
    return (
        <section id="about" className="py-24 bg-white relative overflow-hidden">
            {/* Ambient Background Elements */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-red-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">

                {/* Section Header */}
                <div className="text-center mb-20 max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 border border-red-100 mb-6">
                        <AlertTriangle size={16} className="text-red-500" />
                        <span className="text-red-600 font-bold text-xs uppercase tracking-wider">The Reality Check</span>
                    </div>
                    <h2 className="text-3xl md:text-6xl font-bold text-navy-black mb-6 leading-tight">
                        India doesn't lack <span className="relative inline-block text-slate-400 decoration-slate-300 decoration-2 underline-offset-4">
                            talent
                            <span className="absolute inset-0 w-full h-full border-b-4 border-red-200 top-1 opacity-50"></span>
                        </span>.<br />
                        It lacks <span className="text-royal-blue">direction</span>.
                    </h2>
                    <p className="text-lg text-slate-600 leading-relaxed">
                        We saw the gap. Most online courses today are failing students. They focus on noise, not clarity. It’s time to fix the broken learning model.
                    </p>
                </div>

                {/* Comparison Layout */}
                <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">

                    {/* The Problem Card */}
                    <div className="relative group">
                        {/* Glow Effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-red-100 to-orange-50 rounded-3xl blur opacity-40 group-hover:opacity-70 transition duration-500"></div>

                        <div className="relative bg-white p-8 md:p-10 rounded-3xl border border-red-50 shadow-xl shadow-red-100/20">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
                                    <X size={24} className="text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-navy-black">The "Old Way" of Learning</h3>
                                    <p className="text-xs text-red-400 font-bold uppercase tracking-wider">Why 90% Fail</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { title: "Outdated Content", desc: "Teaching strategies that died in 2019." },
                                    { title: "Zero Client Focus", desc: "Learning skills but not how to sell them." },
                                    { title: "Fake Lifetime Access", desc: "Courses that never get updated." },
                                    { title: "No Mentorship", desc: "Pre-recorded videos with zero real support." }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-transparent hover:bg-red-50/30 hover:border-red-100 transition-colors">
                                        <div className="mt-1 min-w-[20px]"><X size={18} className="text-red-400" /></div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-sm">{item.title}</h4>
                                            <p className="text-sm text-slate-500 mt-1 leading-snug">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* The Solution Copy */}
                    <div className="md:pl-10">
                        <div className="mb-8">
                            <h3 className="text-2xl md:text-4xl font-bold text-navyBlack leading-tight mb-6">
                                Digital Madrasa exists to <span className="text-royal-blue inline-block border-b-4 border-royal-blue/20 pb-1">change this narrative.</span>
                            </h3>
                            <p className="text-lg text-slate-600 leading-relaxed mb-6">
                                We built the platform we wish we had when we started. <span className="text-navy-black font-semibold">No fluff. No theory-only lectures.</span> Just a straight line from <strong>beginner</strong> to <strong>earning professional</strong>.
                            </p>
                        </div>

                        <div className="space-y-4 mb-10">
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-royal-blue/30 hover:bg-blue-50/30 transition-all group cursor-default">
                                <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-royal-blue shadow-sm group-hover:scale-110 group-hover:bg-royal-blue group-hover:text-white transition-all duration-300">
                                    <Layers size={22} />
                                </div>
                                <span className="font-bold text-navy-black text-xl">Structured Roadmap</span>
                            </div>
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-royal-blue/30 hover:bg-blue-50/30 transition-all group cursor-default">
                                <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-royal-blue shadow-sm group-hover:scale-110 group-hover:bg-royal-blue group-hover:text-white transition-all duration-300">
                                    <Sparkles size={22} />
                                </div>
                                <span className="font-bold text-navy-black text-xl">AI-Integrated Curriculum</span>
                            </div>
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-royal-blue/30 hover:bg-blue-50/30 transition-all group cursor-default">
                                <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-royal-blue shadow-sm group-hover:scale-110 group-hover:bg-royal-blue group-hover:text-white transition-all duration-300">
                                    <Globe size={22} />
                                </div>
                                <span className="font-bold text-navy-black text-xl">Dedicated Client Acquisition Trainings</span>
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </section>
    );
};

export default About;
