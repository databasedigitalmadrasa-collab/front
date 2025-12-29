"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Award, Search, Loader2, Download, Eye, Calendar } from "lucide-react"
import apiClient from "@/lib/api-client"
import { getUser } from "@/lib/user-auth"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<any[]>([])
  const [courses, setCourses] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const user = getUser()

  useEffect(() => {
    async function fetchData() {
      if (!user) return

      try {
        setLoading(true)
        // 1. Fetch Certificates
        const certRes = await apiClient.get<any>(`/learner-certificates?user_id=${user.id}`)
        if (certRes.success && certRes.data?.items) {
          const certs = certRes.data.items || []
          setCertificates(certs)

          // 2. Fetch Course Details for each certificate
          const courseIds = [...new Set(certs.map((c: any) => c.course_id))]
          const coursePromises = courseIds.map(id => apiClient.get<any>(`/courses/${id}`))
          const courseResponses = await Promise.all(coursePromises)

          const courseMap: Record<string, any> = {}
          courseResponses.forEach((res) => {
            if (res.data?.success && res.data?.data) {
              courseMap[res.data.data.id] = res.data.data
            }
          })
          setCourses(courseMap)
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load certificates",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-[#150101] mb-3 text-left lg:text-4xl">
            My Certificates
          </h1>
          <p className="text-gray-600 text-left">
            {certificates.length > 0
              ? `You have earned ${certificates.length} certificate${certificates.length > 1 ? 's' : ''}`
              : "Complete courses to earn your professional certificates"
            }
          </p>
        </div>

        {certificates.length > 0 ? (
          <div className="grid gap-6 sm:gap-8">
            {certificates.map((cert) => {
              const course = courses[cert.course_id]
              const date = new Date(cert.issue_timestamp).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
              })

              return (
                <div
                  key={cert.id}
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-4 sm:p-6"
                >
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Certificate Preview / Thumbnail */}
                    <div className="sm:w-72 flex-shrink-0">
                      <Link href={`/dashboard/certificate/${cert.course_id}/${cert.id}`} className="block">
                        <div className="relative aspect-[16/11] rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-100 flex items-center justify-center hover:opacity-90 transition">
                          {course?.thumbnail_url || course?.thumbnail ? (
                            <img src={course.thumbnail_url || course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                          ) : (
                            <Award className="w-16 h-16 text-blue-300" />
                          )}
                        </div>
                      </Link>
                    </div>

                    {/* Certificate Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <Badge className="bg-green-100 text-green-700 border-0 mb-3 hover:bg-green-200">Verified</Badge>
                        <Link href={`/dashboard/certificate/${cert.course_id}/${cert.id}`} className="block group">
                          <h3 className="text-2xl font-heading font-bold text-[#150101] mb-2 group-hover:text-[#0066ff] transition">
                            {course?.title || "Course Certificate"}
                          </h3>
                        </Link>
                        {course?.instructor && (
                          <p className="text-gray-600 mb-4">Instructor: {course.instructor}</p>
                        )}

                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>Issued on {date}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">ID: {cert.id}</div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-3 mt-6">
                        <Link href={`/dashboard/certificate/${cert.course_id}/${cert.id}`}>
                          <Button className="w-full bg-[#0066ff] hover:bg-blue-700 text-white rounded-xl gap-2 h-12 text-base shadow-sm group-hover:shadow-md transition-all">
                            <Download className="w-4 h-4" /> View Certificate
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl mb-6 shadow-sm">
              <Award className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">No certificate claimed yet</h3>
            <p className="text-gray-600">Complete a course to claim your certificate.</p>
            <Link href="/dashboard/skills">
              <Button className="mt-6 bg-[#0066ff] hover:bg-[#0052cc] text-white">
                Browse Courses
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
