import React from 'react';
import { PlayCircle, PieChart, BookOpen, Award, Sun, Moon } from 'lucide-react';

const DashboardPreview: React.FC = () => {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 text-center mb-16">
        <h2 className="text-4xl font-bold text-navyBlack mb-4">Your Learning Dashboard</h2>
        <p className="text-slate-500 max-w-2xl mx-auto">The Digital Madrasa dashboard is designed to make learning smooth, fast, and motivating. A premium learning experience — built with Apple-like simplicity.</p>
      </div>

      <div className="max-w-6xl mx-auto px-6 relative">
        {/* Background Elements */}
        <div className="absolute -inset-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-[3rem] opacity-50 blur-2xl"></div>
        
        {/* Main Dashboard Screen Mockup */}
        <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
          {/* Mock Header */}
          <div className="border-b border-slate-100 p-4 flex items-center justify-between bg-slate-50/50">
            <div className="flex gap-2">
               <div className="w-3 h-3 rounded-full bg-red-400"></div>
               <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
               <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex gap-2 p-1 bg-slate-200 rounded-lg">
                    <div className="p-1 bg-white rounded text-navyBlack"><Sun size={14} /></div>
                    <div className="p-1 text-slate-400"><Moon size={14} /></div>
                </div>
                <div className="text-xs font-medium text-slate-400">DM Dashboard</div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row">
            {/* Mock Sidebar */}
            <div className="hidden md:flex flex-col w-64 border-r border-slate-100 p-6 gap-6 bg-white">
               <div className="flex items-center gap-3 text-royalBlue font-bold bg-blue-50 p-3 rounded-lg">
                 <PieChart size={20} /> Progress
               </div>
               <div className="flex items-center gap-3 text-slate-500 p-3">
                 <BookOpen size={20} /> My Skills
               </div>
               <div className="flex items-center gap-3 text-slate-500 p-3">
                 <Award size={20} /> Certificates
               </div>
            </div>

            {/* Mock Content */}
            <div className="flex-1 p-8 bg-slate-50/30">
              <div className="flex justify-between items-end mb-8">
                 <div>
                   <h3 className="text-2xl font-bold text-navyBlack">Welcome back, Future Freelancer</h3>
                   <p className="text-slate-500">Resume where you left off.</p>
                 </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                 {['Content Creation King', 'YouTube Thumbnail Champ', 'Social Media Pro'].map((course, i) => (
                   <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                      <div className="h-28 bg-slate-100 rounded-lg mb-4 relative overflow-hidden group">
                          <div className="absolute inset-0 bg-royalBlue/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <PlayCircle size={32} className="text-royalBlue" />
                          </div>
                      </div>
                      <h4 className="font-bold text-navyBlack mb-2 text-sm">{course}</h4>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span>Progress</span>
                          <span>{(i+1)*25}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-royalBlue h-full" style={{width: `${(i+1)*25}%`}}></div>
                      </div>
                   </div>
                 ))}
              </div>
              
              <div className="bg-navyBlack text-white p-6 rounded-xl flex items-center justify-between shadow-lg">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-royalBlue flex items-center justify-center font-bold">45%</div>
                    <div>
                      <div className="font-bold">Client Acquisition Module</div>
                      <div className="text-sm text-slate-400">Chapter 4: Pitching International Clients</div>
                    </div>
                 </div>
                 <button className="px-4 py-2 bg-white text-navyBlack text-sm font-bold rounded-lg hover:bg-slate-100">Resume Learning</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardPreview;