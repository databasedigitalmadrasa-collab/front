"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Radio,
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  ChevronDown,
  ChevronUp,
  Loader2,
  WifiOff,
  Droplets,
  MessageSquare,
  HelpCircle,
  PlayCircle,
  Type,
  Image,
  UserPlus,
  X,
  Sparkles,
  AlertCircle,
} from "lucide-react"
import { dmApi } from "@/lib/dm-api"
import { ImageFileUpload } from "@/components/live/image-file-upload"

interface SubscriptionPlan {
  id: number
  title: string
  description?: string
}

interface UserRow {
  id: number
  full_name: string
  email: string
  profile_pic_url?: string
}

interface PlansResponse {
  success: boolean
  items: SubscriptionPlan[]
}

interface UsersResponse {
  success: boolean
  items: UserRow[]
}

interface LiveClassCreateResponse {
  success: boolean
  live_class: { id: number }
}

export default function AdminCreateLiveClassPage() {
  const router = useRouter()

  // Form fields
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [thumbnailUrl, setThumbnailUrl] = useState("")
  const [scheduledAt, setScheduledAt] = useState("")
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [planId, setPlanId] = useState<number | "">("")
  const [selectedHosts, setSelectedHosts] = useState<UserRow[]>([])
  const [userSearch, setUserSearch] = useState("")
  const [showUserDropdown, setShowUserDropdown] = useState(false)

  // Live Settings
  const [showWatermark, setShowWatermark] = useState(true)
  const [chatEnabled, setChatEnabled] = useState(true)
  const [qaEnabled, setQaEnabled] = useState(true)
  const [recordingEnabled, setRecordingEnabled] = useState(true)
  const [overlayText, setOverlayText] = useState("")
  const [overlayLogoUrl, setOverlayLogoUrl] = useState("")
  const [maxParticipants, setMaxParticipants] = useState<number | "">("")
  const [settingsOpen, setSettingsOpen] = useState(true)

  // System Data
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [users, setUsers] = useState<UserRow[]>([])

  // Submission State
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      dmApi.get<PlansResponse>("/subscription-plans"),
      dmApi.get<UsersResponse>("/users?limit=200"),
    ]).then(([plansRes, usersRes]) => {
      if (plansRes.ok && plansRes.data) setPlans(plansRes.data.items ?? [])
      if (usersRes.ok && usersRes.data) setUsers(usersRes.data.items ?? [])
    })
  }, [])

  const filteredUsers = users.filter(
    (u) =>
      !selectedHosts.find((h) => h.id === u.id) &&
      (u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase())),
  )

  const addHost = (user: UserRow) => {
    setSelectedHosts((prev) => [...prev, user])
    setUserSearch("")
    setShowUserDropdown(false)
  }

  const removeHost = (userId: number) => {
    setSelectedHosts((prev) => prev.filter((h) => h.id !== userId))
  }

  const isSubmittingRef = useRef(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmittingRef.current || submitting) return
    setError(null)

    if (!title.trim()) {
      setError("Please provide a title for the live class.")
      return
    }
    if (!scheduledAt) {
      setError("Please select a scheduled date & time.")
      return
    }

    isSubmittingRef.current = true
    setSubmitting(true)

    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || null,
        thumbnail_url: thumbnailUrl.trim() || null,
        scheduled_at: new Date(scheduledAt).toISOString(),
        duration_minutes: durationMinutes,
        plan_id: planId || null,
        host_ids: selectedHosts.map((h) => h.id),
        show_watermark: showWatermark,
        chat_enabled: chatEnabled,
        qa_enabled: qaEnabled,
        recording_enabled: recordingEnabled,
        overlay_text: overlayText.trim() || null,
        overlay_logo_url: overlayLogoUrl.trim() || null,
        max_participants: maxParticipants || null,
      }

      const res = await dmApi.post<LiveClassCreateResponse>("/live-classes", payload)

      if (!res.ok || !res.data) {
        setError(res.error || "Failed to create live class.")
        isSubmittingRef.current = false
        setSubmitting(false)
        return
      }

      router.push(`/admin/live-classes/${res.data.live_class.id}`)
    } catch (err) {
      setError("Failed to create live class. Please try again.")
      isSubmittingRef.current = false
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* ── Top Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/live-classes"
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center shadow-2xs">
              <Radio className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Create Live Class</h1>
              <p className="text-xs text-slate-500">
                Provisions a Cloudflare Stream live input with WebRTC (WHIP) ingest automatically.
              </p>
            </div>
          </div>
        </div>

        {/* Branding Badge */}
        <div className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1 rounded-xl text-xs font-semibold shadow-2xs">
          <span>Powered by <span className="text-blue-400 font-extrabold">Blaze</span> By WEM STUDIOS</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Section 1: Basic Class Information ──────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Class Information
          </h2>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Class Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="class-title-input"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Arabic Grammar & Tafseer – Master Class"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>

          {/* Thumbnail Upload (16:9 Aspect Ratio) */}
          <ImageFileUpload
            label="Class Thumbnail Image (16:9 Aspect Ratio)"
            value={thumbnailUrl}
            onChange={setThumbnailUrl}
            aspectRatio="16/9"
            folder="thumbnails"
            helperText="Uploaded to Cloudflare R2 media storage. Displayed on student portal cards & stream previews."
          />

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              id="class-desc-input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Summary of topics covered, prerequisites, or notes for students..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all resize-none"
            />
          </div>

          {/* Date & Time + Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                <Calendar className="inline w-3.5 h-3.5 mr-1 text-slate-400" />
                Scheduled Date & Time <span className="text-rose-500">*</span>
              </label>
              <input
                id="class-scheduled-input"
                type="datetime-local"
                required
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                <Clock className="inline w-3.5 h-3.5 mr-1 text-slate-400" />
                Duration (minutes)
              </label>
              <input
                id="class-duration-input"
                type="number"
                min={15}
                max={480}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
            </div>
          </div>
        </div>

        {/* ── Section 2: Access & Hosts ────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Access & Hosts
          </h2>

          {/* Subscription Plan Access */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              <Sparkles className="inline w-3.5 h-3.5 mr-1 text-indigo-500" />
              Subscription Plan Requirement
            </label>
            <select
              id="class-plan-select"
              value={planId}
              onChange={(e) => setPlanId(e.target.value ? Number(e.target.value) : "")}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            >
              <option value="">Open to all active subscribers (No specific plan requirement)</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Public join links will check for an active subscription to this plan. Guest links bypass plan checks.
            </p>
          </div>

          {/* Selected Hosts Chips */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-800">
              <UserPlus className="inline w-3.5 h-3.5 mr-1 text-blue-500" />
              Assigned Hosts / Instructors
            </label>

            {selectedHosts.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedHosts.map((h) => (
                  <div
                    key={h.id}
                    className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl pl-3 pr-2 py-1"
                  >
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {h.full_name?.[0]?.toUpperCase() ?? "H"}
                    </div>
                    <span className="text-xs font-bold text-slate-900 max-w-[140px] truncate">
                      {h.full_name || h.email}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeHost(h.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Host Search Input */}
            <div className="relative">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value)
                  setShowUserDropdown(true)
                }}
                onFocus={() => setShowUserDropdown(true)}
                placeholder="Search users by name or email to assign as host..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />

              {showUserDropdown && userSearch && filteredUsers.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 max-h-48 overflow-y-auto p-1 space-y-0.5">
                  {filteredUsers.slice(0, 15).map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => addHost(u)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-xl text-left transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {u.full_name?.[0]?.toUpperCase() ?? "U"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{u.full_name || "User"}</p>
                        <p className="text-[10px] text-slate-500 truncate">{u.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Section 3: Live Settings Collapsible ────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <button
            type="button"
            onClick={() => setSettingsOpen((o) => !o)}
            className="w-full flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Live Studio Settings</h2>
            </div>
            {settingsOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {settingsOpen && (
            <div className="px-6 pb-6 pt-2 border-t border-slate-100 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ToggleCard
                  icon={<Droplets className="w-4 h-4 text-blue-600" />}
                  title="Brand Watermark"
                  description="Overlay logo & text on stream"
                  value={showWatermark}
                  onChange={setShowWatermark}
                />
                <ToggleCard
                  icon={<MessageSquare className="w-4 h-4 text-emerald-600" />}
                  title="Student Chat"
                  description="Enable messaging during class"
                  value={chatEnabled}
                  onChange={setChatEnabled}
                />
                <ToggleCard
                  icon={<HelpCircle className="w-4 h-4 text-amber-600" />}
                  title="Q&A Panel"
                  description="Allow question submissions"
                  value={qaEnabled}
                  onChange={setQaEnabled}
                />
                <ToggleCard
                  icon={<PlayCircle className="w-4 h-4 text-rose-600" />}
                  title="Auto Recording"
                  description="Save recording to Cloudflare"
                  value={recordingEnabled}
                  onChange={setRecordingEnabled}
                />
              </div>

              {/* Overlay Text & Logo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    <Type className="inline w-3.5 h-3.5 mr-1 text-slate-400" />
                    Overlay Watermark Text
                  </label>
                  <input
                    type="text"
                    value={overlayText}
                    onChange={(e) => setOverlayText(e.target.value)}
                    placeholder="e.g. Digital Madarsa – Official"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="sm:col-span-2">
                  <ImageFileUpload
                    label="Overlay Watermark Logo Image"
                    value={overlayLogoUrl}
                    onChange={setOverlayLogoUrl}
                    aspectRatio="square"
                    folder="logos"
                    helperText="Logo displayed on top of the live broadcast."
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Error Banner ────────────────────────────────────────────────────── */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-rose-700">{error}</p>
          </div>
        )}

        {/* ── Submit Action Bar ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-xs font-bold transition-all border border-slate-200"
          >
            Cancel
          </button>
          <button
            id="btn-submit-create-class"
            type="submit"
            disabled={submitting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Provisioning Stream…</span>
              </>
            ) : (
              <>
                <Radio className="w-4 h-4" />
                <span>Create Live Class</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

function ToggleCard({
  icon,
  title,
  description,
  value,
  onChange,
}: {
  icon: React.ReactNode
  title: string
  description: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/70">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center border border-slate-200/80 shadow-2xs flex-shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-900 truncate">{title}</p>
          <p className="text-[10px] text-slate-500 truncate">{description}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
          value ? "bg-blue-600" : "bg-slate-300"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
            value ? "translate-x-4.5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  )
}
