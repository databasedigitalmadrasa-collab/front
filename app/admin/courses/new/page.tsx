"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ChevronLeft, Upload, Loader2 } from "lucide-react"
import Link from "next/link"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { getAdminToken } from "@/lib/auth"

const API_BASE_URL = "https://srv.digitalmadrasa.co.in/api/v1"

// Helper function to generate slug from title
const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

interface Mentor {
  id: number
  name: string
}

interface Plan {
  id: number
  title: string
}

interface CertificateTemplate {
  id: number
  name: string
}

export default function NewCoursePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [certificateTemplates, setCertificateTemplates] = useState<CertificateTemplate[]>([])

  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    subtitle: "",
    short_description: "",
    description: "",
    thumbnail_url: "",
    preview_video_url: "",
    is_published: false,
    mentor_id: "",
    certificate_template_id: "",
    plan_id: "",
    estimated_duration_seconds: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getAdminToken()

        const [mentorsRes, plansRes, certificatesRes] = await Promise.all([
          apiClient.get<{ items: Mentor[] }>("/mentors", token),
          apiClient.get<{ items: Plan[] }>("/subscription-plans", token),
          apiClient.get<{ items: CertificateTemplate[] }>("/certificate-templates", token),
        ])

        if (mentorsRes.success && mentorsRes.data) {
          setMentors(mentorsRes.data.items || [])
        }
        if (plansRes.success && plansRes.data) {
          setPlans(plansRes.data.items || [])
        }
        if (certificatesRes.success && certificatesRes.data) {
          setCertificateTemplates(certificatesRes.data.items || [])
        }
      } catch (error) {
        console.error("Error fetching form data:", error)
      }
    }

    fetchData()
  }, [])

  const handleImageUpload = async (file: File) => {
    setIsUploadingImage(true)
    setUploadProgress(0)

    try {
      const fileName = `course-${Date.now()}-${file.name.replace(/\s+/g, "-")}`
      const uploadPath = `course-res/${fileName}`
      const contentType = file.type || "image/jpeg"

      const xhr = new XMLHttpRequest()

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(progress)
        }
      }

      const uploadPromise = new Promise<boolean>((resolve) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(true)
          } else {
            resolve(false)
          }
        }

        xhr.onerror = () => resolve(false)
        xhr.onabort = () => resolve(false)

        const uploadUrl = `${API_BASE_URL}/static/objects?path=${encodeURIComponent(uploadPath)}&contentType=${encodeURIComponent(contentType)}`
        xhr.open("POST", uploadUrl)
        xhr.send(file)
      })

      const success = await uploadPromise

      if (success) {
        const imageUrl = `https://cdn.digitalmadrasa.co.in/${uploadPath}`
        setFormData({ ...formData, thumbnail_url: imageUrl })

        toast({
          title: "Success",
          description: "Thumbnail uploaded successfully",
        })
      } else {
        throw new Error("Upload failed")
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingImage(false)
      setUploadProgress(0)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const updatedData = { ...formData }

    if (type === "checkbox") {
      updatedData[name as keyof typeof formData] = (e.target as HTMLInputElement).checked as any
    } else {
      updatedData[name as keyof typeof formData] = value as any
    }

    // Auto-generate slug when title changes
    if (name === "title") {
      updatedData.slug = generateSlug(value)
    }

    setFormData(updatedData)
  }

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a course title",
        variant: "destructive",
      })
      return
    }

    if (!formData.slug.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a course slug",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const token = getAdminToken()

      // Prepare request body
      const requestBody = {
        title: formData.title,
        slug: formData.slug,
        subtitle: formData.subtitle || undefined,
        short_description: formData.short_description || undefined,
        description: formData.description || undefined,
        thumbnail_url: formData.thumbnail_url || undefined,
        preview_video_url: formData.preview_video_url || undefined,
        is_published: formData.is_published,
        mentor_id: formData.mentor_id ? Number(formData.mentor_id) : undefined,
        certificate_template_id: formData.certificate_template_id
          ? Number(formData.certificate_template_id)
          : undefined,
        plan_id: formData.plan_id ? Number(formData.plan_id) : undefined,
        estimated_duration_seconds: formData.estimated_duration_seconds
          ? Number(formData.estimated_duration_seconds)
          : undefined,
      }

      const response = await apiClient.post<{ id: number }>("/courses", requestBody, token)

      if (response.success && response.data) {
        toast({
          title: "Success",
          description: "Course created successfully",
        })
        router.push("/admin/courses")
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to create course",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating course:", error)
      toast({
        title: "Error",
        description: "Failed to create course",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = formData.title.trim() && formData.slug.trim()

  return (
    <div className="min-h-screen bg-[#fafafa] p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/admin/courses">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Courses
            </Button>
          </Link>
        </div>

        {/* Header Section */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 mb-6 sm:mb-8 text-white shadow-lg">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold mb-2">Create New Course</h1>
          <p className="text-sm sm:text-base text-white/90">
            Set up your course details and start building your curriculum
          </p>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
          {/* Basic Information */}
          <div className="space-y-5 pb-6 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-heading font-bold text-gray-900">Basic Information</h2>

            <div>
              <Label htmlFor="title" className="text-sm font-semibold mb-2 block">
                Course Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Advanced React Patterns"
                className="h-11"
              />
            </div>

            {/* Auto-generated Slug */}
            <div>
              <Label htmlFor="slug" className="text-sm font-semibold mb-2 block">
                Slug <span className="text-gray-500 text-xs">(auto-generated)</span>
              </Label>
              <Input id="slug" name="slug" value={formData.slug} readOnly className="h-11 bg-gray-50" />
            </div>

            <div>
              <Label htmlFor="subtitle" className="text-sm font-semibold mb-2 block">
                Course Subtitle
              </Label>
              <Input
                id="subtitle"
                name="subtitle"
                value={formData.subtitle}
                onChange={handleChange}
                placeholder="e.g., Master advanced React concepts and best practices"
                className="h-11"
              />
            </div>

            <div>
              <Label htmlFor="short_description" className="text-sm font-semibold mb-2 block">
                Short Description
              </Label>
              <Textarea
                id="short_description"
                name="short_description"
                value={formData.short_description}
                onChange={handleChange}
                placeholder="Brief description for course listings (max 160 characters)"
                rows={2}
                className="resize-none"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-semibold mb-2 block">
                Full Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Detailed course description (supports markdown)"
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          {/* Media & Content */}
          <div className="space-y-5 pb-6 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-heading font-bold text-gray-900">Media & Content</h2>

            <div>
              <Label htmlFor="thumbnail_url" className="text-sm font-semibold mb-2 block">
                Thumbnail
              </Label>
              <div className="flex gap-2">
                <Input
                  id="thumbnail_url"
                  name="thumbnail_url"
                  value={formData.thumbnail_url}
                  onChange={handleChange}
                  placeholder="https://example.com/thumbnail.jpg"
                  className="h-11 flex-1"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleImageUpload(file)
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="h-11"
                >
                  {isUploadingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {uploadProgress}%
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
              {formData.thumbnail_url && (
                <div className="mt-3">
                  <img
                    src={formData.thumbnail_url || "/placeholder.svg"}
                    alt="Thumbnail preview"
                    className="w-40 h-24 object-cover rounded-lg border border-gray-200"
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="preview_video_url" className="text-sm font-semibold mb-2 block">
                Preview Video URL
              </Label>
              <Input
                id="preview_video_url"
                name="preview_video_url"
                value={formData.preview_video_url}
                onChange={handleChange}
                placeholder="https://example.com/preview.mp4"
                className="h-11"
              />
              <p className="text-xs text-gray-500 mt-1">YouTube or Vimeo URL</p>
            </div>
          </div>

          {/* Course Configuration */}
          <div className="space-y-5 pb-6 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-heading font-bold text-gray-900">Course Configuration</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="mentor_id" className="text-sm font-semibold mb-2 block">
                  Course Mentor
                </Label>
                <select
                  id="mentor_id"
                  name="mentor_id"
                  value={formData.mentor_id}
                  onChange={handleChange}
                  className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select mentor...</option>
                  {mentors.map((mentor) => (
                    <option key={mentor.id} value={mentor.id}>
                      {mentor.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="certificate_template_id" className="text-sm font-semibold mb-2 block">
                  Certificate Template
                </Label>
                <select
                  id="certificate_template_id"
                  name="certificate_template_id"
                  value={formData.certificate_template_id}
                  onChange={handleChange}
                  className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select certificate template...</option>
                  {certificateTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="plan_id" className="text-sm font-semibold mb-2 block">
                  Course Plan
                </Label>
                <select
                  id="plan_id"
                  name="plan_id"
                  value={formData.plan_id}
                  onChange={handleChange}
                  className="w-full h-11 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select plan...</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="estimated_duration_seconds" className="text-sm font-semibold mb-2 block">
                  Duration (seconds)
                </Label>
                <Input
                  id="estimated_duration_seconds"
                  name="estimated_duration_seconds"
                  type="number"
                  value={formData.estimated_duration_seconds}
                  onChange={handleChange}
                  placeholder="e.g., 3600 (1 hour)"
                  className="h-11"
                  min="0"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_published"
                name="is_published"
                checked={formData.is_published}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <Label htmlFor="is_published" className="text-sm font-semibold cursor-pointer">
                Publish course immediately
              </Label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button onClick={handleCreate} className="flex-1" size="lg" disabled={!isFormValid || loading}>
              {loading ? "Creating..." : "Create Course"}
            </Button>
            <Link href="/admin/courses" className="flex-1">
              <Button variant="outline" className="w-full bg-transparent" size="lg">
                Cancel
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
