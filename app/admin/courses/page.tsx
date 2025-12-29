"use client"

import { useState, useEffect } from "react"
import { Search, Plus, MoreVertical, Trash2, Edit, Eye, Check, X, Clock, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { getAdminToken } from "@/lib/auth"

interface Course {
  id: number
  title: string
  slug: string
  subtitle?: string
  short_description?: string
  description?: string
  thumbnail_url?: string
  preview_video_url?: string
  is_published: number | boolean
  mentor_id?: number
  certificate_template_id?: number
  plan_id?: number
  estimated_duration_seconds?: number
  total_lessons?: number
  total_modules?: number
  created_at: string
  updated_at: string
}

export default function ManageCoursesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null)
  const [publishLoading, setPublishLoading] = useState<number | null>(null)
  const { toast } = useToast()

  const API_BASE_URL = "https://srv.digitalmadrasa.co.in/api/v1"

  const fetchCourses = async () => {
    setLoading(true)
    try {
      const token = getAdminToken()
      const response = await fetch(`${API_BASE_URL}/courses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.success && data.items) {
        setCourses(data.items || [])
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to fetch courses",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching courses:", error)
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCourse = async (courseId: number) => {
    if (!confirm("Are you sure you want to delete this course?")) return

    setDeleteLoading(courseId)
    try {
      const token = getAdminToken()
      const response = await apiClient.delete(`/courses/${courseId}`, token)

      if (response.success) {
        toast({
          title: "Success",
          description: "Course deleted successfully",
        })
        fetchCourses()
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete course",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting course:", error)
      toast({
        title: "Error",
        description: "Failed to delete course",
        variant: "destructive",
      })
    } finally {
      setDeleteLoading(null)
    }
  }

  const handlePublishToggle = async (courseId: number, currentPublishStatus: boolean | number) => {
    setPublishLoading(courseId)
    try {
      const token = getAdminToken()
      const isPublished = typeof currentPublishStatus === "number" ? currentPublishStatus === 1 : currentPublishStatus

      const response = await fetch(`${API_BASE_URL}/courses/${courseId}/publish`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ publish: !isPublished }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: isPublished ? "Course unpublished successfully" : "Course published successfully",
        })
        fetchCourses()
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update course status",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating course:", error)
      toast({
        title: "Error",
        description: "Failed to update course status",
        variant: "destructive",
      })
    } finally {
      setPublishLoading(null)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  const filteredCourses = courses.filter((course) => course.title.toLowerCase().includes(searchQuery.toLowerCase()))

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A"
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 mb-6 sm:mb-8 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold mb-2">Manage Courses</h1>
            <p className="text-sm sm:text-base text-white/90">Create, edit, and manage all platform courses</p>
          </div>
          <Link href="/admin/courses/new">
            <Button className="bg-white text-blue-600 hover:bg-white/90 font-semibold shadow-lg">
              <Plus className="w-4 h-4 mr-2" />
              Create New Course
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base border-gray-200 focus:border-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const isPublished =
              typeof course.is_published === "number" ? course.is_published === 1 : course.is_published

            return (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group"
              >
                <div className="relative h-52 bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url || "/placeholder.svg"}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-blue-300" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span
                      className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm ${
                        isPublished ? "bg-green-500/90 text-white" : "bg-orange-500/90 text-white"
                      }`}
                    >
                      {isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="bg-white/95 backdrop-blur-sm hover:bg-white shadow-lg"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/admin/courses/${course.id}/edit`}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                            Edit Course
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => handlePublishToggle(course.id, isPublished)}
                          disabled={publishLoading === course.id}
                          className="flex items-center gap-2"
                        >
                          {isPublished ? (
                            <>
                              <X className="w-4 h-4" />
                              {publishLoading === course.id ? "Unpublishing..." : "Unpublish"}
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              {publishLoading === course.id ? "Publishing..." : "Publish"}
                            </>
                          )}
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          className="flex items-center gap-2 text-red-600 focus:text-red-600"
                          onClick={() => handleDeleteCourse(course.id)}
                          disabled={deleteLoading === course.id}
                        >
                          <Trash2 className="w-4 h-4" />
                          {deleteLoading === course.id ? "Deleting..." : "Delete"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="p-6">
                  <Link href={`/admin/courses/${course.id}/edit`}>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors line-clamp-2 min-h-[3.5rem]">
                      {course.title}
                    </h3>
                  </Link>

                  {course.subtitle && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[2.5rem]">{course.subtitle}</p>
                  )}

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <BookOpen className="w-4 h-4 text-blue-500" />
                      </div>
                      <p className="text-lg font-bold text-gray-900">{course.total_modules || 0}</p>
                      <p className="text-xs text-gray-500">Modules</p>
                    </div>

                    <div className="text-center border-x border-gray-100">
                      <div className="flex items-center justify-center mb-1">
                        <Eye className="w-4 h-4 text-green-500" />
                      </div>
                      <p className="text-lg font-bold text-gray-900">{course.total_lessons || 0}</p>
                      <p className="text-xs text-gray-500">Lessons</p>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Clock className="w-4 h-4 text-orange-500" />
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {formatDuration(course.estimated_duration_seconds)}
                      </p>
                      <p className="text-xs text-gray-500">Duration</p>
                    </div>
                  </div>

                  <Link href={`/admin/courses/${course.id}/edit`} className="mt-4 block">
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Course
                    </Button>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loading && filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No courses found matching your search.</p>
        </div>
      )}
    </div>
  )
}
