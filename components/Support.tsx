import React from 'react';
import { MessageCircle, Mail, HeartHandshake } from 'lucide-react';

const Support: React.FC = () => {
  return (
    <section className="py-16 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
        <div>
          <h2 className="text-2xl font-bold text-navyBlack mb-2">Need Help?</h2>
          <p className="text-slate-500">We are committed to your learning journey. Available 24/7.</p>
        </div>
        
        <div className="flex flex-wrap gap-4 justify-center md:justify-end">
          <div className="flex items-center gap-2 px-5 py-3 bg-slate-50 text-slate-700 rounded-lg font-medium border border-slate-100">
            <Mail size={18} /> Email Support
          </div>
          <div className="flex items-center gap-2 px-5 py-3 bg-green-50 text-green-700 rounded-lg font-medium border border-green-100">
            <MessageCircle size={18} /> WhatsApp Helpdesk
          </div>
          <div className="flex items-center gap-2 px-5 py-3 bg-blue-50 text-royalBlue rounded-lg font-medium border border-blue-100">
            <HeartHandshake size={18} /> Student Care Team
          </div>
        </div>
      </div>
    </section>
  );
};

export default Support;