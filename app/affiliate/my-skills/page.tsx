"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, RefreshCw, Clock, ArrowRight, GraduationCap } from "lucide-react"
import { useEffect, useState } from "react"
import apiClient from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
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
  certificate_template_id: number | null
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

  const { toast } = useToast()

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get<{ success: boolean; items: Course[] }>("/courses")

      if (response.success && response.data) {
        setCourses(response.data.items || [])
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to load skills",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching courses:", error)
      toast({
        title: "Error",
        description: "Failed to load skills",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "0h 0m"
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const publishedCourses = courses.filter((course) => course.is_published === 1)

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto min-h-screen bg-[#fafafa]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-gray-900 tracking-tight">
            Explore Skills
          </h1>
          <p className="text-gray-500 mt-2 text-base leading-relaxed max-w-2xl">
            Discover new skills and expand your knowledge base with our comprehensive courses.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchCourses}
          disabled={loading}
          className="gap-2 border-gray-200 hover:bg-white hover:border-gray-300 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : publishedCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {publishedCourses.map((course) => (
            <Link href={`/courses/${course.id}`} key={course.id} className="group block h-full">
              <Card className="h-full flex flex-col bg-white border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden hover:-translate-y-1">
                {/* Thumbnail */}
                <div className="relative aspect-video w-full bg-gray-100 overflow-hidden">
                  <img
                    src={course.thumbnail_url || "/placeholder.svg"}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Floating Badge */}
                  <div className="absolute top-3 right-3">
                    <div className="bg-white/95 backdrop-blur-sm text-gray-900 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(course.estimated_duration_seconds)}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-5 lg:p-6 flex flex-col">
                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="text-xs font-medium text-[#0066ff] mb-1.5 uppercase tracking-wide">
                        {course.subtitle || "Skill Development"}
                      </p>
                      <h3 className="text-xl font-heading font-bold text-gray-900 line-clamp-2 leading-tight group-hover:text-[#0066ff] transition-colors">
                        {course.title}
                      </h3>
                    </div>

                    <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                      {course.short_description || "Enhance your professional skills with this comprehensive course."}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-medium text-gray-500">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-md text-gray-600">
                        <GraduationCap className="w-4 h-4" />
                        <span>{course.total_lessons} Lessons</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[#0066ff] font-bold group-hover:translate-x-1 transition-transform">
                      <span>View Course</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <BookOpen className="w-16 h-16 text-gray-200 mb-4" />
          <h3 className="text-lg font-bold text-gray-900">No skills found</h3>
          <p className="text-gray-500 text-sm">Check back later for new content.</p>
        </div>
      )}
    </div>
  )
}
