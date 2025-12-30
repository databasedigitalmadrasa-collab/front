import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Loader2 } from 'lucide-react';

interface Mentor {
  id: number;
  name: string;
  title: string;
  bio: string;
  profile_picture: string | null;
  created_at: string;
  updated_at: string;
}

interface MentorsResponse {
  success: boolean;
  items: Mentor[];
}

const Mentors: React.FC = () => {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const response = await apiClient.get<MentorsResponse>('/mentors');
        if (response.success && response.data?.items) {
          setMentors(response.data.items);
        } else {
          setError(response.message || 'Failed to fetch mentors');
        }
      } catch (err) {
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchMentors();
  }, []);

  const getImageUrl = (path: string | null) => {
    if (!path) return undefined;
    if (path.startsWith('http')) return path;
    // Assuming relative paths are served from the main server domain if not CDN
    return `https://srv.digitalmadrasa.co.in${path}`;
  };

  return (
    <section id="mentors" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16 max-w-3xl">
          <h2 className="text-4xl font-bold text-navy-black mb-6">Meet Your Mentors</h2>
          <p className="text-lg text-slate-600 mb-4">
            Handpicked. Experienced. Each mentor brings <strong>real-world international client experience</strong>.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-royal-blue" size={48} />
          </div>
        ) : error ? (
          <div className="text-center text-red-500 bg-red-50 p-6 rounded-xl border border-red-100">
            <p>Failed to load mentors. Please try again later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {mentors.map((mentor) => (
              <div key={mentor.id} className="bg-off-white rounded-2xl overflow-hidden border border-slate-100 hover:shadow-xl transition-all hover:-translate-y-1 group flex flex-col h-full">
                <div className="aspect-[4/4] overflow-hidden bg-slate-200">
                  <img
                    src={getImageUrl(mentor.profile_picture)}
                    alt={mentor.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=No+Image';
                    }}
                  />
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold text-navy-black mb-1">{mentor.name}</h3>
                  <p className="text-sm text-royal-blue font-bold mb-3 min-h-[40px] uppercase tracking-wide">{mentor.title}</p>
                  <p className="text-slate-500 text-sm leading-relaxed flex-grow line-clamp-4">{mentor.bio}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 text-center border-t border-slate-100 pt-8">
          <p className="text-slate-500 italic font-medium">
            These are mentors who worked in the real world — not teachers reading from a Google document.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Mentors;
