"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Zap, CheckCircle2, Award, Clock, Bell, PlayCircle } from "lucide-react"
import { useUserAuth } from "@/hooks/use-user-auth"
import { apiClient } from "@/lib/api-client"
import { saveUserAuth } from "@/lib/user-auth"
import Link from "next/link"

interface LearnerStats {
  id: number
  user_id: number
  total_skills_enrolled: number
  current_day_streak: number
  total_lessons_completed: number
  last_accessed_course_id: number | null
  earned_certificates: number
  created_at: string
  updated_at: string
}

interface PlatformUpdate {
  id: number
  title: string
  message: string
  channel: string
  published: number
  created_at: string
  updated_at: string
}

interface ActivityHistory {
  id: number
  action_title: string
  user_id: number
  time_stamp: string
  ip_address: string | null
}

interface CourseDetails {
  id: number
  title: string
  thumbnail: string | null
  thumbnail_url: string | null
  instructor: string
  progress?: number
  completed_lessons?: number
  total_lessons?: number
  last_accessed_lesson_title?: string
  last_lesson_id?: number
}

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

export default function StudentDashboard() {
  const { user, token, isLoading: authLoading } = useUserAuth()

  // State
  const [stats, setStats] = useState<LearnerStats | null>(null)
  const [updates, setUpdates] = useState<PlatformUpdate[]>([])
  const [activityHistory, setActivityHistory] = useState<ActivityHistory[]>([])
  const [continueCourse, setContinueCourse] = useState<CourseDetails | null>(null)
  const [showWelcome, setShowWelcome] = useState(false)

  // Loading States
  const [loading, setLoading] = useState(true)

  // Check for welcome popup
  useEffect(() => {
    if (user && user.is_seen_intro === 0) {
      setShowWelcome(true)
    }
  }, [user])

  const handleWelcomeComplete = async () => {
    if (!user || !user.id) return

    try {
      await apiClient.put(`/users/${user.id}/settings/account`, { is_seen_intro: 1 })

      // Update local storage so it persists across reloads immediately
      if (token) {
        saveUserAuth(token, { ...user, is_seen_intro: 1 });
      }
      setShowWelcome(false)
    } catch (e) {
      console.error("Failed to update intro flag", e)
      setShowWelcome(false)
    }
  }

  useEffect(() => {
    if (authLoading || !user?.id) return

    const fetchAllData = async () => {
      setLoading(true)
      try {
        // 1. Fetch Stats
        const statsRes = await apiClient.get<{ data: LearnerStats }>(`/learner-stats/${user.id}`)
        let currentStats: LearnerStats | null = null
        if (statsRes.success && statsRes.data?.data) {
          currentStats = statsRes.data.data
          setStats(currentStats)
        }

        // 2. Fetch Last Accessed Course (if any)
        if (currentStats?.last_accessed_course_id) {
          try {
            const courseRes = await apiClient.get<{ data: CourseDetails }>(`/courses/${currentStats.last_accessed_course_id}`)
            if (courseRes.success && courseRes.data?.data) {
              // Fetch progress for this course
              const progressRes = await apiClient.get<any>(`/courses/${currentStats.last_accessed_course_id}/progress?user_id=${user.id}`)

              const courseData = courseRes.data.data
              let progress = 0
              let completed = 0
              let total = 0
              let lastLessonTitle = ""
              let lastLessonId = 0

              if (progressRes.success && progressRes.data) {
                const pData = progressRes.data.data || progressRes.data;
                progress = pData.percentage || 0;
                completed = pData.completed_lessons || 0;
                total = pData.total_lessons || 0;

                if (pData.last_accessed_lesson_id) {
                  lastLessonId = pData.last_accessed_lesson_id;
                }
              }

              // Calculate percentage if missing
              if (progress === 0 && total > 0) progress = (completed / total) * 100;

              setContinueCourse({
                ...courseData,
                progress,
                completed_lessons: completed,
                total_lessons: total,
                last_accessed_lesson_title: lastLessonTitle,
                last_lesson_id: lastLessonId
              })
            }
          } catch (e) {
            console.error("Failed to load continue course", e)
          }
        }

        // 3. Fetch Updates (Robust Handling)
        try {
          const updatesRes = await apiClient.get<any>("/platform-updates")
          let updatesData: PlatformUpdate[] = []

          if (updatesRes.success && updatesRes.data) {
            if (Array.isArray(updatesRes.data.items)) {
              updatesData = updatesRes.data.items;
            } else if (Array.isArray(updatesRes.data)) {
              updatesData = updatesRes.data;
            } else if (updatesRes.data.data && Array.isArray(updatesRes.data.data)) {
              updatesData = updatesRes.data.data;
            }
          }
          setUpdates(updatesData)
        } catch (e) { console.error("Updates fetch failed", e); }


        // 4. Fetch Activity
        try {
          const activityRes = await apiClient.get<any>(`/activity-history/user/${user.id}`)
          if (activityRes.success && activityRes.data) {
            const items = activityRes.data.items || activityRes.data || []
            setActivityHistory(items)
          }
        } catch (e) { }

      } catch (error) {
        console.error("Dashboard data fetch error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAllData()
  }, [user, authLoading])


  // Helpers
  const getUserInitials = () => {
    if (!user?.full_name) return "U"
    return user.full_name.substring(0, 2).toUpperCase()
  }

  const formatActivityTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)

      if (diffMins < 60) return `${diffMins}m ago`
      if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
      return date.toLocaleDateString()
    } catch (e) { return "" }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }





  return (
    <div className="min-h-screen bg-gray-50/50 p-6 lg:p-8 space-y-8">
      {/* Welcome Dialog */}
      <Dialog open={showWelcome} onOpenChange={(open) => {
        // Only allow closing if it's explicitly set to false by our handler (which sets state directly)
        // Actually onOpenChange is called by primitives. We should just not sync it if we want to force open.
        // But simpler is to prevent interactions on Content.
        if (!open) return; // Prevent closing via state sync if we don't want it
        setShowWelcome(open);
      }}>
        <DialogContent
          className="sm:max-w-4xl p-0 overflow-hidden bg-black text-white border-gray-800"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">Welcome to Digital Madrasa Dashboard</DialogTitle>
          <div className="relative aspect-video w-full bg-black">
            <video
              src="https://cdn.digitalmadrasa.co.in/site-content/dashboard_intro.mp4"
              controls
              autoPlay
              controlsList="nodownload nofullscreen noremoteplayback"
              disablePictureInPicture
              onContextMenu={(e) => e.preventDefault()}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-900">
            <div>
              <h3 className="text-lg font-bold text-white">Welcome to your Dashboard!</h3>
              <p className="text-sm text-gray-400">Watch this quick intro to get started.</p>
            </div>
            <Button onClick={handleWelcomeComplete} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[150px]">
              Thank You, Let's Go!
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Welcome Header */}
      {/* ... rest of the component ... */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20 border-4 border-white/20 shadow-lg">
              <AvatarImage src={user?.profile_pic_url || ""} />
              <AvatarFallback className="bg-white/10 text-white text-xl">{getUserInitials()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold font-heading">Welcome back, {user?.full_name?.split(' ')[0]}!</h1>
              <div className="flex flex-wrap gap-2 mt-2">
                {user?.is_subscribed === 1 && (
                  <Badge variant="secondary" className="bg-green-400/20 text-green-100 hover:bg-green-400/30 border-0">
                    Premium Member
                  </Badge>
                )}
                <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-0">
                  ID: #{user?.id}
                </Badge>
              </div>

              {user?.is_affiliate === 1 && (
                <Link href="/affiliate">
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white gap-2 transition-all"
                  >
                    <Zap className="w-4 h-4" />
                    Affiliate Panel
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full md:w-auto">
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm text-center">
              <div className="text-2xl font-bold">{stats?.total_skills_enrolled || 0}</div>
              <div className="text-xs opacity-70">Enrolled</div>
            </div>
            {/* Streak Removed */}
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm text-center">
              <div className="text-2xl font-bold">{stats?.earned_certificates || 0}</div>
              <div className="text-xs opacity-70">Certificates</div>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm text-center">
              <div className="text-2xl font-bold">{stats?.total_lessons_completed || 0}</div>
              <div className="text-xs opacity-70">Lessons</div>
            </div>
          </div>
        </div>

        {/* Decorational shapes */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/5 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-black/10 blur-3xl"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Continue Learning & Updates */}
        <div className="lg:col-span-2 space-y-8">

          {/* Continue Learning Redesigned Course Card */}
          {continueCourse && (
            <Card className="border-0 shadow-md overflow-hidden bg-white p-6 relative">
              {/* Header Row */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Continue Learning</h2>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                  In Progress
                </Badge>
              </div>

              <div className="flex flex-col sm:flex-row gap-6">
                {/* Thumbnail */}
                <div className="sm:w-64 rounded-xl overflow-hidden relative aspect-video flex-shrink-0 group cursor-pointer bg-gray-100">
                  {continueCourse.thumbnail_url || continueCourse.thumbnail ? (
                    <img
                      src={continueCourse.thumbnail_url || continueCourse.thumbnail!}
                      alt={continueCourse.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <PlayCircle className="w-10 h-10" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayCircle className="w-12 h-12 text-white" />
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      COURSE
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">
                      {continueCourse.title}
                    </h3>
                    <div className="text-sm text-gray-600 mb-4">
                      <span className="font-medium text-gray-900">Next:</span>{' '}
                      {continueCourse.last_accessed_lesson_title || "Resume from last lesson"}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-end text-sm">
                      <span className="font-bold text-gray-900 text-lg">
                        {Math.round(continueCourse.progress || 0)}% <span className="text-xs font-normal text-gray-500 ml-1">Complete</span>
                      </span>
                      <span className="text-gray-500">
                        {continueCourse.completed_lessons || 0}/{continueCourse.total_lessons || 0} Lessons
                      </span>
                    </div>
                    <Progress value={continueCourse.progress || 0} className="h-2 bg-gray-100" />

                    {Math.round(continueCourse.progress || 0) === 100 ? (
                      <Link href="/dashboard/certificates">
                        <Button className="w-auto px-6 mt-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium">
                          <Award className="w-4 h-4 mr-2" />
                          View Certificates
                        </Button>
                      </Link>
                    ) : (
                      <Link href={`/dashboard/skills/${continueCourse.id}`}>
                        <Button className="w-auto px-6 mt-2 bg-[#0066ff] hover:bg-blue-700 text-white rounded-lg font-medium">
                          Resume Learning
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Platform Updates */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                <CardTitle>Updates & Announcements</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="mb-4 flex-wrap h-auto gap-2 bg-transparent p-0 justify-start">
                  <TabsTrigger value="all" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white border px-4 rounded-full">All</TabsTrigger>
                  <TabsTrigger value="global" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white border px-4 rounded-full">Global</TabsTrigger>
                  <TabsTrigger value="students" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white border px-4 rounded-full">Students</TabsTrigger>
                  <TabsTrigger value="system" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white border px-4 rounded-full">System</TabsTrigger>
                </TabsList>

                {['all', 'global', 'students', 'system'].map((filter) => {
                  const filteredUpdates = updates.filter(u => filter === 'all' ? true : u.channel === filter);

                  return (
                    <TabsContent key={filter} value={filter} className="space-y-4">
                      {filteredUpdates.length > 0 ? (
                        filteredUpdates.slice(0, 5).map((update, i) => (
                          <div key={i} className="flex gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100">
                            <div className={`w-2 h-full min-h-[3rem] rounded-full flex-shrink-0 ${update.channel === 'global' ? 'bg-blue-500' :
                              update.channel === 'system' ? 'bg-red-500' : 'bg-green-500'
                              }`} />
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-1">
                                <h4 className="font-semibold text-gray-900">{update.title}</h4>
                                <span className="text-xs text-muted-foreground whitespace-nowrap bg-white px-2 py-1 rounded-md border">
                                  {new Date(update.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 leading-relaxed">{update.message}</p>
                              <div className="mt-2 flex items-center gap-2">
                                <Badge variant="outline" className="text-xs capitalize">{update.channel}</Badge>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground bg-gray-50 rounded-xl border border-dashed">
                          No {filter === 'all' ? '' : filter} updates available
                        </div>
                      )}
                    </TabsContent>
                  )
                })}

              </Tabs>
            </CardContent>
          </Card>

        </div>

        {/* Right Column: Activity */}
        <div className="space-y-8">
          <Card className="border-0 shadow-sm h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <CardTitle>Recent Activity</CardTitle>
              </div>
              <CardDescription>Your latest interactions on the platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {activityHistory.length > 0 ? (
                <div className="relative border-l-2 border-gray-100 ml-3 space-y-8 pb-4">
                  {activityHistory.slice(0, 10).map((activity, index) => (
                    <div key={index} className="relative pl-6">
                      <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-white border-4 border-blue-500 shadow-sm"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 leading-none mb-1">
                          {activity.action_title}
                        </p>
                        <time className="text-xs text-gray-500 block mb-1">
                          {formatActivityTime(activity.time_stamp)}
                        </time>
                        {activity.ip_address && (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                            {activity.ip_address}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  No recent activity
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
