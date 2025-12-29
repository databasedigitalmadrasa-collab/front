"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Plus,
  Save,
  Trash2,
  GripVertical,
  Video,
  FileText,
  Loader2,
  Upload,
  Pencil,
  File,
  FileImage,
  LinkIcon,
  Download,
  Edit2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import MediaSelectorModal from "@/components/admin/media-selector-modal"
import { getAdminToken } from "@/lib/auth"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const API_BASE_URL = "https://srv.digitalmadrasa.co.in/api/v1"

interface Resource {
  id: string
  lesson_id: string
  title: string
  resource_type: string
  url?: string
  file_url?: string
}

interface Lesson {
  id: string
  module_id: string
  course_id: string
  title: string
  position: number
  kind: string
  description?: string
  video_provider?: string
  video_url?: string
  r2_key?: string
  blob_url?: string
  drm_protected: boolean
  locked: boolean
  completed: boolean
  duration_seconds?: number
  duration?: string
  resources?: Resource[]
}

interface Module {
  id: string
  course_id: string
  title: string
  description?: string
  position: number
  lessons: Lesson[]
}

interface Course {
  id: string
  title: string
  description?: string
}

export default function CourseEditPage() {
  const params = useParams()
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null)
  const [expandedModules, setExpandedModules] = useState<string[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [currentLessonData, setCurrentLessonData] = useState<Partial<Lesson>>({})
  const [showResourceModal, setShowResourceModal] = useState(false)
  const [resourceName, setResourceName] = useState("")
  const [showMediaSelector, setShowMediaSelector] = useState(false)
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null)
  const [isUpdatingPosition, setIsUpdatingPosition] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { toast } = useToast()
  const router = useRouter()

  const [lessonResources, setLessonResources] = useState<Resource[]>([])
  const [isLoadingResources, setIsLoadingResources] = useState(false)
  const [showAddResourceModal, setShowAddResourceModal] = useState(false)
  const [editingResource, setEditingResource] = useState<Resource | null>(null)
  const [resourceFormData, setResourceFormData] = useState({
    title: "",
    resource_type: "pdf",
    url: "",
    file_url: "",
  })
  const [isUploadingResource, setIsUploadingResource] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const resourceFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadCourseData()
  }, [params.courseId])

  const loadCourseData = async () => {
    setIsLoading(true)
    try {
      // Load modules for this course
      const modulesResponse = await fetch(`${API_BASE_URL}/course-modules?course_id=${params.courseId}`)
      if (!modulesResponse.ok) throw new Error("Failed to fetch modules")

      const modulesData = await modulesResponse.json()
      console.log("Modules API response:", modulesData)

      // API returns { success: true, items: [...] }
      const fetchedModules: Module[] = (modulesData.items || modulesData.data || []).sort(
        (a: Module, b: Module) => a.position - b.position,
      )

      // Load lessons for this course (all at once, then distribute to modules)
      const lessonsResponse = await fetch(`${API_BASE_URL}/lessons?course_id=${params.courseId}`)
      if (!lessonsResponse.ok) throw new Error("Failed to fetch lessons")

      const lessonsData = await lessonsResponse.json()
      console.log("Lessons API response:", lessonsData)

      // API returns { success: true, items: [...] }
      const allLessons: Lesson[] = (lessonsData.items || lessonsData.data || []).sort(
        (a: Lesson, b: Lesson) => a.position - b.position,
      )

      const modulesWithLessons = fetchedModules.map((module: Module) => {
        const moduleLessons = allLessons.filter((lesson: Lesson) => {
          // Handle both number and string IDs
          return Number(lesson.module_id) === Number(module.id)
        })
        console.log(`Module ${module.id} (${module.title}) has ${moduleLessons.length} lessons`)
        return {
          ...module,
          id: String(module.id), // Normalize ID to string
          lessons: moduleLessons.map((l) => ({ ...l, id: String(l.id), module_id: String(l.module_id) })),
        }
      })

      setModules(modulesWithLessons)

      // Expand all modules by default
      setExpandedModules(modulesWithLessons.map((m: Module) => String(m.id)))

      // Set first lesson as selected if available
      if (modulesWithLessons.length > 0 && modulesWithLessons[0].lessons.length > 0) {
        const firstLesson = modulesWithLessons[0].lessons[0]
        setSelectedLesson(String(firstLesson.id))
        setCurrentLessonData(firstLesson)
        if (firstLesson.r2_key) {
          const duration = firstLesson.duration_seconds || 0
          const videoUrl = `/api/video?key=${encodeURIComponent(firstLesson.r2_key)}&duration=${duration}`
          setSelectedVideoUrl(videoUrl)
        }
      }

      // Load course details
      const courses = JSON.parse(localStorage.getItem("courses") || "[]")
      const courseData = courses.find((c: any) => String(c.id) === String(params.courseId))
      if (courseData) {
        setCourse(courseData)
      }
    } catch (error) {
      console.error("Error loading course data:", error)
      toast({
        title: "Error",
        description: "Failed to load course data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addModule = async () => {
    try {
      const newModuleData = {
        course_id: params.courseId,
        title: `Module ${modules.length + 1}`,
        position: modules.length,
        description: "",
      }

      const response = await fetch(`${API_BASE_URL}/course-modules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newModuleData),
      })

      if (!response.ok) throw new Error("Failed to create module")

      const result = await response.json()
      console.log("Create module response:", result)

      const newModule: Module = {
        ...(result.item || result.data),
        id: String(result.item?.id || result.data?.id), // Normalize ID to string
        lessons: [],
      }

      setModules([...modules, newModule])
      setExpandedModules([...expandedModules, String(newModule.id)])
      setEditingModuleId(String(newModule.id))

      toast({
        title: "Success",
        description: "Module created successfully",
      })
    } catch (error) {
      console.error("Error creating module:", error)
      toast({
        title: "Error",
        description: "Failed to create module",
        variant: "destructive",
      })
    }
  }

  const updateModuleTitle = async (moduleId: string, newTitle: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/course-modules/${moduleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      })

      if (!response.ok) throw new Error("Failed to update module")

      setModules(modules.map((m) => (String(m.id) === String(moduleId) ? { ...m, title: newTitle } : m)))
      setEditingModuleId(null)

      toast({
        title: "Success",
        description: "Module updated successfully",
      })
    } catch (error) {
      console.error("Error updating module:", error)
      toast({
        title: "Error",
        description: "Failed to update module",
        variant: "destructive",
      })
    }
  }

  const updateModulePosition = async (moduleId: string, direction: "up" | "down") => {
    const currentIndex = modules.findIndex((m) => String(m.id) === String(moduleId))
    if (currentIndex === -1) return

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= modules.length) return

    setIsUpdatingPosition(true)

    try {
      // Swap positions
      const updatedModules = [...modules]
      const currentModule = updatedModules[currentIndex]
      const swapModule = updatedModules[newIndex]

      // Update positions in API
      const [response1, response2] = await Promise.all([
        fetch(`${API_BASE_URL}/course-modules/${currentModule.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ position: newIndex }),
        }),
        fetch(`${API_BASE_URL}/course-modules/${swapModule.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ position: currentIndex }),
        }),
      ])

      if (!response1.ok || !response2.ok) throw new Error("Failed to update module positions")

      // Swap in local state
      updatedModules[currentIndex] = { ...swapModule, position: currentIndex }
      updatedModules[newIndex] = { ...currentModule, position: newIndex }

      setModules(updatedModules)

      toast({
        title: "Success",
        description: "Module position updated",
      })
    } catch (error) {
      console.error("Error updating module position:", error)
      toast({
        title: "Error",
        description: "Failed to update module position",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingPosition(false)
    }
  }

  const deleteModule = async (moduleId: string) => {
    if (!confirm("Are you sure you want to delete this module and all its lessons?")) return

    try {
      const response = await fetch(`${API_BASE_URL}/course-modules/${moduleId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete module")

      setModules(modules.filter((m) => String(m.id) !== String(moduleId)))
      if (selectedLesson) {
        const selectedModule = modules.find((m) => m.lessons.some((l) => String(l.id) === String(selectedLesson)))
        if (String(selectedModule?.id) === String(moduleId)) {
          setSelectedLesson(null)
          setCurrentLessonData({})
        }
      }

      toast({
        title: "Success",
        description: "Module deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting module:", error)
      toast({
        title: "Error",
        description: "Failed to delete module",
        variant: "destructive",
      })
    }
  }

  const addLesson = async (moduleId: string) => {
    try {
      const module = modules.find((m) => String(m.id) === String(moduleId))
      if (!module) {
        console.error("Module not found:", moduleId)
        return
      }

      console.log("Adding lesson to module:", moduleId, module)

      const newLessonData = {
        module_id: Number(moduleId), // Ensure module_id is a number for API
        course_id: Number(params.courseId), // Ensure course_id is a number for API
        title: `Lesson ${module.lessons.length + 1}`,
        position: module.lessons.length,
        kind: "video",
        video_provider: "cloudflare",
        drm_protected: false,
        locked: false,
        completed: false,
      }

      console.log("Creating lesson with data:", newLessonData)

      const response = await fetch(`${API_BASE_URL}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLessonData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Lesson creation failed:", errorText)
        throw new Error("Failed to create lesson")
      }

      const result = await response.json()
      console.log("Create lesson response:", result)

      const newLesson: Lesson = {
        ...(result.item || result.data),
        id: String(result.item?.id || result.data?.id), // Normalize ID to string
        module_id: String(moduleId),
      }

      setModules(
        modules.map((m) => (String(m.id) === String(moduleId) ? { ...m, lessons: [...m.lessons, newLesson] } : m)),
      )

      // Automatically select the new lesson
      setSelectedLesson(String(newLesson.id))
      setCurrentLessonData(newLesson)

      toast({
        title: "Success",
        description: "Lesson created successfully",
      })
    } catch (error) {
      console.error("Error creating lesson:", error)
      toast({
        title: "Error",
        description: "Failed to create lesson",
        variant: "destructive",
      })
    }
  }

  const saveLesson = async () => {
    if (!currentLessonData.title?.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a lesson title",
        variant: "destructive",
      })
      return
    }

    if (!selectedLesson) return

    setIsSaving(true)
    try {
      const updateData = {
        title: currentLessonData.title,
        description: currentLessonData.description || "",
        video_url: currentLessonData.video_url || "",
        r2_key: currentLessonData.r2_key || "",
        locked: currentLessonData.locked || false,
        duration_seconds: currentLessonData.duration_seconds || 0,
      }

      const response = await fetch(`${API_BASE_URL}/lessons/${selectedLesson}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) throw new Error("Failed to update lesson")

      const result = await response.json()
      const updatedLesson: Lesson = result.item || result.data

      setModules(
        modules.map((m) => ({
          ...m,
          lessons: m.lessons.map((l) => (String(l.id) === String(selectedLesson) ? updatedLesson : l)),
        })),
      )

      setHasUnsavedChanges(false)

      toast({
        title: "Success",
        description: "Lesson saved successfully",
      })
    } catch (error) {
      console.error("Error saving lesson:", error)
      toast({
        title: "Error",
        description: "Failed to save lesson",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const selectLesson = async (lessonId: string) => {
    if (hasUnsavedChanges) {
      const confirmSwitch = window.confirm("You have unsaved changes. Are you sure you want to switch lessons?")
      if (!confirmSwitch) return
    }

    const lesson = modules.flatMap((m) => m.lessons).find((l) => String(l.id) === String(lessonId))
    if (lesson) {
      setSelectedLesson(String(lesson.id))
      setCurrentLessonData(lesson)
      setHasUnsavedChanges(false)

      // Load video if r2_key exists
      if (lesson.r2_key) {
        const duration = lesson.duration_seconds || 0
        const videoUrl = `/api/video?key=${encodeURIComponent(lesson.r2_key)}&duration=${duration}`
        setSelectedVideoUrl(videoUrl)
      } else {
        setSelectedVideoUrl(null)
      }

      await fetchLessonResources(lessonId)
    }
  }



  const deleteLesson = async (lessonId: string) => {
    if (!confirm("Are you sure you want to delete this lesson?")) return

    try {
      const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete lesson")

      setModules(
        modules.map((m) => ({
          ...m,
          lessons: m.lessons.filter((l) => String(l.id) !== String(lessonId)),
        })),
      )

      if (String(selectedLesson) === String(lessonId)) {
        setSelectedLesson(null)
        setCurrentLessonData({})
        setSelectedVideoUrl(null)
      }

      toast({
        title: "Success",
        description: "Lesson deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting lesson:", error)
      toast({
        title: "Error",
        description: "Failed to delete lesson",
        variant: "destructive",
      })
    }
  }

  const toggleModuleExpansion = (moduleId: string) => {
    const moduleIdStr = String(moduleId)
    setExpandedModules((prev) =>
      prev.includes(moduleIdStr) ? prev.filter((id) => id !== moduleIdStr) : [...prev, moduleIdStr],
    )
  }

  const handleVideoSelect = (url: string, key: string) => {
    setCurrentLessonData({
      ...currentLessonData,
      video_url: url,
      r2_key: key,
    })

    setSelectedVideoUrl(getVideoUrlWithAuth(key))
    setShowMediaSelector(false)
  }

  const handleVideoMetadataLoaded = () => {
    if (videoRef.current) {
      const durationInSeconds = Math.floor(videoRef.current.duration)
      const minutes = Math.floor(durationInSeconds / 60)
      const seconds = durationInSeconds % 60
      const formattedDuration = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`

      setCurrentLessonData({
        ...currentLessonData,
        duration: formattedDuration,
        duration_seconds: durationInSeconds,
      })
      setHasUnsavedChanges(true)
    }
  }

  const currentModule = modules.find((m) => m.lessons.some((l) => String(l.id) === String(selectedLesson)))

  const getVideoUrlWithAuth = (key: string, duration?: number) => {
    const dur = duration || 0
    return `/api/video?key=${encodeURIComponent(key)}&duration=${dur}`
  }

  useEffect(() => {
    if (selectedVideoUrl && videoRef.current) {
      videoRef.current.src = selectedVideoUrl
    }
  }, [selectedVideoUrl])

  useEffect(() => {
    if (currentLessonData.r2_key) {
      setSelectedVideoUrl(getVideoUrlWithAuth(currentLessonData.r2_key, currentLessonData.duration_seconds))
    } else {
      setSelectedVideoUrl(null)
    }
  }, [currentLessonData.r2_key, currentLessonData.duration_seconds])

  const fetchLessonResources = async (lessonId: string) => {
    setIsLoadingResources(true)
    try {
      const token = getAdminToken()
      const response = await fetch(`${API_BASE_URL}/lesson-resources?lesson_id=${lessonId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      console.log("Lesson resources response:", data)
      if (data.success && data.items) {
        setLessonResources(data.items.map((r: any) => ({ ...r, id: String(r.id), lesson_id: String(r.lesson_id) })))
      } else {
        setLessonResources([])
      }
    } catch (error) {
      console.error("Error fetching lesson resources:", error)
      setLessonResources([])
    } finally {
      setIsLoadingResources(false)
    }
  }

  const uploadResourceFile = async (file: File): Promise<string | null> => {
    setIsUploadingResource(true)
    setUploadProgress(0)

    try {
      const fileName = `resource-${Date.now()}-${file.name.replace(/\s+/g, "-")}`
      const uploadPath = `lesson-resources/${fileName}`
      const contentType = file.type || "application/octet-stream"

      const xhr = new XMLHttpRequest()

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(progress)
        }
      }

      const uploadPromise = new Promise<string | null>((resolve) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(`https://cdn.digitalmadrasa.co.in/${uploadPath}`)
          } else {
            resolve(null)
          }
        }
        xhr.onerror = () => resolve(null)
        xhr.onabort = () => resolve(null)

        const uploadUrl = `${API_BASE_URL}/static/objects?path=${encodeURIComponent(uploadPath)}&contentType=${encodeURIComponent(contentType)}`
        xhr.open("POST", uploadUrl)
        xhr.send(file)
      })

      return await uploadPromise
    } catch (error) {
      console.error("Error uploading resource file:", error)
      return null
    } finally {
      setIsUploadingResource(false)
      setUploadProgress(0)
    }
  }

  const createLessonResource = async () => {
    if (!selectedLesson || !resourceFormData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a resource title",
        variant: "destructive",
      })
      return
    }

    try {
      const body: any = {
        lesson_id: Number(selectedLesson),
        title: resourceFormData.title,
        resource_type: resourceFormData.resource_type,
      }

      if (resourceFormData.url) body.url = resourceFormData.url
      if (resourceFormData.file_url) body.file_url = resourceFormData.file_url

      const response = await fetch(`${API_BASE_URL}/lesson-resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (data.success && data.data) {
        const newResource: Resource = {
          ...data.data,
          id: String(data.data.id),
          lesson_id: String(data.data.lesson_id),
        }
        setLessonResources([...lessonResources, newResource])
        setShowAddResourceModal(false)
        resetResourceForm()
        toast({
          title: "Success",
          description: "Resource added successfully",
        })
      } else {
        throw new Error(data.message || "Failed to create resource")
      }
    } catch (error) {
      console.error("Error creating resource:", error)
      toast({
        title: "Error",
        description: "Failed to add resource",
        variant: "destructive",
      })
    }
  }

  const updateLessonResource = async () => {
    if (!editingResource || !resourceFormData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a resource title",
        variant: "destructive",
      })
      return
    }

    try {
      const body: any = {
        title: resourceFormData.title,
        resource_type: resourceFormData.resource_type,
      }

      if (resourceFormData.url) body.url = resourceFormData.url
      if (resourceFormData.file_url) body.file_url = resourceFormData.file_url

      const response = await fetch(`${API_BASE_URL}/lesson-resources/${editingResource.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (data.success) {
        setLessonResources(
          lessonResources.map((r) => (r.id === editingResource.id ? { ...r, ...resourceFormData } : r)),
        )
        setEditingResource(null)
        resetResourceForm()
        toast({
          title: "Success",
          description: "Resource updated successfully",
        })
      } else {
        throw new Error(data.message || "Failed to update resource")
      }
    } catch (error) {
      console.error("Error updating resource:", error)
      toast({
        title: "Error",
        description: "Failed to update resource",
        variant: "destructive",
      })
    }
  }

  const deleteLessonResource = async (resourceId: string) => {
    if (!window.confirm("Are you sure you want to delete this resource?")) return

    try {
      const response = await fetch(`${API_BASE_URL}/lesson-resources/${resourceId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setLessonResources(lessonResources.filter((r) => r.id !== resourceId))
        toast({
          title: "Success",
          description: "Resource deleted successfully",
        })
      } else {
        throw new Error("Failed to delete resource")
      }
    } catch (error) {
      console.error("Error deleting resource:", error)
      toast({
        title: "Error",
        description: "Failed to delete resource",
        variant: "destructive",
      })
    }
  }

  const resetResourceForm = () => {
    setResourceFormData({
      title: "",
      resource_type: "pdf",
      url: "",
      file_url: "",
    })
  }

  const openEditResourceModal = (resource: Resource) => {
    setEditingResource(resource)
    setResourceFormData({
      title: resource.title,
      resource_type: resource.resource_type,
      url: resource.url || "",
      file_url: resource.file_url || "",
    })
  }

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="w-4 h-4 text-red-500" />
      case "image":
        return <FileImage className="w-4 h-4 text-blue-500" />
      case "link":
        return <LinkIcon className="w-4 h-4 text-green-500" />
      default:
        return <File className="w-4 h-4 text-gray-500" />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div
        className={`bg-white border-r border-gray-200 transition-all duration-300 ${isSidebarOpen ? "w-80" : "w-0 overflow-hidden"}`}
      >
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/admin/courses")} className="text-gray-600">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </div>
          <h2 className="font-semibold text-gray-900 truncate">{course?.title || "Course Editor"}</h2>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">Modules</h3>
            <Button onClick={addModule} size="sm" variant="outline" className="h-8 bg-transparent">
              <Plus className="w-4 h-4 mr-1" />
              Add Module
            </Button>
          </div>

          {modules.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 mb-3">No modules yet</p>
              <Button onClick={addModule} size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Create First Module
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {modules.map((module, moduleIndex) => (
                <div key={module.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="flex items-center gap-2 p-3 bg-gray-50 border-b border-gray-200">
                    <div className="flex flex-col gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => updateModulePosition(String(module.id), "up")}
                        disabled={moduleIndex === 0 || isUpdatingPosition}
                      >
                        <ChevronUp className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => updateModulePosition(String(module.id), "down")}
                        disabled={moduleIndex === modules.length - 1 || isUpdatingPosition}
                      >
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                      onClick={() => toggleModuleExpansion(String(module.id))}
                    >
                      {expandedModules.includes(String(module.id)) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Button>

                    {editingModuleId === String(module.id) ? (
                      <div className="flex-1 flex items-center gap-1">
                        <Input
                          defaultValue={module.title}
                          className="h-7 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              updateModuleTitle(String(module.id), e.currentTarget.value)
                            } else if (e.key === "Escape") {
                              setEditingModuleId(null)
                            }
                          }}
                          onBlur={(e) => updateModuleTitle(String(module.id), e.target.value)}
                        />
                      </div>
                    ) : (
                      <span
                        className="text-sm font-medium flex-1 truncate cursor-pointer"
                        onClick={() => toggleModuleExpansion(String(module.id))}
                      >
                        {module.title}
                      </span>
                    )}

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
                        {module.lessons.length}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setEditingModuleId(String(module.id))}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => deleteModule(String(module.id))}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      </Button>
                    </div>
                  </div>

                  {expandedModules.includes(String(module.id)) && (
                    <div className="p-2 space-y-1">
                      {module.lessons.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-xs text-gray-500 mb-3">No lessons yet</p>
                          <Button
                            onClick={() => addLesson(String(module.id))}
                            size="sm"
                            variant="outline"
                            className="text-xs h-8"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add Lesson
                          </Button>
                        </div>
                      ) : (
                        <>
                          {module.lessons.map((lesson) => (
                            <div
                              key={lesson.id}
                              onClick={() => selectLesson(String(lesson.id))}
                              className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors group ${String(selectedLesson) === String(lesson.id)
                                ? "bg-blue-50 border border-blue-200"
                                : "hover:bg-gray-50 border border-transparent"
                                }`}
                            >
                              <Video className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="text-xs flex-1 truncate">{lesson.title || "Untitled Lesson"}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteLesson(String(lesson.id))
                                }}
                              >
                                <Trash2 className="w-3 h-3 text-red-600" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            onClick={() => addLesson(String(module.id))}
                            size="sm"
                            variant="outline"
                            className="w-full text-xs h-8 mt-2"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add Lesson
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-gray-600"
            >
              <GripVertical className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">
              {currentLessonData?.title || "Select a lesson to edit"}
            </h1>
            {hasUnsavedChanges && <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">Unsaved</span>}
          </div>
          <div className="flex items-center gap-2">

            <Button size="sm" onClick={saveLesson} disabled={isSaving || !selectedLesson}>
              <Save className="w-4 h-4 mr-1" />
              {isSaving ? "Saving..." : "Save Lesson"}
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {!selectedLesson ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Video className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Lesson Selected</h3>
                <p className="text-gray-500 mb-4">
                  {modules.length === 0
                    ? "Create a module first, then add lessons to it"
                    : "Select a lesson from the sidebar to edit, or create a new one"}
                </p>
                {modules.length === 0 && (
                  <Button onClick={addModule}>
                    <Plus className="w-4 h-4 mr-1" />
                    Create First Module
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Video Preview */}
              <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center overflow-hidden">
                {selectedVideoUrl ? (
                  <video
                    ref={videoRef}
                    key={selectedVideoUrl}
                    controls
                    controlsList="nodownload noplaybackrate"
                    disablePictureInPicture
                    className="w-full h-full object-contain"
                    onLoadedMetadata={handleVideoMetadataLoaded}
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="text-center text-gray-400">
                    <Video className="w-16 h-16 mx-auto mb-2 opacity-50" />
                    <p>No video selected</p>
                  </div>
                )}
              </div>

              {/* Lesson Form */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Lesson Title</Label>
                    <Input
                      value={currentLessonData?.title || ""}
                      onChange={(e) => {
                        setCurrentLessonData({ ...currentLessonData, title: e.target.value })
                        setHasUnsavedChanges(true)
                      }}
                      placeholder="Enter lesson title"
                    />
                  </div>
                  <div>
                    <Label>Lesson Type</Label>
                    <Input value="Video" disabled className="bg-gray-50" />
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={currentLessonData?.description || ""}
                    onChange={(e) => {
                      setCurrentLessonData({ ...currentLessonData, description: e.target.value })
                      setHasUnsavedChanges(true)
                    }}
                    placeholder="Enter lesson description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Video Provider</Label>
                    <div className="flex gap-2">
                      <Input value="Cloudflare" disabled className="bg-gray-50 flex-1" />
                      <Button variant="outline" onClick={() => setShowMediaSelector(true)}>
                        <Upload className="w-4 h-4 mr-1" />
                        Select Video
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Duration</Label>
                    <Input
                      value={currentLessonData?.duration || ""}
                      disabled
                      className="bg-gray-50"
                      placeholder="Auto-detected from video"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Video URL</Label>
                    <Input
                      value={currentLessonData?.video_url || ""}
                      disabled
                      className="bg-gray-50"
                      placeholder="Select a video to populate"
                    />
                  </div>
                  <div>
                    <Label>R2 Key</Label>
                    <Input
                      value={currentLessonData?.r2_key || ""}
                      disabled
                      className="bg-gray-50"
                      placeholder="Auto-populated from selection"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={currentLessonData?.locked || false}
                        onCheckedChange={(checked) => {
                          setCurrentLessonData({ ...currentLessonData, locked: checked })
                          setHasUnsavedChanges(true)
                        }}
                      />
                      <Label>Locked</Label>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => selectedLesson && deleteLesson(selectedLesson)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete Lesson
                  </Button>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Lesson Resources
                  </h3>
                  <Button
                    size="sm"
                    onClick={() => {
                      resetResourceForm()
                      setShowAddResourceModal(true)
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Resource
                  </Button>
                </div>

                {isLoadingResources ? (
                  <div className="flex items-center justify-center py-8 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    <span className="text-sm text-gray-500">Loading resources...</span>
                  </div>
                ) : lessonResources.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No resources added yet</p>
                    <p className="text-sm">Add PDFs, links, or other materials for this lesson</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500 mb-3">{lessonResources.length} resource(s) found</p>
                    {lessonResources.map((resource) => (
                      <div
                        key={resource.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {getResourceIcon(resource.resource_type)}
                          <div>
                            <p className="font-medium text-gray-900">{resource.title}</p>
                            <p className="text-xs text-gray-500 capitalize">{resource.resource_type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {(resource.url || resource.file_url) && (
                            <a
                              href={resource.file_url || resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => openEditResourceModal(resource)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteLessonResource(resource.id)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Media Selector Modal */}
      <MediaSelectorModal
        isOpen={showMediaSelector}
        onClose={() => setShowMediaSelector(false)}
        onSelect={handleVideoSelect}
        filterType="video"
      />

      <Dialog
        open={showAddResourceModal || editingResource !== null}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddResourceModal(false)
            setEditingResource(null)
            resetResourceForm()
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingResource ? "Edit Resource" : "Add Resource"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Title</Label>
              <Input
                value={resourceFormData.title}
                onChange={(e) => setResourceFormData({ ...resourceFormData, title: e.target.value })}
                placeholder="Enter resource title"
              />
            </div>

            <div>
              <Label>Resource Type</Label>
              <Select
                value={resourceFormData.resource_type}
                onValueChange={(value) => setResourceFormData({ ...resourceFormData, resource_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="link">Link</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>External URL (optional)</Label>
              <Input
                value={resourceFormData.url}
                onChange={(e) => setResourceFormData({ ...resourceFormData, url: e.target.value })}
                placeholder="https://example.com/resource"
              />
            </div>

            <div>
              <Label>File Upload</Label>
              <div className="flex gap-2">
                <Input
                  value={resourceFormData.file_url}
                  onChange={(e) => setResourceFormData({ ...resourceFormData, file_url: e.target.value })}
                  placeholder="File URL (auto-populated on upload)"
                  className="flex-1"
                  readOnly
                />
                <input
                  type="file"
                  ref={resourceFileInputRef}
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const fileUrl = await uploadResourceFile(file)
                      if (fileUrl) {
                        setResourceFormData({ ...resourceFormData, file_url: fileUrl })
                        toast({
                          title: "Success",
                          description: "File uploaded successfully",
                        })
                      } else {
                        toast({
                          title: "Error",
                          description: "Failed to upload file",
                          variant: "destructive",
                        })
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => resourceFileInputRef.current?.click()}
                  disabled={isUploadingResource}
                >
                  {isUploadingResource ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      {uploadProgress}%
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-1" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddResourceModal(false)
                setEditingResource(null)
                resetResourceForm()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingResource ? updateLessonResource : createLessonResource}
              disabled={!resourceFormData.title.trim()}
            >
              {editingResource ? "Update" : "Add"} Resource
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
