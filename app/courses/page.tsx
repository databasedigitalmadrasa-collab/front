import Link from "next/link"
import { getCourses, formatDuration } from "@/lib/api"
import { Clock, BookOpen, PlayCircle, Star, ShieldCheck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import { Badge } from "@/components/ui/badge"

export const metadata = {
  title: "Premium Courses - Digital Madarsa",
  description: "Master high-paying digital skills with our expert-led courses.",
}

export default async function CoursesPage() {
  const { items: courses } = await getCourses()

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-[#0066ff] selection:text-white flex flex-col">
      <Navbar />

      <main className="flex-grow pt-24 pb-16">
        {/* Hero Section */}
        <section className="relative px-4 sm:px-6 lg:px-8 mb-16">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#0066ff]/20 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto text-center relative z-10">
            <Badge variant="outline" className="mb-6 border-white/10 bg-white/5 text-blue-400 px-4 py-1.5 rounded-full backdrop-blur-sm">
              <Star className="w-3.5 h-3.5 mr-2 fill-blue-400" />
              World-Class Learning
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold font-heading text-balance mb-6 tracking-tight">
              Master the Skills of <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0066ff] to-blue-400">
                Tomorrow, Today
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Explore our comprehensive curriculum designed to take you from beginner to industry expert.
            </p>
          </div>
        </section>

        {/* Courses Grid */}
        <section className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map((course) => (
                <Link key={course.id} href={`/courses/${course.id}`} className="group h-full">
                  <div className="h-full bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-[#0066ff]/50 transition-all duration-500 hover:shadow-[0_0_50px_-12px_rgba(0,102,255,0.3)] hover:-translate-y-2 flex flex-col backdrop-blur-sm">
                    {/* Thumbnail */}
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={course.thumbnail_url || "/placeholder.svg"}
                        alt={course.title}
                        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700 filter brightness-90 group-hover:brightness-100"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-500 flex items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-[2px]">
                        <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center transform scale-0 group-hover:scale-100 transition-all duration-500 delay-100">
                          <PlayCircle className="w-8 h-8 text-white fill-white/20" />
                        </div>
                      </div>
                      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-xs font-medium text-white flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        {formatDuration(course.estimated_duration_seconds)}
                      </div>
                    </div>

                    {/* Content */}
                    <CardContent className="p-6 flex-grow flex flex-col">
                      <div className="mb-4">
                        <h3 className="text-xl font-bold font-heading text-white mb-2 leading-tight group-hover:text-[#0066ff] transition-colors">
                          {course.title}
                        </h3>
                        <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed">
                          {course.short_description}
                        </p>
                      </div>

                      <div className="mt-auto pt-6 border-t border-white/10 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-slate-300">
                          <BookOpen className="w-4 h-4 text-blue-400" />
                          <span>{course.total_modules} Modules</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <span>Certified</span>
                        </div>
                      </div>

                      <div className="mt-6 flex items-center gap-2 text-[#0066ff] font-medium text-sm group-hover:gap-3 transition-all">
                        View Course Details
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                      </div>
                    </CardContent>
                  </div>
                </Link>
              ))}
            </div>

            {courses.length === 0 && (
              <div className="text-center py-20 bg-white/5 border border-white/10 rounded-3xl">
                <p className="text-slate-400 text-lg">No courses available at the moment.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
