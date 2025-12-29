import Link from "next/link"
import { getCourse, formatDuration, getYouTubeVideoId } from "@/lib/api"
import { Clock, BookOpen, Award, ArrowLeft, PlayCircle, CheckCircle2, Globe, BarChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import { Badge } from "@/components/ui/badge"

import { Metadata } from "next"

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { id } = await Promise.resolve(params); // unwrapping params just in case future Next.js requires it
  try {
    const res = await getCourse(id);
    const course = res.data;
    if (!course) return { title: "Course Not Found" };

    return {
      title: `${course.title} | Digital Madarsa`,
      description: course.short_description || course.description?.substring(0, 160) || `Learn ${course.title} at Digital Madarsa.`,
      openGraph: {
        title: course.title,
        description: course.short_description || course.description?.substring(0, 160),
        images: course.thumbnail_url ? [{ url: course.thumbnail_url }] : [],
      }
    }
  } catch (e) {
    return { title: "Course Not Found" }
  }
}

export default async function CoursePage({ params }: { params: { id: string } }) {
  let course;
  try {
    const res = await getCourse(params.id);
    course = res.data;
  } catch (e) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
            <p className="text-slate-400 mb-6">The course you are looking for does not exist or could not be loaded.</p>
            <Link href="/courses">
              <Button>Back to Courses</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": course.title,
    "description": course.short_description || course.description,
    "provider": {
      "@type": "Organization",
      "name": "Digital Madarsa",
      "sameAs": "https://digitalmadrasa.co.in"
    }
  };

  const videoId = getYouTubeVideoId(course.preview_video_url)

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-[#0066ff] selection:text-white flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-16">
        {/* Back Button */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
          <Link href="/courses" className="inline-flex items-center text-slate-400 hover:text-white transition-colors group">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Courses
          </Link>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-12">

            {/* Left Column: Main Content */}
            <div className="lg:col-span-2 space-y-8">

              {/* Header Info */}
              <div>
                <Badge variant="outline" className="mb-4 border-[#0066ff]/20 bg-[#0066ff]/10 text-blue-400 px-3 py-1 rounded-full">
                  Skill Development
                </Badge>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading mb-4 text-balance leading-tight">
                  {course.title}
                </h1>
                {course.subtitle && (
                  <p className="text-lg text-slate-400 text-pretty leading-relaxed">
                    {course.subtitle}
                  </p>
                )}

                <div className="flex flex-wrap gap-6 mt-6 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span>{formatDuration(course.estimated_duration_seconds)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    <span>{course.total_modules} Modules</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart className="w-4 h-4 text-amber-400" />
                    <span>Beginner Friendly</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-purple-400" />
                    <span>English/Hindi</span>
                  </div>
                </div>
              </div>

              {/* Video Player */}
              <div className="rounded-2xl overflow-hidden bg-black shadow-[0_0_50px_-15px_rgba(0,102,255,0.3)] border border-white/10 relative aspect-video group">
                {videoId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                    title={course.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <>
                    <img
                      src={course.thumbnail_url || "/placeholder.svg"}
                      alt={course.title}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <PlayCircle className="w-20 h-20 text-white/80" />
                    </div>
                  </>
                )}
              </div>

              {/* Tabs Section (Description) */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                <h2 className="text-xl font-bold mb-4 font-heading text-white">About This Course</h2>
                <div className="prose prose-invert prose-sm sm:prose-base max-w-none text-slate-300">
                  {course.description || course.short_description || "No description available."}
                </div>
              </div>

            </div>

            {/* Right Column: Sticky Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-28 space-y-6">
                {/* Enroll Card */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl">
                  <div className="text-3xl font-bold text-white mb-2">Free</div>
                  <p className="text-slate-400 text-sm mb-6">Included with your Free Enrollment</p>

                  <Link href="/enroll/complete" className="block w-full">
                    <Button size="lg" className="w-full bg-[#0066ff] hover:bg-blue-600 text-white text-lg font-semibold h-12 rounded-xl shadow-[0_0_20px_-5px_rgba(0,102,255,0.5)] hover:shadow-[0_0_25px_-5px_rgba(0,102,255,0.6)] transition-all transform hover:-translate-y-0.5">
                      Enroll Now
                    </Button>
                  </Link>

                  <div className="mt-6 space-y-4">
                    <h4 className="font-semibold text-white text-sm uppercase tracking-wider">This Course Includes</h4>
                    <ul className="space-y-3 text-sm text-slate-300">
                      <li className="flex items-start gap-3">
                        <PlayCircle className="w-5 h-5 text-blue-400 shrink-0" />
                        <span>{course.total_lessons || 0} Video Lessons</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Award className="w-5 h-5 text-purple-400 shrink-0" />
                        <span>Certificate of Completion</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Globe className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>Access on Mobile & TV</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                        <span>Full Lifetime Access</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Mentor (Placeholder if data implies) */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-xl font-bold">DM</div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase">Instructor</p>
                    <h4 className="font-bold text-white">Digital Madarsa Team</h4>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
