"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Radio,
  Calendar,
  Clock,
  ExternalLink,
  Search,
  Sparkles,
  RefreshCw,
  Video,
  Play,
  ArrowRight,
  ShieldCheck,
} from "lucide-react"
import { dmApi } from "@/lib/dm-api"

interface LiveClass {
  id: number
  title: string
  description: string | null
  scheduled_at: string
  duration_minutes: number
  status: "scheduled" | "live" | "ended" | "cancelled"
  thumbnail_url: string | null
  recording_url?: string | null
  recording_status?: string
  plan_id: number | null
  public_join_token: string
  guest_token: string
}

interface LiveClassesResponse {
  success: boolean
  items: LiveClass[]
}

const STATUS_CONFIG = {
  scheduled: { label: "Scheduled", color: "bg-blue-50 text-blue-700 border-blue-200" },
  live: { label: "🔴 LIVE NOW", color: "bg-rose-50 text-rose-700 border-rose-200 animate-pulse font-extrabold" },
  ended: { label: "Completed", color: "bg-slate-100 text-slate-600 border-slate-200" },
  cancelled: { label: "Cancelled", color: "bg-amber-50 text-amber-700 border-amber-200" },
}

function formatDate(iso: string): string {
  if (!iso) return ""
  return new Date(iso).toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function StudentLiveClassesPage() {
  const [classes, setClasses] = useState<LiveClass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const fetchClasses = async () => {
    setLoading(true)
    const res = await dmApi.get<LiveClassesResponse>("/live-classes")
    setLoading(false)
    if (!res.ok || !res.data) {
      setError(res.error || "Failed to load live classes.")
      return
    }
    setClasses(res.data.items ?? [])
  }

  useEffect(() => {
    fetchClasses()
  }, [])

  const filteredClasses = useMemo(() => {
    return classes.filter((lc) => {
      const matchesSearch =
        (lc.title?.toLowerCase() ?? "").includes(searchQuery.toLowerCase()) ||
        (lc.description?.toLowerCase() ?? "").includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || lc.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [classes, searchQuery, statusFilter])

  const liveClasses = useMemo(() => classes.filter((c) => c.status === "live"), [classes])
  const upcomingClasses = useMemo(() => classes.filter((c) => c.status === "scheduled"), [classes])

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center shadow-2xs">
              <Radio className="w-5 h-5 text-rose-600 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Live Classes</h1>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 ml-13">
            Join interactive real-time broadcast sessions with your instructors.
          </p>
        </div>

        {/* Branding Badge */}
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-900 to-slate-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs self-start sm:self-center border border-slate-700">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>Powered by <span className="font-extrabold text-blue-400">Blaze</span> By WEM STUDIOS</span>
        </div>
      </div>

      {/* ── Live Now Highlight Banner (If any active live class) ───────────────── */}
      {liveClasses.length > 0 && (
        <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-md text-xs font-extrabold tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                Live Broadcast In Progress
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">{liveClasses[0].title}</h2>
              {liveClasses[0].description && (
                <p className="text-xs sm:text-sm text-rose-100 line-clamp-2">{liveClasses[0].description}</p>
              )}
            </div>

            <Link
              href={`/live/${liveClasses[0].public_join_token}`}
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-rose-700 px-6 py-3.5 rounded-xl text-xs font-black shadow-lg transition-all hover:scale-[1.02] flex-shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Join Class Now</span>
            </Link>
          </div>
        </div>
      )}

      {/* ── Search & Status Filters ──────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search classes by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All Classes" },
            { id: "live", label: "🔴 Live Now" },
            { id: "scheduled", label: "Upcoming" },
            { id: "ended", label: "Completed" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === tab.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}

          <button
            type="button"
            onClick={fetchClasses}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors ml-auto sm:ml-0"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Classes Grid ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200/80 p-4 animate-pulse space-y-3">
              <div className="aspect-video bg-slate-200 rounded-xl w-full" />
              <div className="h-5 bg-slate-200 rounded w-2/3" />
              <div className="h-4 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center">
          <p className="text-xs font-semibold text-rose-600">{error}</p>
          <button type="button" onClick={fetchClasses} className="mt-2 text-xs text-blue-600 font-bold hover:underline">
            Try Again
          </button>
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-xs space-y-3">
          <Video className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No live classes scheduled</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Check back later for new live streaming sessions from your instructors.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((lc) => {
            const statusCfg = STATUS_CONFIG[lc.status] ?? STATUS_CONFIG.scheduled
            const joinUrl = `/live/${lc.public_join_token}`

            return (
              <div
                key={lc.id}
                className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:border-slate-300 transition-all flex flex-col group"
              >
                {/* 16:9 Thumbnail Image / Placeholder */}
                <div className="relative aspect-video bg-slate-900 overflow-hidden">
                  {lc.thumbnail_url ? (
                    <Image
                      src={lc.thumbnail_url}
                      alt={lc.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-center">
                      <Radio className="w-10 h-10 text-slate-700 mb-2" />
                      <p className="text-xs font-bold text-slate-400">Digital Madarsa Live Studio</p>
                    </div>
                  )}

                  {/* Status Overlay Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md border shadow-sm backdrop-blur-md ${statusCfg.color}`}>
                      {statusCfg.label}
                    </span>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {lc.title}
                    </h3>
                    {lc.description && (
                      <p className="text-xs text-slate-500 line-clamp-2">{lc.description}</p>
                    )}

                    <div className="space-y-1 pt-2">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(lc.scheduled_at)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{lc.duration_minutes} Minutes</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions based on class status and recording availability */}
                  {lc.status === "live" ? (
                    <Link
                      href={`/live/${lc.public_join_token}`}
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/20"
                    >
                      <Radio className="w-3.5 h-3.5 animate-pulse" />
                      <span>Join Live Broadcast</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : lc.status === "ended" && (lc.recording_url || lc.recording_status === "ready") ? (
                    <Link
                      href={`/dashboard/live-classes/${lc.id}/recording`}
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/20"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Watch Recording</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : lc.status === "ended" && lc.recording_status === "processing" ? (
                    <div className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-500 cursor-not-allowed">
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>Recording Processing…</span>
                    </div>
                  ) : (
                    <Link
                      href={`/live/${lc.public_join_token}`}
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
                    >
                      <span>View Class Room</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
