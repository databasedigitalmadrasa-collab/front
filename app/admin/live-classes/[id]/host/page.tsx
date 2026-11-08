"use client"

/**
 * Host Studio — `/admin/live-classes/[id]/host`
 *
 * The teacher's side of a live class, and — since co-hosting — the mixer for
 * the whole broadcast.
 *
 * WHAT THIS PAGE OWNS AND WHAT IT DOES NOT
 * ----------------------------------------
 * Four hooks, one job each, because a Cloudflare Stream live input takes
 * exactly one publisher and everything else follows from that:
 *
 *   useMediaSources     — this machine's cameras, microphone and screen.
 *   useStageRtc         — co-hosts' cameras arriving over WebRTC, and the
 *                         programme feed going back to them.
 *   useStageCompositor  — all of the above drawn into one canvas, under the
 *                         current layout and overlays, with the audio mixed.
 *   useWhipBroadcast    — that canvas, pushed to Cloudflare.
 *   useStudioRecorder   — that canvas, recorded and uploaded to R2. Stream
 *                         does not record a WHIP broadcast, so this is the
 *                         class recording.
 *
 * The room (`useLiveRoom`) carries chat, Q&A, presence, overlays and the stage
 * itself over the same socket the students are on, so a co-host's studio and
 * this one never disagree about who is on air.
 *
 * This file is layout plus the handful of decisions that need more than one of
 * them: going live is "make sure the mixer is running, flip the status, then
 * publish", and ending is the reverse in the reverse order.
 *
 * Numbers here are measured, not decorated. The studio this replaced showed a
 * fixed "12.5 Mbps / Excellent" whether or not anything was being sent.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Check,
  ChevronDown,
  CircleDot,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Gauge,
  HelpCircle,
  Layers,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  MonitorUp,
  Paperclip,
  Radio,
  Settings,
  StopCircle,
  UserPlus,
  Users,
  Video,
  VideoOff,
  X,
} from "lucide-react"
import { dmApi } from "@/lib/dm-api"
import { useLiveRoom } from "@/hooks/use-live-room"
import { useMediaSources } from "@/hooks/use-media-sources"
import { useStageRtc } from "@/hooks/use-stage-rtc"
import { useStageCompositor, type CompositorSource } from "@/hooks/use-stage-compositor"
import { useWhipBroadcast, type StreamHealth } from "@/hooks/use-whip-broadcast"
import { useStudioRecorder, type StudioRecorder } from "@/hooks/use-studio-recorder"
import { formatDuration, isStaffRole, roomApi, secondsSince, type StageLayout } from "@/lib/live-room"
import { ChatPanel } from "@/components/live/chat-panel"
import { QaPanel } from "@/components/live/qa-panel"
import { ParticipantsPanel } from "@/components/live/participants-panel"
import { MaterialsPanel } from "@/components/live/materials-panel"
import { AnnouncementsPanel } from "@/components/live/announcements-panel"
import { ProgramCanvas } from "@/components/live/stage/program-canvas"
import { Backstage, type PendingSource } from "@/components/live/stage/backstage"
import { LayoutPicker } from "@/components/live/stage/layout-picker"
import { DevicePanel } from "@/components/live/stage/device-panel"
import { OverlayManager } from "@/components/live/stage/overlay-manager"
import { CohostLinks } from "@/components/live/stage/cohost-links"

interface AdminLiveClass {
  id: number
  title: string
  status: "scheduled" | "live" | "ended" | "cancelled"
  scheduled_at: string
  duration_minutes: number | null
  description: string | null
  plan_id: number | null
  started_at: string | null
  cf_whip_url: string | null
  cf_rtmps_url: string | null
  cf_rtmps_key: string | null
  public_join_token: string
  guest_token: string
  show_watermark: number
  chat_enabled: number
  qa_enabled: number
  recording_enabled: number
  broadcast_width: number
  broadcast_height: number
  broadcast_fps: number
  show_name_plates: number
  overlay_render: "burn" | "viewer" | "both"
}

/** The panels on the studio's right-hand rail. */
type StudioPanel = "chat" | "qa" | "people" | "brand" | "guests" | "files" | "notices"

const HEALTH_STYLES: Record<StreamHealth, { label: string; chip: string }> = {
  excellent: { label: "Excellent", chip: "bg-emerald-500/20 text-emerald-300" },
  good: { label: "Good", chip: "bg-emerald-500/20 text-emerald-300" },
  fair: { label: "Fair", chip: "bg-amber-500/20 text-amber-300" },
  poor: { label: "Poor", chip: "bg-rose-500/20 text-rose-300" },
  unknown: { label: "Measuring…", chip: "bg-slate-600/40 text-slate-300" },
}

export default function HostStudioPage() {
  const { id } = useParams<{ id: string }>()

  const [cls, setCls] = useState<AdminLiveClass | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [goingLive, setGoingLive] = useState(false)
  const [ending, setEnding] = useState(false)
  const [starting, setStarting] = useState(false)
  const [confirmEnd, setConfirmEnd] = useState(false)

  const [panel, setPanel] = useState<StudioPanel | null>("chat")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState<"broadcast" | "class">("broadcast")

  const media = useMediaSources()
  const room = useLiveRoom({
    token: cls?.public_join_token ?? null,
    principal: "admin",
    enabled: !!cls?.public_join_token,
  })
  const whip = useWhipBroadcast()

  // The room's copy is the live one — it moves when anybody changes a setting,
  // including this host in another tab. The admin fetch is only for the ingest
  // credentials, which the room never carries.
  const status = room.liveClass?.status ?? cls?.status ?? "scheduled"
  const startedAt = room.liveClass?.started_at ?? cls?.started_at ?? null
  const isLive = status === "live"

  const auth = useMemo(
    () => (cls?.public_join_token ? { token: cls.public_join_token } : null),
    [cls?.public_join_token],
  )

  /* ── the mixer, and the co-hosts feeding it ───────────────────────────── */

  /**
   * The compositor and the WebRTC layer each need something from the other:
   * the mixer draws the co-hosts' video, and the co-hosts receive the mixer's
   * output. A ref breaks the cycle without either hook having to know the
   * other exists.
   */
  const returnTracksRef = useRef<((cid: string) => { video: MediaStreamTrack | null; audio: MediaStreamTrack | null }) | null>(null)
  const getReturnTracks = useCallback(
    (cid: string) => returnTracksRef.current?.(cid) ?? { video: null, audio: null },
    [],
  )

  const rtc = useStageRtc({
    enabled: !!room.you?.stage,
    producer: true,
    peers: room.stage.peers,
    selfCid: room.you?.cid ?? null,
    auth,
    signal: room.signal,
    onEvent: room.onEvent,
    getReturnTracks,
  })

  /** This machine's cameras and screens, named for the audience, not the device. */
  const localSources: CompositorSource[] = useMemo(() => {
    const hostName = room.you?.name || "Host"
    let cameraIndex = 0
    return media.sources.map((source) => {
      const label =
        source.kind === "screen"
          ? `${hostName} — screen`
          : cameraIndex++ === 0
            ? hostName
            : `${hostName} · ${source.label}`
      return {
        id: source.id,
        kind: source.kind,
        label,
        stream: source.stream,
        peerCid: null,
        live: source.enabled,
        mirrored: source.flipped,
        // "Mirror my view" flips the host's own cameras for the host only: the
        // opposite of whatever the audience gets, which is what a mirror shows.
        previewMirrored: source.kind === "camera" && media.mirrorSelfView ? !source.flipped : source.flipped,
      }
    })
  }, [media.sources, media.mirrorSelfView, room.you?.name])

  /**
   * Co-hosts' cameras.
   *
   * The room's peer list says what each co-host is offering and what to call
   * it; `rtc.remoteVideo` holds the tracks that have actually arrived. A
   * source announced but not yet negotiated is skipped rather than drawn as a
   * black tile.
   */
  const remoteSources: CompositorSource[] = useMemo(() => {
    const out: CompositorSource[] = []
    for (const peer of room.stage.peers) {
      if (peer.cid === room.you?.cid) continue
      const cameras = peer.sources.filter((s) => s.kind === "camera")
      for (const source of peer.sources) {
        const stream = rtc.remoteVideo.get(source.id)
        if (!stream) continue
        const label =
          source.kind === "screen"
            ? `${peer.name} — screen`
            : cameras.length > 1
              ? `${peer.name} · ${source.label}`
              : peer.name
        out.push({
          id: source.id,
          kind: source.kind,
          label,
          stream,
          peerCid: peer.cid,
          live: source.live,
          mirrored: !!source.mirrored,
        })
      }
    }
    return out
  }, [room.stage.peers, rtc.remoteVideo, room.you?.cid])

  const compositorSources = useMemo(
    () => [...localSources, ...remoteSources],
    [localSources, remoteSources],
  )

  const compositor = useStageCompositor({
    title: cls?.title,
    width: cls?.broadcast_width ?? 1280,
    height: cls?.broadcast_height ?? 720,
    fps: cls?.broadcast_fps ?? 30,
    showNamePlates: !!(cls?.show_name_plates ?? 1),
    stage: room.stage,
    overlays: room.liveOverlays,
    sources: compositorSources,
    micTrack: media.micTrack,
    remoteAudio: rtc.remoteAudio,
  })

  // Assigned during render rather than in an effect: a co-host's offer can
  // arrive before any effect has run, and answering it with no programme feed
  // attached would leave them staring at a blank monitor until something else
  // happened to renegotiate.
  returnTracksRef.current = compositor.getReturnTracks

  // `goLive` starts the mixer and then publishes in the same click, so the
  // programme stream it needs only exists in a render that happens after the
  // click handler was created. Reading `compositor.programStream` there got
  // the stale null, and the first Go live of every class failed to broadcast
  // until the host pressed Retry.
  const programStreamRef = useRef<MediaStream | null>(null)
  programStreamRef.current = compositor.programStream

  /* ── load ─────────────────────────────────────────────────────────────── */

  const load = useCallback(async () => {
    const res = await dmApi.get<{ success: boolean; live_class: AdminLiveClass }>(`/live-classes/${id}`)
    setLoading(false)
    if (!res.ok || !res.data) {
      setLoadError(res.error || "This live class could not be loaded.")
      return
    }
    setCls(res.data.live_class)
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  /* ── keep the room told what this browser is offering ─────────────────── */

  const announce = media.announce
  const publishSources = room.publishSources
  useEffect(() => {
    publishSources(announce())
  }, [announce, publishSources, media.sources, media.micMuted, room.connection])

  /* ── keep the co-hosts' return feed pointed at the live mixer ─────────── */

  useEffect(() => {
    if (!compositor.programStream) return
    rtc.refreshReturnTracks()
    // A new programme stream means a new canvas track, which the WHIP session
    // has to be handed too — otherwise the broadcast keeps sending the old,
    // now-stopped one.
    if (whip.publishing) void whip.replaceTracks(compositor.programStream)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compositor.programStream])

  /* ── recording ────────────────────────────────────────────────────────── */

  const recorder = useStudioRecorder(cls?.id ?? null, cls?.broadcast_height ?? 720)

  // Recording follows the browser broadcast. A class sent from OBS is recorded
  // by Stream, and recording this studio as well would capture a canvas nobody
  // was watching. Sticky for the session, so a WHIP reconnect does not split
  // the recording into a new file every time the network blinks.
  const [studioBroadcast, setStudioBroadcast] = useState(false)
  useEffect(() => {
    if (whip.publishing) setStudioBroadcast(true)
  }, [whip.publishing])
  useEffect(() => {
    if (!isLive) setStudioBroadcast(false)
  }, [isLive])

  const shouldRecord = isLive && studioBroadcast && !!cls?.recording_enabled && !!compositor.programStream
  const recordStream = recorder.record
  const stopRecording = recorder.stop
  useEffect(() => {
    if (shouldRecord && compositor.programStream) recordStream(compositor.programStream)
    else void stopRecording()
  }, [shouldRecord, compositor.programStream, recordStream, stopRecording])

  /* ── session clock ────────────────────────────────────────────────────── */

  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!isLive) return
    const interval = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [isLive])

  const elapsed = useMemo(
    () => (startedAt ? secondsSince(startedAt) : 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [startedAt, tick],
  )

  /* ── studio / go live / end ───────────────────────────────────────────── */

  const startStudio = useCallback(async (): Promise<boolean> => {
    setStarting(true)
    setActionError(null)
    if (!media.ready) await media.start()
    const ok = await compositor.start()
    setStarting(false)
    if (!ok) setActionError(compositor.error || "The mixer could not start.")
    return ok
  }, [media, compositor])

  const goLive = async () => {
    if (!cls) return
    setActionError(null)
    setGoingLive(true)

    // The mixer has to be running before the status flips: students join the
    // moment it does, and a class that is "live" with nothing being published
    // is the state that generates support tickets.
    if (!compositor.running) {
      const started = await startStudio()
      if (!started) {
        setGoingLive(false)
        return
      }
    }

    const res = await dmApi.post<{ success: boolean; whip_url: string | null; started_at: string | null }>(
      `/live-classes/${id}/go-live`,
    )

    if (!res.ok || !res.data) {
      setGoingLive(false)
      setActionError(res.error || "Could not start the class. Please try again.")
      return
    }

    setCls((prev) => (prev ? { ...prev, status: "live", started_at: res.data!.started_at } : prev))
    await room.refresh()

    const stream = programStreamRef.current
    const published = stream
      ? await whip.publish(res.data.whip_url ?? cls.cf_whip_url ?? "", stream)
      : false
    setGoingLive(false)

    if (!published) {
      setActionError(
        "The class is marked live, but this browser could not start broadcasting. Fix the problem below and press Retry broadcast, or stream with OBS using the RTMPS details.",
      )
    }
  }

  const endClass = async () => {
    setConfirmEnd(false)
    setEnding(true)
    setActionError(null)

    // Stop sending before flipping the status, so the last thing students see
    // is the stream ending rather than a frozen frame on an "ended" page.
    await whip.stop()
    // Closes the recording file now; its last parts keep uploading after the
    // class is marked ended, and the studio shows that until they are done.
    void recorder.stop()
    const res = await dmApi.post(`/live-classes/${id}/end`)
    setEnding(false)

    if (!res.ok) {
      setActionError(res.error || "Could not end the class.")
      return
    }
    setCls((prev) => (prev ? { ...prev, status: "ended" } : prev))
    compositor.stop()
    media.stopAll()
    await room.refresh()
  }

  const retryBroadcast = async () => {
    if (!cls?.cf_whip_url || !compositor.programStream) return
    setActionError(null)
    await whip.publish(cls.cf_whip_url, compositor.programStream)
  }

  /* ── settings ─────────────────────────────────────────────────────────── */

  const toggleSetting = async (field: keyof AdminLiveClass, next: boolean) => {
    if (!cls) return
    // Optimistic: a switch that waits on a round trip feels broken.
    setCls((prev) => (prev ? { ...prev, [field]: next ? 1 : 0 } : prev))

    const res = await dmApi.put(`/live-classes/${id}`, { [field]: next })
    if (!res.ok) {
      setCls((prev) => (prev ? { ...prev, [field]: next ? 0 : 1 } : prev))
      setActionError(res.error || "Could not save that setting.")
    }
  }

  const saveBroadcast = async (
    settings: Partial<{ width: number; height: number; fps: number; overlay_render: AdminLiveClass["overlay_render"]; show_name_plates: boolean }>,
  ) => {
    if (!auth) return
    const res = await roomApi.updateBroadcast(auth, settings)
    if (!res.ok || !res.data?.broadcast) {
      setActionError(res.error || "Could not save the broadcast settings.")
      return
    }
    const b = res.data.broadcast
    setCls((prev) =>
      prev
        ? {
            ...prev,
            broadcast_width: b.width,
            broadcast_height: b.height,
            broadcast_fps: b.fps,
            overlay_render: b.overlay_render,
            show_name_plates: b.show_name_plates,
          }
        : prev,
    )
  }

  /* ── stage actions ────────────────────────────────────────────────────── */

  const canProduce = !!room.you && room.you.role === "host"

  const setLayout = (layout: StageLayout) => room.setStage({ layout })

  // Featuring picks who is large in Solo, Leader, Sidebar and PiP, and who
  // takes the first seat in Group. It never changes the layout by itself:
  // clicking a face used to switch the whole stage to Spotlight.
  const setFeatured = (sourceId: string | null) => room.setStage({ spotlight: sourceId })

  const toggleOnStage = (sourceId: string) => {
    const current = compositor.onStageIds
    room.setStage({
      onStage: current.includes(sourceId) ? current.filter((x) => x !== sourceId) : [...current, sourceId],
    })
  }

  const removeFromStage = (sourceId: string) =>
    room.setStage({ onStage: compositor.onStageIds.filter((x) => x !== sourceId) })

  const toggleMuted = (sourceId: string) => {
    const muted = room.stage.muted.includes(sourceId)
      ? room.stage.muted.filter((x) => x !== sourceId)
      : [...room.stage.muted, sourceId]
    room.setStage({ muted })
  }

  /**
   * What goes on stage without being asked: the host's own camera when the
   * studio opens onto an empty stage, and a screen share the moment it starts.
   * Each source is placed at most once, so taking it off again sticks — the
   * old rule ("an empty stage shows everything") put the whole backstage on
   * air whenever the last person was removed.
   */
  const placedRef = useRef<Set<string>>(new Set())
  const onStageKey = compositor.onStageIds.join("|")
  useEffect(() => {
    if (!compositor.running || !canProduce) return
    const current = compositor.onStageIds
    for (const sourceId of current) placedRef.current.add(sourceId)

    const additions: string[] = []
    const camera = media.sources.find((s) => s.kind === "camera")
    if (camera && !current.length && !placedRef.current.has(camera.id)) additions.push(camera.id)
    for (const source of media.sources) {
      if (source.kind === "screen" && !placedRef.current.has(source.id)) additions.push(source.id)
    }
    if (!additions.length) return

    for (const sourceId of additions) placedRef.current.add(sourceId)
    room.setStage({ onStage: [...current, ...additions] })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compositor.running, canProduce, onStageKey, media.sources])

  /** Co-host sources the room has announced but WebRTC has not delivered. */
  const pendingSources: PendingSource[] = useMemo(() => {
    const out: PendingSource[] = []
    for (const peer of room.stage.peers) {
      if (peer.cid === room.you?.cid) continue
      for (const source of peer.sources) {
        if (rtc.remoteVideo.get(source.id)) continue
        out.push({
          id: source.id,
          kind: source.kind,
          label: source.kind === "screen" ? `${peer.name} — screen` : peer.name,
        })
      }
    }
    return out
  }, [room.stage.peers, rtc.remoteVideo, room.you?.cid])

  /* ── render ───────────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium text-slate-500">Loading the studio…</p>
        </div>
      </div>
    )
  }

  if (loadError || !cls) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-100 p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-rose-500" />
          <h2 className="text-lg font-bold text-slate-900">Live class not found</h2>
          <p className="mt-1.5 text-xs text-slate-500">{loadError}</p>
          <Link
            href="/admin/live-classes"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to live classes
          </Link>
        </div>
      </div>
    )
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "https://digitalmadarsa.in"
  const publicLink = `${origin}/live/${cls.public_join_token}`
  const guestLink = `${origin}/live/guest/${cls.guest_token}`
  const students = room.presence.filter((p) => !isStaffRole(p.role))
  const cohosts = room.stage.peers.filter((p) => !p.producer)
  const unanswered = room.questions.filter((q) => !q.answered).length
  const primaryCamera = media.sources.find((s) => s.kind === "camera")
  const screenShare = media.sources.find((s) => s.kind === "screen")
  const ended = status === "ended" || status === "cancelled"
  const errorMessage = actionError || media.error || whip.error || compositor.error || recorder.error

  const stageSources = compositor.onStageIds
    .map((sourceId) => compositorSources.find((s) => s.id === sourceId))
    .filter((s): s is CompositorSource => !!s)
    .map((s) => ({ id: s.id, kind: s.kind, label: s.label }))

  const togglePanel = (next: StudioPanel) => setPanel((current) => (current === next ? null : next))

  const panelBadges: Partial<Record<StudioPanel, number>> = {
    qa: unanswered,
    people: room.presence.length,
    brand: room.liveOverlays.length,
    guests: cohosts.length,
    files: room.materials.length,
    notices: room.announcements.length,
  }

  return (
    // Full screen, over the admin chrome: a studio needs the whole window, and
    // the dashboard sidebar was costing the stage a third of its width.
    <div className="fixed inset-0 z-[60] flex flex-col bg-slate-100 text-slate-900">
      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <header className="flex h-14 flex-shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-2 sm:gap-3 sm:px-4">
        <Link
          href="/admin/live-classes"
          aria-label="Leave the studio"
          className="flex-shrink-0 rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-sm font-bold tracking-tight sm:text-base">{cls.title}</h1>
            <StatusPill status={status} />
          </div>
          <p className="hidden truncate text-[11px] text-slate-500 sm:block">
            {formatFull(cls.scheduled_at)} · {cls.plan_id ? `Plan #${cls.plan_id}` : "All subscribers"}
          </p>
        </div>

        <div className="hidden flex-shrink-0 items-center gap-2 md:flex">
          {isLive && startedAt && (
            <span className="rounded-lg bg-slate-900 px-2.5 py-1.5 font-mono text-xs font-bold text-emerald-400">
              {formatDuration(elapsed)}
            </span>
          )}
          <span
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700"
            title="Students watching"
          >
            <Users className="h-3.5 w-3.5 text-indigo-500" />
            {students.length}
          </span>
          <HealthBadge health={whip.stats.health} bitrateKbps={whip.stats.bitrateKbps} publishing={whip.publishing} />
          <RecordingBadge recorder={recorder} />
        </div>

        <a
          href={publicLink}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden flex-shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 lg:inline-flex"
        >
          Class page
          <ExternalLink className="h-3.5 w-3.5" />
        </a>

        {ended ? (
          <span className="flex-shrink-0 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold capitalize text-slate-500">
            Class {status}
          </span>
        ) : isLive ? (
          <button
            type="button"
            onClick={() => setConfirmEnd(true)}
            disabled={ending}
            className="inline-flex flex-shrink-0 items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-rose-700 disabled:opacity-50 sm:px-4"
          >
            {ending ? <Loader2 className="h-4 w-4 animate-spin" /> : <StopCircle className="h-4 w-4" />}
            End broadcast
          </button>
        ) : (
          <button
            type="button"
            onClick={goLive}
            disabled={goingLive}
            className="inline-flex flex-shrink-0 items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-extrabold text-white shadow-sm transition-colors hover:bg-rose-500 disabled:opacity-50 sm:px-5"
          >
            {goingLive ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radio className="h-4 w-4" />}
            {goingLive ? "Starting…" : "Go live"}
          </button>
        )}
      </header>

      {/* ── Notices ───────────────────────────────────────────────────────── */}
      {(recorder.state === "saving" || (recorder.state === "saved" && status === "ended")) && (
        <div className="flex flex-shrink-0 items-center gap-2 border-b border-blue-200 bg-blue-50 px-4 py-2">
          {recorder.state === "saving" ? (
            <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin text-blue-600" />
          ) : (
            <Check className="h-4 w-4 flex-shrink-0 text-blue-600" />
          )}
          <p className="text-xs font-medium text-blue-900">
            {recorder.state === "saving"
              ? `Saving the recording — ${uploadPercent(recorder)}% uploaded. Keep this tab open until it finishes.`
              : "Recording saved. It will appear on the class page and for students in a minute."}
          </p>
        </div>
      )}

      {errorMessage && (
        <div className="flex flex-shrink-0 items-center gap-2 border-b border-rose-200 bg-rose-50 px-4 py-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-rose-600" />
          <p className="min-w-0 flex-1 text-xs font-medium text-rose-800">{errorMessage}</p>
          {isLive && !whip.publishing && (
            <button
              type="button"
              onClick={retryBroadcast}
              className="flex-shrink-0 rounded-lg bg-rose-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-rose-700"
            >
              Retry broadcast
            </button>
          )}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        {/* ── Stage ─────────────────────────────────────────────────────── */}
        <main className="flex min-w-0 flex-1 flex-col gap-3 p-3 sm:p-4 lg:overflow-y-auto">
          <div className="flex flex-1 items-center justify-center">
            {/* As large as the window allows while leaving room for the
                layouts, backstage and controls below it. */}
            <div className="w-full" style={{ maxWidth: "max(320px, calc((100dvh - 460px) * 16 / 9))" }}>
              <ProgramCanvas
                canvasRef={compositor.canvasRef}
                previewCanvasRef={compositor.previewCanvasRef}
                previewActive={compositor.previewActive}
                tiles={compositor.tiles}
                width={cls.broadcast_width}
                height={cls.broadcast_height}
                running={compositor.running}
                starting={starting}
                live={isLive && whip.publishing}
                featured={room.stage.spotlight}
                muted={room.stage.muted}
                actualFps={compositor.actualFps}
                targetFps={cls.broadcast_fps}
                canProduce={canProduce}
                onFeature={setFeatured}
                onToggleMute={toggleMuted}
                onRemove={removeFromStage}
                onStart={() => void startStudio()}
              />
            </div>
          </div>

          <LayoutPicker
            layout={room.stage.layout}
            sources={stageSources}
            featured={room.stage.spotlight}
            disabled={!canProduce}
            onLayout={setLayout}
          />

          <section className="rounded-2xl border border-slate-200 bg-white/80 p-2.5" aria-labelledby="backstage-heading">
            <div className="mb-2 flex items-baseline justify-between gap-2 px-1">
              <h2 id="backstage-heading" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Backstage
              </h2>
              <p className="text-[11px] text-slate-400">
                {compositor.onStageIds.length} on stage · only what is on stage goes out
              </p>
            </div>
            {compositor.running || compositorSources.length ? (
              <Backstage
                sources={compositorSources}
                pending={pendingSources}
                onStageIds={compositor.onStageIds}
                visibleIds={compositor.tiles.map((t) => t.id)}
                featured={room.stage.spotlight}
                muted={room.stage.muted}
                peerStates={rtc.peerStates}
                canProduce={canProduce}
                onToggleStage={toggleOnStage}
                onFeature={setFeatured}
                onToggleMute={toggleMuted}
                onToggleCamera={media.toggleSource}
                onToggleFlip={media.toggleFlip}
                onRemoveSource={media.removeSource}
                onAddCamera={() => void media.addCamera()}
                onShareScreen={screenShare ? undefined : () => void media.startScreenShare()}
                onInvite={() => setPanel("guests")}
                canAddSources={compositor.running && !ended}
              />
            ) : (
              <p className="rounded-xl bg-slate-50 px-3 py-5 text-center text-xs text-slate-400">
                Enter the studio to see your camera here. Guests you invite wait here until you add them to the stage.
              </p>
            )}
          </section>

          {/* ── Controls ──────────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-start justify-center gap-1 sm:gap-2">
            <StudioButton
              onClick={media.toggleMic}
              disabled={!media.micTrack}
              active={media.micMuted}
              tone="rose"
              icon={media.micMuted ? <MicOff className="h-[18px] w-[18px]" /> : <Mic className="h-[18px] w-[18px]" />}
              label={media.micMuted ? "Unmute" : "Mute"}
            />
            <StudioButton
              onClick={() => primaryCamera && media.toggleSource(primaryCamera.id)}
              disabled={!primaryCamera}
              active={!!primaryCamera && !primaryCamera.enabled}
              tone="rose"
              icon={
                primaryCamera?.enabled === false ? (
                  <VideoOff className="h-[18px] w-[18px]" />
                ) : (
                  <Video className="h-[18px] w-[18px]" />
                )
              }
              label={primaryCamera?.enabled === false ? "Start cam" : "Stop cam"}
            />
            <StudioButton
              onClick={() => (screenShare ? media.removeSource(screenShare.id) : void media.startScreenShare())}
              disabled={!compositor.running}
              active={!!screenShare}
              tone="blue"
              icon={<MonitorUp className="h-[18px] w-[18px]" />}
              label={screenShare ? "Stop share" : "Share"}
            />
            <StudioButton
              onClick={() => setPanel("guests")}
              icon={<UserPlus className="h-[18px] w-[18px]" />}
              label="Invite"
            />
            <StudioButton
              onClick={() => setSettingsOpen(true)}
              icon={<Settings className="h-[18px] w-[18px]" />}
              label="Settings"
            />
          </div>
        </main>

        {/* ── Side panel ─────────────────────────────────────────────────── */}
        {panel && (
          <aside className="order-3 flex w-full flex-shrink-0 flex-col border-t border-slate-200 bg-white lg:order-2 lg:w-[360px] lg:border-l lg:border-t-0">
            <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-100 px-4 py-2.5">
              <h2 className="text-sm font-bold">{PANELS.find((p) => p.id === panel)?.title}</h2>
              <button
                type="button"
                onClick={() => setPanel(null)}
                aria-label="Close panel"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-[440px] flex-1 overflow-y-auto p-3 lg:min-h-0">
              {panel === "chat" && (
                <ChatPanel
                  className="h-full min-h-[400px]"
                  messages={room.chat}
                  you={room.you}
                  connection={room.connection}
                  enabled={!!cls.chat_enabled && status !== "ended"}
                  disabledReason={status === "ended" ? "This class has ended." : "You have turned chat off."}
                  onSend={(body) => room.send("chat", body)}
                  onDelete={room.removeMessage}
                />
              )}
              {panel === "qa" && (
                <QaPanel
                  className="h-full min-h-[400px]"
                  questions={room.questions}
                  you={room.you}
                  enabled={!!cls.qa_enabled && status !== "ended"}
                  disabledReason={status === "ended" ? "This class has ended." : "You have turned Q&A off."}
                  onAsk={(body) => room.send("question", body)}
                  onAnswer={room.answerQuestion}
                  onPin={room.togglePin}
                  onDelete={room.removeMessage}
                />
              )}
              {panel === "people" && (
                <ParticipantsPanel
                  className="h-full min-h-[400px]"
                  presence={room.presence}
                  you={room.you}
                  collapseAfter={0}
                />
              )}
              {panel === "brand" && (
                <OverlayManager
                  overlays={room.overlays}
                  canManage={!!room.you?.moderator}
                  onAdd={room.addOverlay}
                  onUpdate={room.updateOverlay}
                  onRemove={room.removeOverlay}
                />
              )}
              {panel === "guests" && (
                <div className="space-y-5">
                  <CohostLinks classId={cls.id} />
                  <ConnectedCohosts peers={cohosts} peerStates={rtc.peerStates} relayAvailable={rtc.relayAvailable} />
                </div>
              )}
              {panel === "files" && (
                <MaterialsPanel
                  materials={room.materials}
                  canManage
                  onAdd={room.addMaterial}
                  onRemove={room.removeMaterial}
                />
              )}
              {panel === "notices" && (
                <AnnouncementsPanel
                  announcements={room.announcements}
                  canManage
                  onAdd={room.addAnnouncement}
                  onRemove={room.removeAnnouncement}
                />
              )}
            </div>
          </aside>
        )}

        {/* ── Panel rail ─────────────────────────────────────────────────── */}
        <nav
          aria-label="Studio panels"
          className="order-2 flex flex-shrink-0 gap-1 overflow-x-auto border-t border-slate-200 bg-white p-1.5 lg:order-3 lg:w-[76px] lg:flex-col lg:overflow-x-visible lg:border-l lg:border-t-0"
        >
          {PANELS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => togglePanel(item.id)}
              aria-pressed={panel === item.id}
              className={`relative flex min-w-[64px] flex-col items-center gap-1 rounded-xl px-1.5 py-2 text-[10px] font-semibold transition-colors ${
                panel === item.id ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              }`}
            >
              {item.icon}
              {item.label}
              {!!panelBadges[item.id] && (
                <span className="absolute right-1.5 top-1 min-w-[16px] rounded-full bg-slate-900 px-1 text-[9px] font-bold leading-4 text-white">
                  {panelBadges[item.id]}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {settingsOpen && (
        <StudioDialog title="Studio settings" onClose={() => setSettingsOpen(false)}>
          <div className="mb-4 flex gap-1 rounded-xl bg-slate-100 p-1">
            {(["broadcast", "class"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setSettingsTab(key)}
                className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                  settingsTab === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {key === "broadcast" ? "Camera, mic & output" : "Class"}
              </button>
            ))}
          </div>

          {settingsTab === "broadcast" ? (
            <BroadcastTab
              media={media}
              whip={whip}
              cls={cls}
              isLive={isLive}
              actualFps={compositor.actualFps}
              onSaveBroadcast={saveBroadcast}
            />
          ) : (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <LinkField label="Student link (subscribers)" value={publicLink} />
                <LinkField label="Guest link (anyone with the URL)" value={guestLink} />
              </div>
              <div className="space-y-1 rounded-2xl border border-slate-200 px-3 py-2">
                <Toggle
                  label="Live chat"
                  hint="Students can send messages"
                  checked={!!cls.chat_enabled}
                  onChange={(v) => toggleSetting("chat_enabled", v)}
                />
                <Toggle
                  label="Questions & answers"
                  hint="Students can ask questions you answer"
                  checked={!!cls.qa_enabled}
                  onChange={(v) => toggleSetting("qa_enabled", v)}
                />
                <Toggle
                  label="Recording"
                  hint="Save the class so students can rewatch it"
                  checked={!!cls.recording_enabled}
                  onChange={(v) => toggleSetting("recording_enabled", v)}
                />
                <Toggle
                  label="Name plates"
                  hint="Draw each person's name on their tile"
                  checked={!!cls.show_name_plates}
                  onChange={(v) => void saveBroadcast({ show_name_plates: v })}
                />
              </div>
              <InfoTab cls={cls} status={status} startedAt={startedAt} />
            </div>
          )}
        </StudioDialog>
      )}

      {confirmEnd && (
        <ConfirmDialog
          title="End this live class?"
          body="Your broadcast stops and every student is disconnected. This cannot be undone — you would need to create a new class to go live again."
          confirmLabel="End class"
          onCancel={() => setConfirmEnd(false)}
          onConfirm={endClass}
        />
      )}
    </div>
  )
}

/** The rail on the right, in the order a host reaches for them during a class. */
const PANELS: { id: StudioPanel; title: string; label: string; icon: React.ReactNode }[] = [
  { id: "chat", title: "Live chat", label: "Chat", icon: <MessageSquare className="h-[18px] w-[18px]" /> },
  { id: "qa", title: "Questions", label: "Q&A", icon: <HelpCircle className="h-[18px] w-[18px]" /> },
  { id: "people", title: "People", label: "People", icon: <Users className="h-[18px] w-[18px]" /> },
  { id: "brand", title: "Overlays & branding", label: "Brand", icon: <Layers className="h-[18px] w-[18px]" /> },
  { id: "guests", title: "Guests & co-hosts", label: "Guests", icon: <UserPlus className="h-[18px] w-[18px]" /> },
  { id: "files", title: "Class materials", label: "Files", icon: <Paperclip className="h-[18px] w-[18px]" /> },
  { id: "notices", title: "Announcements", label: "Notices", icon: <Bell className="h-[18px] w-[18px]" /> },
]

/** A round button in the studio's control row: icon above, label below. */
function StudioButton({
  onClick,
  icon,
  label,
  active,
  tone = "blue",
  disabled,
}: {
  onClick: () => void
  icon: React.ReactNode
  label: string
  active?: boolean
  tone?: "blue" | "rose"
  disabled?: boolean
}) {
  const on = tone === "rose" ? "bg-rose-600 text-white ring-rose-600" : "bg-blue-600 text-white ring-blue-600"
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className="flex w-16 flex-col items-center gap-1 rounded-xl py-1 text-[11px] font-semibold text-slate-600 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-full shadow-sm ring-1 transition-colors ${
          active ? on : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
        }`}
      >
        {icon}
      </span>
      {label}
    </button>
  )
}

/** A modal over the studio. Escape and the backdrop both close it. */
function StudioDialog({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-slate-950/50 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[78vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}

function BroadcastTab({
  media,
  whip,
  cls,
  isLive,
  actualFps,
  onSaveBroadcast,
}: {
  media: ReturnType<typeof useMediaSources>
  whip: ReturnType<typeof useWhipBroadcast>
  cls: AdminLiveClass
  isLive: boolean
  actualFps: number
  onSaveBroadcast: (
    settings: Partial<{ width: number; height: number; fps: number; overlay_render: AdminLiveClass["overlay_render"] }>,
  ) => void
}) {
  const [showKey, setShowKey] = useState(false)
  const [showRtmps, setShowRtmps] = useState(false)

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4">
          <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-900">
            This device
          </h4>
          <DevicePanel media={media} />
        </div>

        <div className="space-y-4">
          {/* ── encoder ────────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4">
            <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-900">
              Output
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-slate-600">Resolution</span>
                <select
                  value={`${cls.broadcast_width}x${cls.broadcast_height}`}
                  onChange={(e) => {
                    const [w, h] = e.target.value.split("x").map(Number)
                    onSaveBroadcast({ width: w, height: h })
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold"
                >
                  <option value="1280x720">720p</option>
                  <option value="1920x1080">1080p</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-slate-600">Frame rate</span>
                <select
                  value={cls.broadcast_fps}
                  onChange={(e) => onSaveBroadcast({ fps: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold"
                >
                  <option value={24}>24 fps</option>
                  <option value={30}>30 fps</option>
                </select>
              </label>
            </div>

            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
              The mixer draws every source and every overlay on this machine, so the picture costs
              CPU here rather than in the cloud. 1080p is worth it for a slide-heavy class on a
              capable laptop; on anything older, 720p at 30fps looks better than 1080p at 12.
              {actualFps > 0 && (
                <span className="ml-1 font-semibold text-slate-700">
                  Currently mixing at {actualFps} fps.
                </span>
              )}
            </p>

            <label className="mt-3 block">
              <span className="mb-1 block text-[11px] font-medium text-slate-600">
                Where overlays are drawn
              </span>
              <select
                value={cls.overlay_render}
                onChange={(e) =>
                  onSaveBroadcast({ overlay_render: e.target.value as AdminLiveClass["overlay_render"] })
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold"
              >
                <option value="burn">Into the video (this studio)</option>
                <option value="viewer">On the student&rsquo;s page (OBS / RTMPS)</option>
                <option value="both">Both</option>
              </select>
              <span className="mt-1 block text-[11px] leading-relaxed text-slate-500">
                Burned-in overlays are in the recording and land on the right moment of the lesson.
                Choose the student&rsquo;s page only when an external encoder is producing the video.
              </span>
            </label>
          </div>

          {/* ── telemetry ──────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4">
            <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-900">
              Broadcast health
            </h4>
            {whip.publishing ? (
              <div className="grid grid-cols-2 gap-3">
                <Metric
                  label="Upload bitrate"
                  value={formatBitrate(whip.stats.bitrateKbps)}
                  tone={whip.stats.bitrateKbps > 600 ? "good" : whip.stats.bitrateKbps > 150 ? "warn" : "bad"}
                />
                <Metric
                  label="Packet loss"
                  value={`${(whip.stats.packetLoss * 100).toFixed(1)}%`}
                  tone={whip.stats.packetLoss < 0.02 ? "good" : whip.stats.packetLoss < 0.05 ? "warn" : "bad"}
                />
                <Metric
                  label="Round trip"
                  value={whip.stats.rttMs ? `${whip.stats.rttMs} ms` : "—"}
                  tone={whip.stats.rttMs < 150 ? "good" : whip.stats.rttMs < 300 ? "warn" : "bad"}
                />
                <Metric
                  label="Sending"
                  value={
                    whip.stats.width
                      ? `${whip.stats.width}×${whip.stats.height} @ ${whip.stats.fps}fps`
                      : "—"
                  }
                  tone="neutral"
                />
              </div>
            ) : (
              <p className="rounded-xl bg-white px-4 py-6 text-center text-xs text-slate-500">
                {isLive
                  ? "The class is live but this browser is not publishing. Press Retry broadcast, or use the RTMPS details below with OBS."
                  : "Go live to see real upload bitrate, packet loss and latency here."}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── external encoder ───────────────────────────────────────────── */}
      <details
        open={showRtmps}
        onToggle={(e) => setShowRtmps((e.currentTarget as HTMLDetailsElement).open)}
        className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4"
      >
        <summary className="flex cursor-pointer list-none items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-900">
          Stream with OBS or another encoder
          <ChevronDown className={`h-4 w-4 transition-transform ${showRtmps ? "rotate-180" : ""}`} />
        </summary>

        <div className="mt-3 space-y-2">
          <p className="text-[11px] leading-relaxed text-slate-500">
            Broadcasting from this page needs nothing but the browser, and it is the only mode that
            supports co-hosts, layouts and burned-in overlays — all of that is mixed here. Point an
            encoder at these instead when you need a hardware setup this page cannot drive, then set
            overlays to draw on the student&rsquo;s page and press Go live.
          </p>
          <LinkField label="RTMPS server" value={cls.cf_rtmps_url ?? "Not available"} mono />
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-600">Stream key</span>
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
              >
                {showKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {showKey ? "Hide" : "Show"}
              </button>
            </div>
            <CopyRow
              value={cls.cf_rtmps_key ?? ""}
              display={showKey ? cls.cf_rtmps_key ?? "" : "••••••••••••••••••••"}
              mono
            />
            <p className="mt-1 text-[11px] text-amber-700">
              Treat this key like a password — anyone holding it can broadcast to your class.
            </p>
          </div>
        </div>
      </details>
    </div>
  )
}

/* ── connected co-hosts ─────────────────────────────────────────────────── */

function ConnectedCohosts({
  peers,
  peerStates,
  relayAvailable,
}: {
  peers: { cid: string; name: string; role: string; sources: { id: string }[] }[]
  peerStates: Record<string, RTCPeerConnectionState>
  relayAvailable: boolean
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-bold text-slate-900">Connected now</h4>

      {!peers.length ? (
        <p className="rounded-xl bg-slate-50 px-3 py-5 text-center text-[11px] text-slate-400">
          No co-hosts are connected. Send someone a link above and they will appear here.
        </p>
      ) : (
        peers.map((peer) => (
          <div
            key={peer.cid}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-2.5 py-2"
          >
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-[10px] font-bold text-emerald-700">
              {peer.name.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-bold text-slate-800">{peer.name}</p>
              <p className="text-[10px] text-slate-500">
                {peer.sources.length} {peer.sources.length === 1 ? "source" : "sources"} ·{" "}
                {peerStates[peer.cid] ?? "waiting"}
              </p>
            </div>
          </div>
        ))
      )}

      {!relayAvailable && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-800">
          No TURN relay is configured for this deployment. Most co-hosts will still connect
          peer-to-peer, but anyone behind a restrictive network or carrier-grade NAT will not — set
          <code className="mx-1 rounded bg-amber-100 px-1">CF_TURN_KEY_ID</code> and
          <code className="mx-1 rounded bg-amber-100 px-1">CF_TURN_KEY_API_TOKEN</code> on the API
          worker to fix that.
        </p>
      )}
    </div>
  )
}

function InfoTab({
  cls,
  status,
  startedAt,
}: {
  cls: AdminLiveClass
  status: string
  startedAt: string | null
}) {
  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Fact label="Status" value={status} className="capitalize" />
        <Fact label="Scheduled" value={formatFull(cls.scheduled_at)} />
        <Fact label="Duration" value={`${cls.duration_minutes ?? 60} minutes`} />
        <Fact label="Started" value={startedAt ? formatFull(startedAt) : "Not started"} />
      </dl>

      {cls.description ? (
        <p className="rounded-xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-700">
          {cls.description}
        </p>
      ) : (
        <p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-400">No description added.</p>
      )}

      <Link
        href={`/admin/live-classes/${cls.id}`}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
      >
        Edit class details
        <ExternalLink className="h-3 w-3" />
      </Link>
    </div>
  )
}

/* ── small pieces ───────────────────────────────────────────────────────── */

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    live: "bg-rose-50 text-rose-700 border-rose-200",
    scheduled: "bg-blue-50 text-blue-700 border-blue-200",
    ended: "bg-slate-100 text-slate-600 border-slate-200",
    cancelled: "bg-amber-50 text-amber-700 border-amber-200",
  }
  return (
    <span
      className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
        styles[status] ?? styles.scheduled
      }`}
    >
      {status}
    </span>
  )
}

function HealthBadge({
  health,
  bitrateKbps,
  publishing,
}: {
  health: StreamHealth
  bitrateKbps: number
  publishing: boolean
}) {
  if (!publishing) return null
  const style = HEALTH_STYLES[health]

  return (
    <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700/60 bg-slate-800 px-2.5 py-2 text-[11px] font-medium text-slate-200">
      <Gauge className="h-3 w-3" />
      <span className="hidden sm:inline">Stream health</span>
      <span className={`rounded px-1.5 py-px text-[10px] font-bold ${style.chip}`}>{style.label}</span>
      {bitrateKbps > 0 && (
        <span className="hidden font-mono text-[10px] text-slate-400 sm:inline">
          {formatBitrate(bitrateKbps)}
        </span>
      )}
    </span>
  )
}

/** Bytes the browser has recorded but not yet got to the server. */
function backlogBytes(r: StudioRecorder): number {
  return Math.max(0, r.recordedBytes - r.uploadedBytes)
}

function uploadPercent(r: StudioRecorder): number {
  return r.recordedBytes ? Math.min(100, Math.floor((r.uploadedBytes / r.recordedBytes) * 100)) : 100
}

function formatMegabytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`
}

/**
 * What the recorder is doing, next to stream health. "Behind" appears when
 * the uplink cannot keep up with broadcast and upload together — the bytes
 * are safe in the tab, but closing it would lose them.
 */
function RecordingBadge({ recorder }: { recorder: StudioRecorder }) {
  if (recorder.state === "idle") return null

  const behind = backlogBytes(recorder)
  const label =
    recorder.state === "recording"
      ? `REC · ${formatMegabytes(recorder.recordedBytes)}`
      : recorder.state === "saving"
        ? `Saving ${uploadPercent(recorder)}%`
        : recorder.state === "saved"
          ? "Recording saved"
          : recorder.state === "unsupported"
            ? "Can't record here"
            : "Recording failed"

  const tone =
    recorder.state === "recording"
      ? "border-rose-500/40 text-rose-200"
      : recorder.state === "saved"
        ? "border-emerald-500/40 text-emerald-200"
        : recorder.state === "saving"
          ? "border-blue-500/40 text-blue-200"
          : "border-amber-500/40 text-amber-200"

  return (
    <span
      title={recorder.error ?? undefined}
      className={`inline-flex items-center gap-1.5 rounded-xl border bg-slate-800 px-2.5 py-2 text-[11px] font-semibold ${tone}`}
    >
      {recorder.state === "saving" ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <CircleDot className={`h-3 w-3 ${recorder.state === "recording" ? "animate-pulse text-rose-400" : ""}`} />
      )}
      {label}
      {recorder.state === "recording" && behind > 15 * 1024 * 1024 && (
        <span className="font-mono text-[10px] text-amber-300">{formatMegabytes(behind)} behind</span>
      )}
    </span>
  )
}




function Metric({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: "good" | "warn" | "bad" | "neutral"
}) {
  const tones = {
    good: "text-emerald-600",
    warn: "text-amber-600",
    bad: "text-rose-600",
    neutral: "text-slate-900",
  }
  return (
    <div className="rounded-xl border border-slate-200/70 bg-white p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-sm font-bold ${tones[tone]}`}>{value}</p>
    </div>
  )
}

function Fact({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className="rounded-xl border border-slate-200/70 bg-slate-50 p-3">
      <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className={`mt-1 text-xs font-bold text-slate-900 ${className}`}>{value}</dd>
    </div>
  )
}

function LinkField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold text-slate-600">{label}</p>
      <CopyRow value={value} mono={mono} />
    </div>
  )
}

function CopyRow({ value, display, mono }: { value: string; display?: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard is blocked outside a secure context; the text is selectable.
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        readOnly
        value={display ?? value}
        onFocus={(e) => e.currentTarget.select()}
        className={`min-w-0 flex-1 truncate rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 ${
          mono ? "font-mono" : ""
        }`}
      />
      <button
        type="button"
        onClick={copy}
        aria-label="Copy to clipboard"
        className={`flex-shrink-0 rounded-xl border px-2.5 py-2 transition-colors ${
          copied
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
        }`}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-800">{label}</p>
        <p className="text-[11px] text-slate-500">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-blue-600" : "bg-slate-300"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-[18px]" : "translate-x-[3px]"
          }`}
        />
      </button>
    </div>
  )
}

function ConfirmDialog({
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string
  body: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">{body}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-700"
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            Keep streaming
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── formatting ─────────────────────────────────────────────────────────── */

function formatFull(value: string): string {
  if (!value) return "—"
  const iso = value.includes("T") ? value : `${value.replace(" ", "T")}Z`
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatTime(value: string): string {
  const iso = value.includes("T") ? value : `${value.replace(" ", "T")}Z`
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
}

function formatBitrate(kbps: number): string {
  if (kbps <= 0) return "—"
  return kbps >= 1000 ? `${(kbps / 1000).toFixed(1)} Mbps` : `${kbps} kbps`
}
