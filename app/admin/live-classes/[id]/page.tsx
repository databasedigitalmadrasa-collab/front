"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  Radio,
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  ExternalLink,
  Copy,
  Check,
  Settings,
  MonitorPlay,
  Trash2,
  Droplets,
  MessageSquare,
  HelpCircle,
  PlayCircle,
  AlertCircle,
  Loader2,
  UserMinus,
  UserPlus,
  Key,
  Shield,
  Wifi,
  Sparkles,
  RefreshCw,
} from "lucide-react"
import { dmApi } from "@/lib/dm-api"

interface LiveClass {
  id: number
  title: string
  description: string | null
  scheduled_at: string
  duration_minutes: number
  status: "scheduled" | "live" | "ended" | "cancelled"
  cf_live_input_uid: string | null
  cf_whip_url: string | null
  cf_rtmps_url: string | null
  cf_rtmps_key: string | null
  cf_playback_url: string | null
  cf_hls_url: string | null
  plan_id: number | null
  public_join_token: string
  guest_token: string
  show_watermark: number
  chat_enabled: number
  qa_enabled: number
  recording_enabled: number
  recording_url?: string | null
  recording_status?: string
  recording_duration?: number | null
  recording_size_bytes?: number | null
  recording_error?: string | null
  thumbnail_url?: string | null
  overlay_text: string | null
  overlay_logo_url: string | null
  max_participants: number | null
}

interface HostRow {
  id: number
  user_id: number
  role: string
  user_full_name: string | null
  user_email: string | null
}

interface ParticipantRow {
  id: number
  user_id: number | null
  guest_name: string | null
  joined_at: string | null
  left_at: string | null
  is_guest: number
  user_full_name: string | null
  user_email: string | null
}

interface UserRow {
  id: number
  full_name: string
  email: string
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
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function CopyField({ label, value, id }: { label: string; value: string; id: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/70 space-y-1">
      <p className="text-[11px] font-semibold text-slate-500">{label}</p>
      <div className="flex items-center gap-2">
        <p className="flex-1 text-xs font-mono font-medium text-slate-800 truncate">{value}</p>
        <button
          id={id}
          type="button"
          onClick={copy}
          className={`p-1.5 rounded-lg border transition-all flex-shrink-0 ${
            copied ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
          }`}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  )
}

export default function AdminLiveClassDashboardPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [lc, setLc] = useState<LiveClass | null>(null)
  const [hosts, setHosts] = useState<HostRow[]>([])
  const [participants, setParticipants] = useState<ParticipantRow[]>([])
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [addingHost, setAddingHost] = useState(false)
  const [newHostId, setNewHostId] = useState("")
  const [endingLive, setEndingLive] = useState(false)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [showStreamKey, setShowStreamKey] = useState(false)
  const [syncingRecording, setSyncingRecording] = useState(false)

  const handleSyncRecording = async () => {
    setSyncingRecording(true)
    await dmApi.post(`/live-classes/${id}/sync-recording`, {})
    setSyncingRecording(false)
    fetchAll()
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "https://digitalmadarsa.in"

  // The recording is collected in the background after the class ends; keep
  // the card current until it settles rather than asking the admin to reload.
  const recordingPending =
    lc?.status === "ended" && (lc.recording_status === "processing" || lc.recording_status === "recording")

  const fetchAll = useCallback(async () => {
    const [classRes, hostsRes, participantsRes, usersRes] = await Promise.all([
      dmApi.get<{ success: boolean; live_class: LiveClass }>(`/live-classes/${id}`),
      dmApi.get<{ success: boolean; items: HostRow[] }>(`/live-classes/${id}/hosts`),
      dmApi.get<{ success: boolean; items: ParticipantRow[] }>(`/live-classes/${id}/participants`),
      dmApi.get<{ success: boolean; items: UserRow[] }>("/users?limit=200"),
    ])
    setLoading(false)
    if (classRes.ok && classRes.data) setLc(classRes.data.live_class)
    if (hostsRes.ok && hostsRes.data) setHosts(hostsRes.data.items ?? [])
    if (participantsRes.ok && participantsRes.data) setParticipants(participantsRes.data.items ?? [])
    if (usersRes.ok && usersRes.data) setUsers(usersRes.data.items ?? [])
  }, [id])

  useEffect(() => {
    if (!recordingPending) return
    const timer = setInterval(() => void fetchAll(), 10_000)
    return () => clearInterval(timer)
  }, [recordingPending, fetchAll])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // Attendance moves while a class is on air. Reading `status` through a ref
  // keeps the interval from being torn down and restarted — and `fetchAll`
  // from being called an extra time — every time the status changes.
  const statusRef = useRef(lc?.status)
  statusRef.current = lc?.status

  useEffect(() => {
    const interval = setInterval(() => {
      if (statusRef.current === "live") fetchAll()
    }, 8000)
    return () => clearInterval(interval)
  }, [fetchAll])

  /**
   * Optimistic, with a rollback: a switch that sits still until a round trip
   * completes reads as broken, and a switch that lies when the save fails is
   * worse than either.
   */
  const saveSetting = async (field: keyof LiveClass, next: boolean) => {
    setSettingsError(null)
    setLc((prev) => (prev ? { ...prev, [field]: next ? 1 : 0 } : prev))

    const res = await dmApi.put(`/live-classes/${id}`, { [field]: next })
    if (!res.ok) {
      setLc((prev) => (prev ? { ...prev, [field]: next ? 0 : 1 } : prev))
      setSettingsError(res.error || "Could not save that setting.")
    }
  }

  const handleAddHost = async () => {
    if (!newHostId) return
    setAddingHost(true)
    await dmApi.post(`/live-classes/${id}/hosts`, { user_id: Number(newHostId) })
    setNewHostId("")
    setAddingHost(false)
    fetchAll()
  }

  const handleRemoveHost = async (userId: number) => {
    await dmApi.delete(`/live-classes/${id}/hosts/${userId}`)
    fetchAll()
  }

  const handleEndLive = async () => {
    if (!confirm("Are you sure you want to end this live class?")) return
    setEndingLive(true)
    await dmApi.post(`/live-classes/${id}/end`)
    setEndingLive(false)
    fetchAll()
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this class permanently?")) return
    await dmApi.delete(`/live-classes/${id}`)
    router.push("/admin/live-classes")
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  if (!lc) {
    return (
      <div className="p-6 text-center">
        <p className="text-rose-600 font-semibold">Live class not found.</p>
      </div>
    )
  }

  const statusCfg = STATUS_CONFIG[lc.status] ?? STATUS_CONFIG.scheduled
  const publicLink = `${origin}/live/${lc.public_join_token}`
  const guestLink = `${origin}/live/guest/${lc.guest_token}`
  const activeParticipants = participants.filter((p) => !p.left_at)

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link
            href="/admin/live-classes"
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors mt-0.5"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{lc.title}</h1>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${statusCfg.color}`}>
                {statusCfg.label}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {formatDate(lc.scheduled_at)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {lc.duration_minutes} mins
              </span>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
          {(lc.status === "scheduled" || lc.status === "live") && (
            <Link
              href={`/admin/live-classes/${id}/host`}
              className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-900/20"
            >
              <MonitorPlay className="w-4 h-4" />
              <span>Host Studio</span>
            </Link>
          )}

          {lc.status === "live" && (
            <button
              id="btn-end-live-dashboard"
              type="button"
              onClick={handleEndLive}
              disabled={endingLive}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            >
              {endingLive ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
              <span>End Live</span>
            </button>
          )}

          <button
            id="btn-delete-class-dashboard"
            type="button"
            onClick={handleDelete}
            className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
            title="Delete Class"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Main Dashboard Grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Stream Ingest Credentials & Links */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Wifi className="w-4 h-4 text-blue-600" />
            <span>Cloudflare Stream Credentials</span>
          </h2>

          <div className="space-y-3">
            <CopyField label="Public Join Link (Subscription Required)" value={publicLink} id="dash-copy-public" />
            <CopyField label="Guest Join Link (Open Link)" value={guestLink} id="dash-copy-guest" />
            {lc.cf_whip_url && (
              <CopyField label="WHIP URL (Browser WebRTC Broadcast)" value={lc.cf_whip_url} id="dash-copy-whip" />
            )}
            {lc.cf_rtmps_url && (
              <CopyField label="RTMPS URL (For OBS / Zoom)" value={lc.cf_rtmps_url} id="dash-copy-rtmps" />
            )}
            {lc.cf_rtmps_key && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500">RTMPS Stream Key</span>
                  <button
                    type="button"
                    onClick={() => setShowStreamKey((v) => !v)}
                    className="text-[11px] font-bold text-blue-600 hover:underline"
                  >
                    {showStreamKey ? "Hide" : "Show"}
                  </button>
                </div>
                {/* Masked by default: this key is a broadcast credential, and it
                    was previously rendered in full on a page an admin may well
                    have open while screen-sharing. */}
                <CopyField
                  label="Anyone holding this key can broadcast to your class"
                  value={showStreamKey ? lc.cf_rtmps_key : "••••••••••••••••••••••••"}
                  id="dash-copy-rtmps-key"
                />
              </div>
            )}

            {lc.cf_playback_url && (
              <div className="pt-2">
                <a
                  href={lc.cf_playback_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-bold"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Stream Player Preview</span>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Live Studio Settings Overview */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-600" />
            <span>Studio Configurations</span>
          </h2>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <SettingToggle
              icon={<Droplets className="w-4 h-4 text-blue-600" />}
              label="Watermark Overlay"
              active={!!lc.show_watermark}
              onChange={(v) => saveSetting("show_watermark", v)}
            />
            <SettingToggle
              icon={<MessageSquare className="w-4 h-4 text-emerald-600" />}
              label="Student Chat"
              active={!!lc.chat_enabled}
              onChange={(v) => saveSetting("chat_enabled", v)}
            />
            <SettingToggle
              icon={<HelpCircle className="w-4 h-4 text-amber-600" />}
              label="Q&A Panel"
              active={!!lc.qa_enabled}
              onChange={(v) => saveSetting("qa_enabled", v)}
            />
            <SettingToggle
              icon={<PlayCircle className="w-4 h-4 text-rose-600" />}
              label="Auto Recording"
              active={!!lc.recording_enabled}
              onChange={(v) => saveSetting("recording_enabled", v)}
            />
          </div>

          {settingsError && <p className="text-[11px] font-medium text-rose-600">{settingsError}</p>}

          <p className="text-[11px] leading-relaxed text-slate-500">
            Chat and Q&amp;A changes reach everyone already watching straight away — no reload needed.
          </p>

          {lc.overlay_text && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 text-xs">
              <span className="text-slate-500 font-medium">Watermark Text: </span>
              <span className="font-bold text-slate-900">{lc.overlay_text}</span>
            </div>
          )}
        </div>

        {/* Card: Recording & R2 Storage */}
        {(!!lc.recording_enabled || (!!lc.recording_status && lc.recording_status !== "none")) && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <PlayCircle className="w-4 h-4 text-rose-600" />
                <span>Recording &amp; R2 Cloud Storage</span>
              </h2>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  lc.recording_status === "ready"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : lc.recording_status === "processing"
                    ? "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
                    : lc.recording_status === "recording" || lc.recording_status === "failed"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                {lc.recording_status === "ready"
                  ? "Archived to R2"
                  : lc.recording_status === "processing"
                  ? "Processing..."
                  : lc.recording_status === "recording"
                  ? "Recording"
                  : lc.recording_status === "failed"
                  ? "Failed"
                  : "Not Archived"}
              </span>
            </div>

            {lc.recording_error && lc.recording_status !== "ready" && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] leading-relaxed text-rose-800">
                {lc.recording_error}
              </p>
            )}

            {lc.recording_url ? (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Storage Location:</span>
                    <span className="font-bold text-emerald-700">Cloudflare R2 (media-bucket)</span>
                  </div>
                  {lc.recording_duration ? (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Duration:</span>
                      <span className="font-bold text-slate-800">
                        {Math.floor(lc.recording_duration / 60)}m {lc.recording_duration % 60}s
                      </span>
                    </div>
                  ) : null}
                  {lc.recording_size_bytes ? (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">File Size:</span>
                      <span className="font-bold text-slate-800">
                        {(lc.recording_size_bytes / (1024 * 1024)).toFixed(1)} MB
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={lc.recording_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Watch / Download R2 MP4</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleSyncRecording}
                    disabled={syncingRecording}
                    className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 text-xs font-semibold transition-all disabled:opacity-50"
                    title="Collect the recording again"
                  >
                    {syncingRecording ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 leading-relaxed">
                  The host studio records the class as it goes out and saves it to R2 when the class ends. A class streamed from OBS is recorded by Cloudflare Stream instead and copied to R2 after it ends.
                </p>
                {lc.status === "ended" && lc.recording_status !== "processing" && (
                  <button
                    type="button"
                    onClick={handleSyncRecording}
                    disabled={syncingRecording}
                    className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                  >
                    {syncingRecording ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Collecting the recording...</span>
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>Collect the recording again</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Card 3: Assigned Hosts */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            <span>Assigned Hosts ({hosts.length})</span>
          </h2>

          <div className="space-y-2">
            {hosts.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No hosts assigned to this class yet.</p>
            ) : (
              hosts.map((h) => (
                <div key={h.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                      {h.user_full_name?.[0]?.toUpperCase() ?? "H"}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{h.user_full_name || h.user_email}</p>
                      <p className="text-[10px] text-slate-500 capitalize">{h.role}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveHost(h.user_id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add Host Controls */}
          <div className="flex gap-2 pt-2">
            <select
              value={newHostId}
              onChange={(e) => setNewHostId(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Select user to assign as host…</option>
              {users
                .filter((u) => !hosts.find((h) => h.user_id === u.id))
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name || u.email}
                  </option>
                ))}
            </select>
            <button
              type="button"
              onClick={handleAddHost}
              disabled={!newHostId || addingHost}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1"
            >
              {addingHost ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Card 4: Participants Attendance */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Participants ({participants.length})</span>
            </h2>
            {lc.status === "live" && (
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Live • Auto Refresh
              </span>
            )}
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {participants.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No participants have joined yet.</p>
            ) : (
              participants.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center ${p.is_guest ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                      {p.is_guest ? "G" : (p.user_full_name?.[0]?.toUpperCase() ?? "U")}
                    </div>
                    <span className="text-xs font-semibold text-slate-900">
                      {p.is_guest ? p.guest_name || "Guest" : p.user_full_name || p.user_email}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.left_at ? "bg-slate-200 text-slate-600" : "bg-emerald-100 text-emerald-700"}`}>
                    {p.left_at ? "Left" : "Active"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * These four were read-only "On"/"Off" chips, which meant the dashboard showed
 * a setting it gave you no way to change — the toggle existed only inside the
 * host studio, and only while a class was live.
 */
function SettingToggle({
  icon,
  label,
  active,
  onChange,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
      <div className="flex items-center gap-2 min-w-0">
        {icon}
        <span className="text-xs font-semibold text-slate-800 truncate">{label}</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={active}
        aria-label={label}
        onClick={() => onChange(!active)}
        className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${
          active ? "bg-emerald-500" : "bg-slate-300"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
            active ? "translate-x-[18px]" : "translate-x-[3px]"
          }`}
        />
      </button>
    </div>
  )
}
