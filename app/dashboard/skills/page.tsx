"use client"

import { useState, useEffect } from "react"
import { Lock, Play, Clock, BookOpen } from "lucide-react"
import Link from "next/link"

interface Course {
  id: number
  title: string
  slug: string
  subtitle: string
  short_description: string
  description: string
  thumbnail_url: string
  preview_video_url: string
  is_published: number
  mentor_id: number
  certificate_template_id: number
  plan_id: number
  estimated_duration_seconds: number
  total_lessons: number
  total_modules: number
  created_at: string
  updated_at: string
}

export default function MySkillsPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true)
        const response = await fetch("https://srv.digitalmadrasa.co.in/api/v1/courses")

        if (!response.ok) {
          throw new Error("Failed to fetch courses")
        }

        const data = await response.json()
        if (data.success && data.items) {
          setCourses(data.items)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        console.error("Error fetching courses:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [])

  const comingSoon = [
    {
      id: 1,
      title: "Copywriting Mastery",
      icon: "✍️",
      launch: "Fall 2024",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      id: 2,
      title: "Figma UI/UX Design",
      icon: "🎨",
      launch: "Fall 2024",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      id: 3,
      title: "Video Editing Wizard",
      icon: "🎬",
      launch: "Fall 2024",
      gradient: "from-orange-500 to-red-500",
    },
    {
      id: 4,
      title: "Graphic Design Fundamentals",
      icon: "🖼️",
      launch: "Fall 2024",
      gradient: "from-green-500 to-teal-500",
    },
  ]

  const filteredCourses = courses.filter((course) => course.is_published === 1)

  const durationHours = (seconds: number) => {
    return Math.ceil(seconds / 3600)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-jakarta font-bold text-gray-900">My Skills</h1>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-[#0066ff] rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-600 text-sm">Loading courses...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 text-sm">Error: {error}</p>
        </div>
      )}

      {/* Skills Grid */}
      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-xl sm:rounded-2xl overflow-hidden border border-gray-200 hover:border-[#0066ff]/50 hover:shadow-xl transition-all duration-300 group"
                >
                  {/* Thumbnail */}
                  <div className="relative h-40 sm:h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    <img
                      src={course.thumbnail_url || "/placeholder.svg?height=240&width=400"}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Overlay on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-full flex items-center justify-center shadow-2xl transform scale-90 group-hover:scale-100 transition-transform duration-300">
                          <Play className="w-5 h-5 sm:w-6 sm:h-6 text-[#0066ff] ml-0.5 fill-[#0066ff]" />
                        </div>
                      </div>
                    </div>


                  </div>

                  {/* Content */}
                  <div className="p-4 sm:p-5">
                    <h3 className="font-jakarta font-bold text-base sm:text-lg text-gray-900 mb-2 sm:mb-3 group-hover:text-[#0066ff] transition-colors line-clamp-2">
                      {course.title}
                    </h3>

                    {/* Subtitle */}
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">
                      {course.subtitle || course.short_description}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-3 sm:gap-4 mb-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span>{course.total_lessons} Lessons</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span>{durationHours(course.estimated_duration_seconds)}h</span>
                      </div>
                    </div>

                    <Link
                      href={`/dashboard/skills/${course.id}`}
                      className="block w-full py-2.5 sm:py-3 bg-gray-900 text-white rounded-lg font-medium text-xs sm:text-sm hover:bg-[#0066ff] transition-colors duration-300 active:scale-95 text-center"
                    >
                      Start Learning
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-600 text-sm">No courses found</p>
              </div>
            )}
          </div>

          {/* Coming Soon Section */}
          <div className="mt-8 sm:mt-12">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-jakarta font-bold text-gray-900">Coming Soon</h2>
              <span className="px-2 sm:px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                New
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {comingSoon.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 group relative overflow-hidden"
                >
                  {/* Lock Icon */}
                  <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                    </div>
                  </div>

                  {/* Icon */}
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-2xl sm:text-3xl mb-3 sm:mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    {item.icon}
                  </div>

                  <h3 className="font-jakarta font-bold text-sm sm:text-base text-gray-900 mb-2 line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-500 mb-4 sm:mb-5 font-medium">Launching in {item.launch}</p>

                  <button className="w-full py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium text-xs sm:text-sm hover:border-[#0066ff] hover:text-[#0066ff] hover:bg-[#0066ff]/5 transition-all duration-300 active:scale-95">
                    Notify Me
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
