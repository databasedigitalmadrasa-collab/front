"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Progress } from "@/components/ui/progress"
import {
  PlayCircle,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Award,
  Menu,
  X,
  ChevronRight,
  Check,
  FileText,
  Download,
  Loader2,
  BookOpen,
  AlertCircle,
  Lock,
  Play,
  RefreshCw,
  Eye
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { getUser, getUserToken } from "@/lib/user-auth"
import VideoPlayer from "@/components/video-player"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://srv.digitalmadrasa.co.in/api/v1"

interface Resource {
  id: number
  lesson_id: number
  title: string
  resource_type: string
  url: string | null
  file_url: string | null
  created_at: string
}

interface Lesson {
  id: number
  module_id: number
  course_id: number
  title: string
  position: number
  kind: string
  video_url: string | null
  r2_key: string | null
  blob_url: string | null
  video_provider: string
  drm_protected: number
  locked: number
  completed: number
  duration_seconds: number
  created_at: string
  updated_at: string
  resources: Resource[]
  user_progress: any
}

interface Module {
  id: number
  course_id: number
  title: string
  position: number
  description: string | null
  created_at: string
  updated_at: string
  lessons: Lesson[]
}

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

interface LearnerStat {
  id: number
  user_id: number
  total_skills_enrolled: number
  current_day_streak: number
  total_lessons_completed: number
  last_accessed_course_id: number
  earned_certificates: number
  created_at: string
  updated_at: string
}

interface CourseAccessData {
  course: Course
  modules: Module[]
  learner_stat: LearnerStat
}

interface CourseStats {
  total_modules: number
  total_lessons: number
  completed_lessons: number
  locked_lessons?: number
  completed_lesson_ids?: number[]
  completed_module_ids?: number[]
  progress_percent: number
  last_accessed_lesson_id?: number
}

export default function CourseAccessPage() {
  const params = useParams()
  const courseId = params.courseId as string
  const router = useRouter()

  // State
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [courseData, setCourseData] = useState<CourseAccessData | null>(null)
  const [courseStats, setCourseStats] = useState<CourseStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  // UI State
  const [activeTab, setActiveTab] = useState("overview")
  const [expandedModules, setExpandedModules] = useState<number[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Player State
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [videoLoading, setVideoLoading] = useState(false)
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null)

  // Certificate State
  const [claimedCertId, setClaimedCertId] = useState<string | null>(null)
  const [certLoading, setCertLoading] = useState(false)

  const videoOptions = useMemo(() => ({
    autoplay: false,
    controls: true,
    responsive: true,
    fluid: true,
    sources: videoBlobUrl ? [{ src: videoBlobUrl, type: 'video/mp4' }] : []
  }), [videoBlobUrl]);

  // Refs
  const playerRef = useRef<any>(null)
  const currentLessonRef = useRef<Lesson | null>(null)
  const lastProgressUpdateRef = useRef<number>(0)
  const markLessonAsCompletedRef = useRef((id: number) => { })

  // Sync refs
  useEffect(() => {
    currentLessonRef.current = currentLesson
  }, [currentLesson])

  /**
   * Check if a lesson is locked based on sequential progress
   * A lesson is locked if:
   * 1. It is explicitly locked in DB
   * 2. Any lesson in previous modules is incomplete
   * 3. Any previous lesson in the same module is incomplete
   */
  const getLessonStatus = useCallback((lessonId: number, currentModules: Module[]) => {
    let foundLesson: Lesson | undefined;
    let foundModuleIndex = -1;
    let foundLessonIndex = -1;

    // Locate lesson
    currentModules.forEach((mod, mIdx) => {
      const lIdx = mod.lessons.findIndex(l => l.id === lessonId);
      if (lIdx !== -1) {
        foundLesson = mod.lessons[lIdx];
        foundModuleIndex = mIdx;
        foundLessonIndex = lIdx;
      }
    });

    if (!foundLesson) return { locked: true, completed: false };
    if (foundLesson.completed === 1) return { locked: false, completed: true };
    if (foundLesson.locked === 1) return { locked: true, completed: false }; // Admin locked

    // Check previous modules
    for (let i = 0; i < foundModuleIndex; i++) {
      const mod = currentModules[i];
      if (mod.lessons.some(l => l.completed === 0)) return { locked: true, completed: false };
    }

    // Check previous lessons in current module
    const currentModule = currentModules[foundModuleIndex];
    for (let i = 0; i < foundLessonIndex; i++) {
      if (currentModule.lessons[i].completed === 0) return { locked: true, completed: false };
    }

    return { locked: false, completed: false };
  }, []);

  // API: Update Last Accessed (Resume)
  const updateLastAccessed = useCallback(async (lessonId: number) => {
    try {
      const user = getUser();
      if (!user) return;
      await fetch(`${API_BASE_URL}/courses/${courseId}/resume`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getUserToken()}`
        },
        body: JSON.stringify({ user_id: user.id, lesson_id: lessonId })
      });
    } catch (e) { console.error(e); }
  }, [courseId]);

  // API: Force Sync Progress
  const syncProgress = useCallback(async () => {
    try {
      const user = getUser();
      if (!user) return;
      const res = await fetch(`${API_BASE_URL}/courses/${courseId}/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getUserToken()}`
        },
        body: JSON.stringify({ user_id: user.id })
      });
      const json = await res.json();
      if (json.success) {
        setCourseStats(json.data);
      }
    } catch (e) { console.error(e); }
  }, [courseId]);


  // API: Fetch Course Stats
  const fetchCourseProgress = useCallback(async () => {
    try {
      const user = getUser();
      if (!user) return;
      const res = await fetch(`${API_BASE_URL}/courses/${courseId}/progress?user_id=${user.id}`, {
        headers: { Authorization: `Bearer ${getUserToken()}` }
      });
      const json = await res.json();
      if (json.success) {
        setCourseStats(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setStatsLoading(false);
    }
  }, [courseId]);

  // API: Fetch Course Access
  const fetchCourseAccess = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true)
      const user = getUser()
      const token = getUserToken()
      if (!user) {
        setError("Please login to access this course")
        return
      }

      const response = await fetch(`${API_BASE_URL}/courses/${courseId}/access?user_id=${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const data = await response.json()

      if (data.success && data.data) {
        // Sort modules and lessons
        const sortedModules = data.data.modules.sort((a: Module, b: Module) => a.position - b.position).map((m: Module) => ({
          ...m,
          lessons: m.lessons.sort((a, b) => a.position - b.position)
        }));

        const sortedData = { ...data.data, modules: sortedModules };
        setCourseData(sortedData)
      } else {
        throw new Error(data.message || "Failed to load course")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [courseId, getLessonStatus]);

  // Initial Selection & Resume Logic
  useEffect(() => {
    if (!courseData || statsLoading || currentLesson) return;

    const { modules } = courseData;
    let lessonToPlay: Lesson | undefined;

    // 1. Try Resume (Last Accessed)
    if (courseStats?.last_accessed_lesson_id) {
      for (const m of modules) {
        const found = m.lessons.find(l => l.id === courseStats.last_accessed_lesson_id);
        if (found) { lessonToPlay = found; break; }
      }
    }

    // 2. If no resume point, find first incomplete & unlocked
    if (!lessonToPlay) {
      for (const mod of modules) {
        const inc = mod.lessons.find(l => l.completed === 0);
        if (inc) {
          const status = getLessonStatus(inc.id, modules);
          if (!status.locked) {
            lessonToPlay = inc;
            break;
          }
        }
      }
    }

    // 3. Fallback to first lesson (if all complete or nothing found)
    if (!lessonToPlay && modules.length > 0 && modules[0].lessons.length > 0) {
      lessonToPlay = modules[0].lessons[0];
    }

    if (lessonToPlay) {
      setCurrentLesson(lessonToPlay);
      const modId = lessonToPlay.module_id;
      setExpandedModules(prev => prev.includes(modId) ? prev : [...prev, modId]);
    }

  }, [courseData, courseStats, currentLesson, getLessonStatus]);

  // Initial Data Load
  useEffect(() => {
    if (courseId) {
      fetchCourseAccess();
      fetchCourseProgress();
    }
  }, [courseId]); // run once on mount/id change

  // Video URL Loading
  useEffect(() => {
    if (!currentLesson?.r2_key) {
      setVideoBlobUrl(null)
      return
    }
    setVideoLoading(true)
    const duration = currentLesson.duration_seconds || 0
    const url = `/api/video?key=${encodeURIComponent(currentLesson.r2_key)}&duration=${duration}`
    setVideoBlobUrl(url)
    setVideoLoading(false)
    setVideoLoading(false)
  }, [currentLesson?.r2_key, currentLesson?.duration_seconds])

  // Sync currentLesson when courseData updates (to reflect new completed status)
  useEffect(() => {
    if (!courseData || !currentLesson) return;
    // Find the current lesson in the updated courseData
    let found: Lesson | undefined;
    for (const m of courseData.modules) {
      const l = m.lessons.find(x => x.id === currentLesson.id);
      if (l) { found = l; break; }
    }

    if (found) {
      // Only update if critical fields changed
      if (found.completed !== currentLesson.completed || found.locked !== currentLesson.locked) {
        setCurrentLesson(found);
      }
    }
  }, [courseData, currentLesson]);

  // Sync courseData completed flags from courseStats (Source of Truth for progress)
  useEffect(() => {
    if (!courseStats?.completed_lesson_ids || !courseData) return;

    const completedSet = new Set(courseStats.completed_lesson_ids);
    let changed = false;

    const newModules = courseData.modules.map(m => ({
      ...m,
      lessons: m.lessons.map(l => {
        const shouldBeCompleted = completedSet.has(l.id) ? 1 : 0;
        // Also trust existing completed=1 if not in set? 
        // Ideally set is authoritative. If set says NO, but data says YES?
        // Usually set is cumulative. Let's assume union or set is authority.
        // Let's use set as authority if present.

        if (l.completed !== shouldBeCompleted) {
          changed = true;
          return { ...l, completed: shouldBeCompleted };
        }
        return l;
      })
    }));

    if (changed) {
      setCourseData(prev => prev ? ({ ...prev, modules: newModules }) : null);
    }
  }, [courseStats, courseData]);

  // Navigation Logic
  const handleLessonSelect = (lesson: Lesson) => {
    if (!courseData) return;
    const status = getLessonStatus(lesson.id, courseData.modules);
    if (status.locked) {
      alert("This lesson is locked. Please complete previous lessons/modules first.");
      return;
    }
    setCurrentLesson(lesson)
    updateLastAccessed(lesson.id)
    setIsSidebarOpen(false) // Close sidebar on mobile
  }

  const toggleModule = (moduleId: number) => {
    setExpandedModules((prev) => (prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]))
  }

  // API: Mark Complete & Auto-Advance
  const markLessonAsCompleted = async (lessonId: number) => {
    try {
      const user = getUser();
      const token = getUserToken();
      if (!user || !token) return;

      // 1. Optimistic Update (UI feels faster)
      if (courseData) {
        const newModules = courseData.modules.map(m => ({
          ...m,
          lessons: m.lessons.map(l => l.id === lessonId ? { ...l, completed: 1 } : l)
        }));
        setCourseData({ ...courseData, modules: newModules });
      }

      // 2. Call API
      const response = await fetch(`${API_BASE_URL}/lessons/${lessonId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: user.id }),
      });

      const data = await response.json();

      // 3. Refresh Stats & Access Data (to ensure locks are updated)
      fetchCourseProgress();
      fetchCourseAccess(false); // Silent update

      // 4. Auto-Advance
      if (data.success && data.next_lesson_id && !data.next_lesson_locked) {
        if (courseData) {
          // Find next lesson
          let nextLesson: Lesson | undefined;
          // We need newModules here, but state update might not be flushed.
          // We can search in current courseData (which we optimistically updated? No, state update assumes next render)
          // But we can search in `data` modules if we had them.
          // Easier: Search in current courseData modules, but we know lessonId is complete.

          courseData.modules.forEach(m => {
            const found = m.lessons.find(l => l.id === data.next_lesson_id);
            if (found) nextLesson = found;
          });

          if (nextLesson) {
            // Auto-navigation disabled per user request
            // Ensure module expanded so user can see it
            if (!expandedModules.includes(nextLesson.module_id)) {
              setExpandedModules(prev => [...prev, nextLesson!.module_id]);
            }
          }
        }
      } else if (data.success && data.next_lesson_id && data.next_lesson_locked) {
        // Maybe show "Next lesson unlocked!" toast?
      }

    } catch (err) {
      console.error("Error marking lesson complete:", err);
    }
  };

  // Keep Ref updated
  useEffect(() => {
    markLessonAsCompletedRef.current = markLessonAsCompleted
  }, [markLessonAsCompleted]);

  // API: Update Progress (Watch time)
  const updateProgress = async (lessonId: number, watchSeconds: number, duration: number) => {
    try {
      const user = getUser();
      const token = getUserToken();
      if (!user) return;
      await fetch(`${API_BASE_URL}/lessons/${lessonId}/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          watch_seconds: watchSeconds,
          duration_seconds: duration
        }),
      });
    } catch (e) {
      console.error(e);
    }
  }

  // --- Certificate Logic ---

  useEffect(() => {
    if (courseStats && courseStats.completed_lessons >= courseStats.total_lessons && courseStats.total_lessons > 0) {
      const user = getUser();
      const token = getUserToken();
      if (!user || !token) return;

      fetch(`${API_BASE_URL}/learner-certificates?user_id=${user.id}&course_id=${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(json => {
          if (json.success && json.items && json.items.length > 0) {
            setClaimedCertId(json.items[0].id);
          }
        })
        .catch(console.error)
    }
  }, [courseStats, courseId, statsLoading]);

  const handleClaimCertificate = async () => {
    try {
      setCertLoading(true);
      const user = getUser();
      const token = getUserToken();
      if (!user || !token || !courseData) return;

      const res = await fetch(`${API_BASE_URL}/learner-certificates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          user_id: user.id,
          course_id: courseId,
          certificate_template_id: courseData.course.certificate_template_id
        })
      });

      const json = await res.json();
      if (json.success) {
        setClaimedCertId(json.data.id);
        // Refresh everything logic if needed, or just redirect
      } else {
        alert("Failed to claim certificate: " + (json.error || "Unknown error"));
      }
    } catch (e) {
      console.error(e);
      alert("Error claiming certificate");
    } finally {
      setCertLoading(false);
    }
  }

  // --- Render Helpers ---

  const getProgressPercentage = () => {
    if (courseStats && courseStats.total_lessons > 0) {
      return Math.round((courseStats.completed_lessons / courseStats.total_lessons) * 100);
    }
    return 0;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#0066ff]" />
      </div>
    )
  }

  if (error || !courseData) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-red-200 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Error Loading Course</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/dashboard/skills" className="text-[#0066ff] hover:underline">Back to Skills</Link>
        </div>
      </div>
    )
  }

  const { course, modules } = courseData;

  // Sidebar Component (Internal)
  const Sidebar = () => (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between md:justify-start md:gap-3">
        <div className="md:hidden">
          <h2 className="font-bold text-gray-900">Course Content</h2>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#0066ff]" />
          <h2 className="font-bold text-gray-900">Content</h2>
        </div>
        <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1">
          <X className="w-6 h-6 text-gray-500" />
        </button>
      </div>

      <div className="p-4 border-b border-gray-200 bg-gray-50/50">
        <div className="flex justify-between text-xs font-semibold text-gray-500 mb-2">
          <span>PROGRESS</span>
          <span className="text-[#0066ff]">{getProgressPercentage()}%</span>
        </div>
        <Progress value={getProgressPercentage()} className="h-2 bg-gray-200" />
        <div className="mt-2 text-xs text-gray-500 text-right flex justify-between items-center">
          <button onClick={syncProgress} className="flex items-center gap-1 text-gray-400 hover:text-[#0066ff] transition">
            <RefreshCw className="w-3 h-3" /> Sync
          </button>
          <span>
            {courseStats ? (
              <>
                {courseStats.completed_lessons}/{courseStats.total_lessons} completed
                {courseStats.locked_lessons && courseStats.locked_lessons > 0 && <span className="ml-2 text-amber-600 flex-inline items-center gap-1"><Lock className="w-3 h-3 inline" /> {courseStats.locked_lessons}</span>}
              </>
            ) : "Loading stats..."}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {modules.map((module, mIdx) => (
          <div key={module.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
            <button
              onClick={() => toggleModule(module.id)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition"
            >
              <div className="text-left">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Module {mIdx + 1}</p>
                <p className="text-sm font-semibold text-gray-800 line-clamp-1">{module.title}</p>
              </div>
              {expandedModules.includes(module.id) ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {expandedModules.includes(module.id) && (
              <div className="divide-y divide-gray-100">
                {module.lessons.map((lesson, lIdx) => {
                  const isActive = currentLesson?.id === lesson.id;
                  const { locked, completed } = getLessonStatus(lesson.id, modules);

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => handleLessonSelect(lesson)}
                      disabled={locked}
                      className={`w-full flex items-start gap-3 p-3 transition text-left
                                            ${isActive ? 'bg-blue-50/80 border-l-4 border-[#0066ff]' : 'hover:bg-gray-50 border-l-4 border-transparent'}
                                            ${locked ? 'opacity-60 cursor-not-allowed bg-gray-50' : 'cursor-pointer'}
                                        `}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {completed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : locked ? (
                          <Lock className="w-4 h-4 text-gray-400" />
                        ) : isActive ? (
                          <PlayCircle className="w-5 h-5 text-[#0066ff]" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                            <span className="text-[10px] font-medium text-gray-500">{lIdx + 1}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${isActive ? 'text-[#0066ff]' : 'text-gray-700'}`}>{lesson.title}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {Math.floor(lesson.duration_seconds / 60)}:{String(lesson.duration_seconds % 60).padStart(2, '0')}
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 p-4 sticky top-0 z-30 flex justify-between items-center">
        <div className="flex items-center gap-2 overflow-hidden">
          <Link href="/dashboard/skills" className="text-gray-500 hover:text-gray-900"><ChevronRight className="w-5 h-5 rotate-180" /></Link>
          <h1 className="font-bold text-gray-900 truncate flex-1">{course.title}</h1>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-gray-100 rounded-lg">
          <Menu className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-[calc(100vh-65px)] md:h-screen overflow-hidden">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center gap-4 bg-white border-b border-gray-200 p-4 px-6">
          <Link href="/dashboard/skills" className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-[#0066ff] transition">
            <ChevronRight className="w-4 h-4 rotate-180" /> Back to My Skills
          </Link>
          <div className="h-4 w-px bg-gray-300"></div>
          <h1 className="font-bold text-gray-900">{course.title}</h1>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Video Section */}
            <div className="bg-black rounded-xl overflow-hidden shadow-lg aspect-video relative group">
              {videoLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 z-20">
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                </div>
              )}
              {!currentLesson ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
                  <div className="text-center">
                    <PlayCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Select a lesson to begin</p>
                  </div>
                </div>
              ) : videoBlobUrl ? (
                <VideoPlayer
                  options={videoOptions}
                  onReady={(player) => {
                    playerRef.current = player;
                    player.on('contextmenu', (e: any) => e.preventDefault());
                    player.on('timeupdate', () => {
                      const l = currentLessonRef.current;
                      if (!l) return;
                      const now = Date.now();
                      if (now - lastProgressUpdateRef.current > 10000) {
                        lastProgressUpdateRef.current = now;
                        updateProgress(l.id, player.currentTime(), player.duration());
                      }
                    });

                    // Resume logic
                    player.on('loadedmetadata', () => {
                      const l = currentLessonRef.current;
                      if (l && l.user_progress?.watch_seconds) {
                        const t = l.user_progress.watch_seconds;
                        // Resume if we have > 5s progress and not at the very end
                        if (t > 5 && t < (player.duration() - 10)) {
                          player.currentTime(t);
                          // optional: player.play(); // Auto-play on resume?
                        }
                      }
                    });

                    player.on('ended', () => {
                      const l = currentLessonRef.current;
                      if (l) markLessonAsCompletedRef.current(l.id);
                    });
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  Video unavailable
                </div>
              )}
            </div>

            {/* Lesson Meta */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{currentLesson?.title || "Welcome"}</h2>
                <p className="text-gray-500 text-sm mt-1">
                  {currentLesson ? `Module: ${modules.find(m => m.id === currentLesson.module_id)?.title}` : course.subtitle}
                </p>
              </div>
              {currentLesson && (
                <button
                  onClick={() => markLessonAsCompleted(currentLesson.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition shadow-sm ${currentLesson.completed ? 'bg-green-100 text-green-700' : 'bg-[#0066ff] text-white hover:bg-blue-700'
                    }`}
                >
                  {currentLesson.completed ? (
                    <><CheckCircle2 className="w-5 h-5" /> Completed</>
                  ) : (
                    <><Check className="w-5 h-5" /> Mark as Completed</>
                  )}
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex gap-6">
                {['overview', 'resources', 'certificate'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 text-sm font-medium capitalize transition border-b-2 ${activeTab === tab ? 'border-[#0066ff] text-[#0066ff]' : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="py-2">
              {activeTab === 'overview' && (
                <div className="prose prose-sm max-w-none text-gray-600">
                  <h3 className="text-gray-900 font-bold text-lg mb-2">Description</h3>
                  <p>{course.description || course.short_description || "No description available."}</p>
                </div>
              )}
              {activeTab === 'resources' && (
                <div className="space-y-3">
                  {currentLesson?.resources.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 transition group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 text-[#0066ff] rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{r.title}</p>
                          <p className="text-xs text-gray-500 capitalize">{r.resource_type}</p>
                        </div>
                      </div>
                      <a href={r.file_url || r.url || "#"} target="_blank" className="p-2 text-gray-400 group-hover:text-[#0066ff] transition">
                        <Download className="w-5 h-5" />
                      </a>
                    </div>
                  ))}
                  {(!currentLesson?.resources || currentLesson.resources.length === 0) && (
                    <p className="text-gray-500 italic">No resources attached to this lesson.</p>
                  )}
                </div>
              )}
              {activeTab === 'certificate' && (
                <div className="p-8 text-center bg-white border border-gray-200 rounded-xl">
                  <div className="w-20 h-20 bg-blue-50 text-[#0066ff] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Course Certificate</h3>

                  {courseStats && courseStats.completed_lessons >= courseStats.total_lessons ? (
                    <div>
                      <p className="text-gray-600 mb-6">
                        Congratulations! You have completed the course by finishing {courseStats.completed_lessons} lessons.
                        You are eligible for the certificate.
                      </p>

                      {claimedCertId ? (
                        <Link href={`/dashboard/certificate/${courseId}/${claimedCertId}`}>
                          <Button className="bg-green-600 hover:bg-green-700 text-white gap-2 px-8 py-6 rounded-xl text-lg">
                            <Eye className="w-5 h-5" /> View Certificate
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          onClick={handleClaimCertificate}
                          disabled={certLoading}
                          className="bg-[#0066ff] hover:bg-blue-700 text-white gap-2 px-8 py-6 rounded-xl text-lg"
                        >
                          {certLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Award className="w-5 h-5" />}
                          Claim Certificate
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-600">
                      Complete all <b>{courseStats?.total_lessons}</b> lessons to unlock your certificate.
                      <br />Current Progress: {courseStats?.completed_lessons}/{courseStats?.total_lessons}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar (Fixed Right) */}
      <div className="hidden md:block w-96 flex-shrink-0 h-screen sticky top-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar (Drawer) */}
      {
        isSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
            <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl animate-in slide-in-from-right">
              <Sidebar />
            </div>
          </div>
        )
      }
    </div >
  )
}
