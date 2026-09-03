"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  ArrowLeft,
  Calendar,
  Clock,
  Download,
  FileText,
  Sparkles,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Film,
  Video,
  ExternalLink,
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
  thumbnail_url: string | null
  recording_url: string | null
  recording_status: string
  recording_duration: number | null
  recording_size_bytes: number | null
  plan_id: number | null
}

interface RecordingResponse {
  success: boolean
  live_class: LiveClass
  recording_url: string | null
  recording_status: string
  recording_duration: number | null
  recording_size_bytes: number | null
}

function formatDate(iso: string): string {
  if (!iso) return ""
  return new Date(iso).toLocaleString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatSeconds(secs: number): string {
  const mins = Math.floor(secs / 60)
  const remainingSecs = Math.floor(secs % 60)
  return `${String(mins).padStart(2, "0")}:${String(remainingSecs).padStart(2, "0")}`
}

function formatBytes(bytes: number): string {
  if (!bytes) return ""
  const mb = bytes / (1024 * 1024)
  if (mb >= 1000) {
    return `${(mb / 1024).toFixed(2)} GB`
  }
  return `${mb.toFixed(1)} MB`
}

export default function StudentRecordingPlayerPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const videoRef = useRef<HTMLVideoElement>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null)

  const [lc, setLc] = useState<LiveClass | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Player State
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const fetchRecording = async () => {
    const res = await dmApi.get<RecordingResponse>(`/live-classes/${id}/recording`)
    setLoading(false)
    if (!res.ok || !res.data) {
      setError(res.error || "Failed to load recording.")
      return
    }
    setLc(res.data.live_class)
  }

  useEffect(() => {
    fetchRecording()
  }, [id])

  // Auto poll if recording is still processing
  useEffect(() => {
    if (lc?.recording_status === "processing") {
      const timer = setInterval(() => {
        fetchRecording()
      }, 10000)
      return () => clearInterval(timer)
    }
  }, [lc?.recording_status])

  // Video Events
  const handlePlayPause = () => {
    if (!videoRef.current) return
    if (videoRef.current.paused) {
      videoRef.current.play()
      setIsPlaying(true)
    } else {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }

  const handleTimeUpdate = () => {
    if (!videoRef.current) return
    setCurrentTime(videoRef.current.currentTime)
  }

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return
    setDuration(videoRef.current.duration)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value)
    if (!videoRef.current) return
    videoRef.current.currentTime = time
    setCurrentTime(time)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = Number(e.target.value)
    if (!videoRef.current) return
    videoRef.current.volume = vol
    setVolume(vol)
    setIsMuted(vol === 0)
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    if (isMuted) {
      videoRef.current.volume = volume || 1
      setIsMuted(false)
    } else {
      videoRef.current.volume = 0
      setIsMuted(true)
    }
  }

  const handleSpeedChange = (rate: number) => {
    if (!videoRef.current) return
    videoRef.current.playbackRate = rate
    setPlaybackRate(rate)
  }

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(() => null)
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => null)
      setIsFullscreen(false)
    }
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false)
    }, 3000)
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500">Loading recording player…</p>
        </div>
      </div>
    )
  }

  if (error || !lc) {
    return (
      <div className="p-6 max-w-xl mx-auto text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-500">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Recording Unavailable</h2>
        <p className="text-xs text-slate-500">{error || "Could not retrieve the recording for this session."}</p>
        <Link
          href="/dashboard/live-classes"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Live Classes
        </Link>
      </div>
    )
  }

  const isRecordingReady =
    lc.recording_status === "ready" &&
    !!lc.recording_url &&
    !lc.recording_url.includes("cloudflarestream.com") &&
    !lc.recording_url.includes("videodelivery.net")

  const isProcessing =
    lc.recording_status === "processing" ||
    (lc.status === "ended" && !isRecordingReady && lc.recording_status !== "none" && lc.recording_status !== "failed")

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 font-sans">
      {/* ── Top Header Navigation ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/live-classes"
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">{lc.title}</h1>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-md">
                Recorded Class
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Recorded on {formatDate(lc.scheduled_at)}</p>
          </div>
        </div>

        {/* Branding Badge */}
        <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs self-start sm:self-center">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>Powered by <span className="font-extrabold text-blue-400">Blaze</span> By WEM STUDIOS</span>
        </div>
      </div>

      {/* ── Video Player Area ────────────────────────────────────────────────── */}
      <div className="bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
        {isRecordingReady ? (
          <div
            ref={playerContainerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setShowControls(false)}
            className="relative aspect-video w-full bg-black flex items-center justify-center group select-none"
          >
            <video
              ref={videoRef}
              src={lc.recording_url!}
              poster={lc.thumbnail_url || undefined}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
              onClick={handlePlayPause}
              className="w-full h-full object-contain cursor-pointer"
              playsInline
            />

            {/* Floating Play Button Overlay (when paused) */}
            {!isPlaying && (
              <button
                type="button"
                onClick={handlePlayPause}
                className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-xl hover:scale-110 transition-transform z-20"
                aria-label="Play video"
              >
                <Play className="w-7 h-7 fill-current ml-1" />
              </button>
            )}

            {/* Custom Video Controls Bar */}
            <div
              className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 z-30 flex flex-col gap-2.5 ${
                showControls ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
              }`}
            >
              {/* Progress Slider Bar */}
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:h-2 transition-all"
                />
              </div>

              {/* Bottom Control Buttons */}
              <div className="flex items-center justify-between text-white text-xs font-semibold">
                <div className="flex items-center gap-3">
                  {/* Play / Pause */}
                  <button
                    type="button"
                    onClick={handlePlayPause}
                    className="p-1.5 hover:text-blue-400 transition-colors"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                  </button>

                  {/* Volume Slider */}
                  <div className="flex items-center gap-1.5">
                    <button type="button" onClick={toggleMute} className="p-1.5 hover:text-blue-400">
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-16 sm:w-20 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>

                  {/* Time Stamp */}
                  <div className="text-[11px] font-mono text-slate-300">
                    <span>{formatSeconds(currentTime)}</span>
                    <span className="mx-1 text-slate-500">/</span>
                    <span>{formatSeconds(duration)}</span>
                  </div>
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-2">
                  {/* Speed Selector */}
                  <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg text-[10px]">
                    {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => handleSpeedChange(rate)}
                        className={`px-1 rounded ${playbackRate === rate ? "bg-blue-600 text-white font-bold" : "text-slate-400 hover:text-white"}`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>

                  {/* Fullscreen */}
                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="p-1.5 hover:text-blue-400 transition-colors"
                  >
                    {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : isProcessing ? (
          <div className="relative aspect-video w-full flex flex-col items-center justify-center p-8 text-center bg-slate-900 space-y-3">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-2" />
            <h3 className="text-base font-bold text-white mb-1">Archiving Recording to Cloudflare R2</h3>
            <p className="text-xs text-slate-400 max-w-md">
              The live stream has ended. The MP4 recording is being downloaded and stored permanently in Cloudflare R2 media storage.
            </p>
            <button
              type="button"
              onClick={fetchRecording}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md mt-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Check Status Now</span>
            </button>
          </div>
        ) : (
          <div className="relative aspect-video w-full flex flex-col items-center justify-center p-8 text-center bg-slate-900">
            <Film className="w-12 h-12 text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-white mb-1">Recording Not Available</h3>
            <p className="text-xs text-slate-400 max-w-md">
              No recording was archived to R2 for this live session.
            </p>
          </div>
        )}
      </div>

      {/* ── Metadata & Details Panel ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-base font-bold text-slate-900">About this Class</h2>
            {isRecordingReady && lc.recording_url && (
              <a
                href={lc.recording_url}
                download={`class-${lc.id}-recording.mp4`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border border-slate-200"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Download MP4</span>
                {lc.recording_size_bytes ? (
                  <span className="text-slate-400 text-[10px]">({formatBytes(lc.recording_size_bytes)})</span>
                ) : null}
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
              <p className="text-[11px] font-semibold text-slate-500">Date Recorded</p>
              <p className="text-xs font-bold text-slate-900 mt-0.5">{formatDate(lc.scheduled_at)}</p>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
              <p className="text-[11px] font-semibold text-slate-500">Duration</p>
              <p className="text-xs font-bold text-slate-900 mt-0.5">
                {lc.recording_duration ? formatSeconds(lc.recording_duration) : `${lc.duration_minutes} mins`}
              </p>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
              <p className="text-[11px] font-semibold text-slate-500">Storage Location</p>
              <p className="text-xs font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Cloudflare R2 Storage
              </p>
            </div>
          </div>

          {lc.description && (
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 mb-1">Description</p>
              <p className="text-xs text-slate-700 leading-relaxed">{lc.description}</p>
            </div>
          )}
        </div>

        {/* Right Info Box */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Quick Actions</h3>
          <div className="space-y-2.5">
            <Link
              href="/dashboard/live-classes"
              className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <Video className="w-4 h-4" />
              <span>Browse All Live Classes</span>
            </Link>

            <Link
              href="/dashboard/skills"
              className="w-full inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-semibold transition-all border border-slate-200"
            >
              <span>Back to My Courses</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
