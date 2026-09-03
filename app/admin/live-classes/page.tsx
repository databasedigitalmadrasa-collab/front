"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import {
  Radio,
  Plus,
  Calendar,
  Clock,
  Users,
  ExternalLink,
  Trash2,
  Settings,
  MonitorPlay,
  Search,
  Copy,
  Check,
  Video,
  Sparkles,
  Filter,
  RefreshCw,
  TrendingUp,
} from "lucide-react"
import { dmApi } from "@/lib/dm-api"

interface LiveClass {
  id: number
  title: string
  description: string | null
  scheduled_at: string
  duration_minutes: number
  status: "scheduled" | "live" | "ended" | "cancelled"
  plan_id: number | null
  public_join_token: string
  guest_token: string
  show_watermark: number
  chat_enabled: number
  qa_enabled: number
  recording_enabled: number
  cf_playback_url: string | null
  created_at: string
}

interface LiveClassesResponse {
  success: boolean
  items: LiveClass[]
}

const STATUS_CONFIG = {
  scheduled: { label: "Scheduled", color: "bg-blue-50 text-blue-700 border-blue-200" },
  live: { label: "🔴 LIVE", color: "bg-rose-50 text-rose-700 border-rose-200 animate-pulse" },
  ended: { label: "Ended", color: "bg-slate-100 text-slate-600 border-slate-200" },
  cancelled: { label: "Cancelled", color: "bg-amber-50 text-amber-700 border-amber-200" },
}

function formatDate(iso: string): string {
  if (!iso) return ""
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function CopyLinkButton({ label, url, id }: { label: string; url: string; id: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      id={id}
      type="button"
      onClick={copy}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
        copied
          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
      }`}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
      <span>{copied ? "Copied!" : label}</span>
    </button>
  )
}

export default function AdminLiveClassesPage() {
  const [classes, setClasses] = useState<LiveClass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const fetchClasses = async () => {
    setLoading(true)
    const res = await dmApi.get<LiveClassesResponse>("/live-classes")
    setLoading(false)
    if (!res.ok || !res.data) {
      setError(res.error || "Failed to load live classes")
      return
    }
    setClasses(res.data.items ?? [])
  }

  useEffect(() => {
    fetchClasses()
  }, [])

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) return
    setDeletingId(id)
    await dmApi.delete(`/live-classes/${id}`)
    setDeletingId(null)
    fetchClasses()
  }

  // Summary statistics
  const stats = useMemo(() => {
    const total = classes.length
    const liveNow = classes.filter((c) => c.status === "live").length
    const upcoming = classes.filter((c) => c.status === "scheduled").length
    const ended = classes.filter((c) => c.status === "ended").length
    return { total, liveNow, upcoming, ended }
  }, [classes])

  // Filtered classes list
  const filteredClasses = useMemo(() => {
    return classes.filter((lc) => {
      const matchesSearch =
        (lc.title?.toLowerCase() ?? "").includes(searchQuery.toLowerCase()) ||
        (lc.description?.toLowerCase() ?? "").includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || lc.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [classes, searchQuery, statusFilter])

  const origin = typeof window !== "undefined" ? window.location.origin : "https://digitalmadarsa.in"

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center shadow-2xs">
              <Radio className="w-5 h-5 text-rose-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Live Classes</h1>
          </div>
          <p className="text-sm text-slate-500 ml-13">
            Schedule, manage, and broadcast real-time interactive classes using Cloudflare Stream.
          </p>
        </div>

        <Link
          href="/admin/live-classes/create"
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Create Live Class</span>
        </Link>
      </div>

      {/* ── KPI Summary Cards Grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Classes</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats.total}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Video className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Live Now</p>
            <p className="text-2xl font-extrabold text-rose-600 mt-1">{stats.liveNow}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center animate-pulse">
            <Radio className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Upcoming</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats.upcoming}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats.ended}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ─────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
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

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All Status" },
            { id: "live", label: "🔴 Live" },
            { id: "scheduled", label: "Scheduled" },
            { id: "ended", label: "Ended" },
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

      {/* ── Main Content Grid / List ──────────────────────────────────────────── */}
      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse space-y-3">
              <div className="h-5 bg-slate-200 rounded-lg w-1/3" />
              <div className="h-4 bg-slate-100 rounded-lg w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center">
          <p className="text-rose-600 font-semibold text-sm">{error}</p>
          <button
            type="button"
            onClick={fetchClasses}
            className="mt-3 text-xs text-blue-600 hover:underline font-bold"
          >
            Try Again
          </button>
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 sm:p-16 text-center shadow-xs">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <Radio className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No live classes found</h3>
          <p className="text-xs text-slate-500 mb-6 max-w-sm mx-auto">
            {searchQuery || statusFilter !== "all"
              ? "No classes match your search query or filter criteria."
              : "Create your first live class session to start broadcasting to your students."}
          </p>
          <Link
            href="/admin/live-classes/create"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create Live Class</span>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredClasses.map((lc) => {
            const statusCfg = STATUS_CONFIG[lc.status] ?? STATUS_CONFIG.scheduled
            const publicJoinUrl = `${origin}/live/${lc.public_join_token}`
            const guestJoinUrl = `${origin}/live/guest/${lc.guest_token}`

            return (
              <div
                key={lc.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 hover:border-slate-300 transition-all shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Left Metadata */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                        lc.status === "live"
                          ? "bg-rose-50 border-rose-200 text-rose-600"
                          : "bg-slate-50 border-slate-200 text-slate-600"
                      }`}
                    >
                      <Radio className={`w-5 h-5 ${lc.status === "live" ? "animate-pulse" : ""}`} />
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900 truncate">{lc.title}</h3>
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${statusCfg.color}`}
                        >
                          {statusCfg.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap pt-0.5">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatDate(lc.scheduled_at)}
                        </span>
                        <span className="flex items-center gap-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {lc.duration_minutes} mins
                        </span>
                        <span className="flex items-center gap-1.5 font-medium">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          {lc.plan_id ? `Plan #${lc.plan_id}` : "All Subscribers"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-start">
                    {(lc.status === "live" || lc.status === "scheduled") && (
                      <Link
                        href={`/admin/live-classes/${lc.id}/host`}
                        className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-900/20"
                      >
                        <MonitorPlay className="w-3.5 h-3.5" />
                        <span>Host Studio</span>
                      </Link>
                    )}

                    <Link
                      href={`/admin/live-classes/${lc.id}`}
                      className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-500" />
                      <span>Dashboard</span>
                    </Link>

                    <button
                      id={`btn-delete-${lc.id}`}
                      type="button"
                      onClick={() => handleDelete(lc.id, lc.title)}
                      disabled={deletingId === lc.id}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors disabled:opacity-40"
                      title="Delete Live Class"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Bottom Quick Links Bar */}
                <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CopyLinkButton label="Public Link" url={publicJoinUrl} id={`btn-copy-public-${lc.id}`} />
                    <CopyLinkButton label="Guest Link" url={guestJoinUrl} id={`btn-copy-guest-${lc.id}`} />
                  </div>

                  {lc.cf_playback_url && (
                    <a
                      href={lc.cf_playback_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1"
                    >
                      <span>Stream Preview</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
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
