const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://srv.digitalmadrasa.co.in"

export interface Course {
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

export interface CoursesResponse {
  success: boolean
  items: Course[]
}

export interface CourseResponse {
  success: boolean
  data: Course
}

export async function getCourses(): Promise<CoursesResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/courses`, {
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error("Failed to fetch courses")
  }

  return response.json()
}

export async function getCourse(id: string): Promise<CourseResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/courses/${id}`, {
    cache: "no-store",
  })

  if (!response.ok) {
    const text = await response.text();
    console.error(`Failed to fetch course ${id}: ${response.status} ${response.statusText}`, text);
    throw new Error(`Failed to fetch course: ${response.status} ${text}`)
  }

  return response.json()
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

export function getYouTubeVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
  const match = url.match(regex)
  return match ? match[1] : null
}
