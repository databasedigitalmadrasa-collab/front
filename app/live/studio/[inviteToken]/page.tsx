"use client"

/**
 * `/live/studio/<invite_token>` — the guest host's side of a multi-host class.
 *
 * A co-host link opens here. The page does two things the student page does
 * not: it opens a camera and sends it to the host's studio over WebRTC, and it
 * shows the composited programme coming back, so the guest can see exactly
 * what the class sees rather than guessing whether they are on air.
 *
 * THE GREEN ROOM IS NOT DECORATION
 * -------------------------------
 * Nobody joins straight onto the broadcast. The first screen is a camera and
 * microphone check, because the alternative is a guest discovering their
 * microphone was on the wrong device while several hundred students watch.
 * Joining is a deliberate second click.
 *
 * Their camera reaching the studio is also not the same as their camera being
 * on screen — the host decides that from the source rail. The banner at the
 * top of the joined view says which of the two is currently true, since it is
 * the only question a guest actually has.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import {
  AlertTriangle,
  Camera,
  Loader2,
  LogOut,
  Mic,
  MicOff,
  MonitorUp,
  Radio,
  ShieldAlert,
  UserCheck,
  Video,
  VideoOff,
} from "lucide-react"
import { useLiveRoom } from "@/hooks/use-live-room"
import { useMediaSources } from "@/hooks/use-media-sources"
import { useStageRtc } from "@/hooks/use-stage-rtc"
import { guestKey, recallGuestName, rememberGuestName, roomApi } from "@/lib/live-room"
import { ChatPanel } from "@/components/live/chat-panel"
import { QaPanel } from "@/components/live/qa-panel"
import { ConnectionBadge } from "@/components/live/connection-badge"
import { DevicePanel } from "@/components/live/stage/device-panel"

export default function GuestStudioPage() {
  const { inviteToken } = useParams<{ inviteToken: string }>()

  const [key, setKey] = useState("")
  const [name, setName] = useState("")
  const [joined, setJoined] = useState(false)
  const [checking, setChecking] = useState(true)
  const [needsName, setNeedsName] = useState(true)
  const [linkError, setLinkError] = useState<string | null>(null)

  const media = useMediaSources()

  // localStorage is not available during the server render, so both the key
  // and the remembered name are read after mount.
  useEffect(() => {
    setKey(guestKey())
    setName(recallGuestName())
  }, [])

  /**
   * Ask the room who we would be with no name supplied.
   *
   * A link with a locked display name, or one opened by somebody already
   * signed in, already knows who its holder is — asking them to type a name
   * they are not allowed to change would be theatre. A 400 back means the
   * invite genuinely needs one.
   */
  useEffect(() => {
    if (!inviteToken) return
    let cancelled = false

    void roomApi.state({ token: inviteToken }).then((res) => {
      if (cancelled) return
      setChecking(false)
      if (res.ok && res.data?.you?.name) {
        setName(res.data.you.name)
        setNeedsName(false)
        return
      }
      if (res.status === 400) {
        setNeedsName(true)
        return
      }
      if (res.status >= 401) setLinkError(res.error || "This co-host link is not usable.")
    })

    return () => {
      cancelled = true
    }
  }, [inviteToken])

  // Warm the camera in the green room, so framing and lighting are sorted out
  // before anyone is watching.
  const startedRef = useRef(false)
  useEffect(() => {
    if (checking || linkError || startedRef.current) return
    startedRef.current = true
    void media.start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking, linkError])

  if (linkError) return <BlockedCard message={linkError} />

  if (!joined) {
    return (
      <GreenRoom
        media={media}
        name={name}
        setName={setName}
        needsName={needsName}
        checking={checking}
        ready={!!key}
        onJoin={() => {
          if (needsName) rememberGuestName(name.trim())
          setJoined(true)
        }}
      />
    )
  }

  return (
    <JoinedStudio
      token={inviteToken}
      guestName={name.trim()}
      guestKey={key}
      media={media}
      onLeave={() => {
        media.stopAll()
        setJoined(false)
      }}
    />
  )
}

/* ── green room ─────────────────────────────────────────────────────────── */

function GreenRoom({
  media,
  name,
  setName,
  needsName,
  checking,
  ready,
  onJoin,
}: {
  media: ReturnType<typeof useMediaSources>
  name: string
  setName: (value: string) => void
  needsName: boolean
  checking: boolean
  ready: boolean
  onJoin: () => void
}) {
  const preview = useRef<HTMLVideoElement | null>(null)
  const camera = media.sources.find((s) => s.kind === "camera")

  useEffect(() => {
    const el = preview.current
    if (!el) return
    el.srcObject = camera?.stream ?? null
    if (camera) void el.play().catch(() => undefined)
  }, [camera])

  const canJoin = ready && !checking && (!needsName || !!name.trim())

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="grid md:grid-cols-2">
          <div className="relative aspect-video bg-slate-950 md:aspect-auto md:min-h-[300px]">
            <video
              ref={preview}
              autoPlay
              muted
              playsInline
              className="h-full w-full object-cover"
            />
            {!camera && (
              <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                <VideoOff className="mb-2 h-8 w-8 text-slate-600" />
                <p className="text-xs font-semibold text-slate-300">No camera yet</p>
                <button
                  type="button"
                  onClick={() => void media.start()}
                  className="mt-3 rounded-lg bg-white px-3 py-1.5 text-[11px] font-bold text-slate-900"
                >
                  Start camera
                </button>
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 p-3">
              <button
                type="button"
                onClick={media.toggleMic}
                className={`rounded-full p-2.5 transition-colors ${
                  media.micMuted ? "bg-rose-600 text-white" : "bg-white/90 text-slate-800"
                }`}
                title={media.micMuted ? "Unmute" : "Mute"}
              >
                {media.micMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
              {camera && (
                <button
                  type="button"
                  onClick={() => media.toggleSource(camera.id)}
                  className={`rounded-full p-2.5 transition-colors ${
                    camera.enabled ? "bg-white/90 text-slate-800" : "bg-rose-600 text-white"
                  }`}
                  title={camera.enabled ? "Turn camera off" : "Turn camera on"}
                >
                  {camera.enabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </button>
              )}
            </div>
          </div>

          <div className="p-6 sm:p-7">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-200 bg-indigo-50 text-indigo-600">
              <Camera className="h-5 w-5" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">
              You have been invited to co-host
            </h1>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
              Check your camera and microphone here. Nothing is broadcast until the host puts you on
              screen.
            </p>

            {needsName && (
              <label className="mt-5 block">
                <span className="mb-1.5 block text-xs font-bold text-slate-700">Your name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 60))}
                  placeholder="e.g. Ustadh Ahmed"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <span className="mt-1 block text-[11px] text-slate-400">
                  This appears on your name plate on screen.
                </span>
              </label>
            )}

            {!needsName && !checking && (
              <p className="mt-5 rounded-xl bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700">
                Joining as {name}
              </p>
            )}

            <div className="mt-4 space-y-3">
              <select
                value={media.micDeviceId}
                onChange={(e) => void media.selectMic(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
              >
                {!media.microphones.length && <option value="">No microphone found</option>}
                {media.microphones.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label}
                  </option>
                ))}
              </select>

              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-[width] duration-75 ${
                    media.micMuted ? "bg-slate-300" : "bg-emerald-500"
                  }`}
                  style={{ width: `${media.micMuted ? 0 : media.audioLevel}%` }}
                />
              </div>

              {camera && (
                <select
                  value={camera.deviceId ?? ""}
                  onChange={(e) => void media.replaceDevice(camera.id, e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                >
                  {!media.cameras.length && <option value="">No camera found</option>}
                  {media.cameras.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {media.error && (
              <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-800">
                {media.error}
              </p>
            )}

            <button
              type="button"
              onClick={onJoin}
              disabled={!canJoin}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
            >
              {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
              Join the stage
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── joined ─────────────────────────────────────────────────────────────── */

function JoinedStudio({
  token,
  guestName,
  guestKey: key,
  media,
  onLeave,
}: {
  token: string
  guestName: string
  guestKey: string
  media: ReturnType<typeof useMediaSources>
  onLeave: () => void
}) {
  const room = useLiveRoom({ token, guestName, guestKey: key, principal: "auto" })
  const [rail, setRail] = useState<"chat" | "qa">("chat")

  const auth = useMemo(() => ({ token, guestName, guestKey: key }), [token, guestName, key])

  const rtc = useStageRtc({
    enabled: !!room.you?.stage,
    producer: false,
    peers: room.stage.peers,
    selfCid: room.you?.cid ?? null,
    auth,
    signal: room.signal,
    onEvent: room.onEvent,
    localSources: media.sources,
    micTrack: media.micTrack,
  })

  /* Tell the room what we are offering, whenever that changes. */
  const announce = media.announce
  const publishSources = room.publishSources
  useEffect(() => {
    publishSources(announce())
  }, [announce, publishSources, media.sources, media.micMuted, room.connection])

  /* The programme coming back from the studio. */
  const programRef = useRef<HTMLVideoElement | null>(null)
  useEffect(() => {
    const el = programRef.current
    if (!el) return
    el.srcObject = rtc.programStream
    if (rtc.programStream) void el.play().catch(() => undefined)
  }, [rtc.programStream])

  const producer = room.stage.peers.find((p) => p.producer)
  const mySourceIds = media.sources.map((s) => s.id)
  const onAir =
    room.liveClass?.status === "live" &&
    (room.stage.onStage.length === 0 || room.stage.onStage.some((id) => mySourceIds.includes(id)))

  if (room.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
      </div>
    )
  }

  if (room.error) return <BlockedCard message={room.error} />

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border ${
                onAir ? "border-rose-200 bg-rose-50 text-rose-600" : "border-slate-200 bg-slate-50 text-slate-500"
              }`}
            >
              <Radio className={`h-4 w-4 ${onAir ? "animate-pulse" : ""}`} />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold text-slate-900 sm:text-base">
                {room.liveClass?.title}
              </h1>
              <p className="text-[11px] font-medium text-slate-500">
                Co-hosting as {room.you?.name ?? guestName}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ConnectionBadge connection={room.connection} className="hidden sm:inline-flex" />
            <button
              type="button"
              onClick={onLeave}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            >
              <LogOut className="h-3.5 w-3.5" />
              Leave
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-4 sm:px-6 sm:py-6 lg:grid-cols-12 lg:gap-6">
        <div className="order-1 space-y-4 lg:col-span-8">
          <StatusBanner
            onAir={onAir}
            hasProducer={!!producer}
            relayAvailable={rtc.relayAvailable}
            peerState={producer ? rtc.peerStates[producer.cid] : undefined}
          />

          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-lg">
            <div className="relative aspect-video w-full">
              {/*
                Deliberately NOT muted: this is the programme mix with this
                guest's own microphone already removed by the studio, so it can
                be monitored without any echo. Muting it would leave a co-host
                unable to hear the person they are talking to.
              */}
              <video
                ref={programRef}
                autoPlay
                playsInline
                className="h-full w-full bg-slate-950 object-contain"
              />
              {!rtc.programStream && (
                <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                  <Loader2 className="mb-3 h-7 w-7 animate-spin text-slate-500" />
                  <p className="text-xs font-semibold text-slate-300">
                    Waiting for the host&rsquo;s studio
                  </p>
                  <p className="mt-1 max-w-xs text-[11px] text-slate-500">
                    The programme appears here once the host has started their studio.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-slate-800 bg-slate-900 px-3 py-3 sm:px-5">
              <ControlButton
                onClick={media.toggleMic}
                active={media.micMuted}
                icon={media.micMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                label={media.micMuted ? "Unmute" : "Mute"}
              />
              {media.sources
                .filter((s) => s.kind === "camera")
                .slice(0, 1)
                .map((camera) => (
                  <ControlButton
                    key={camera.id}
                    onClick={() => media.toggleSource(camera.id)}
                    active={!camera.enabled}
                    icon={camera.enabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                    label={camera.enabled ? "Stop camera" : "Start camera"}
                  />
                ))}
              <ControlButton
                onClick={() => void media.startScreenShare()}
                active={media.screenSharing}
                activeTone="blue"
                icon={<MonitorUp className="h-4 w-4" />}
                label={media.screenSharing ? "Sharing" : "Share screen"}
              />
            </div>
          </div>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-5">
            <h3 className="mb-3 text-sm font-bold tracking-tight text-slate-900">Your devices</h3>
            <DevicePanel media={media} />
          </section>
        </div>

        <div className="order-2 lg:col-span-4">
          <div className="flex flex-col gap-4 lg:sticky lg:top-24">
            <div className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200/80 bg-white p-1 shadow-xs">
              {(["chat", "qa"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setRail(tab)}
                  aria-pressed={rail === tab}
                  className={`rounded-lg py-2 text-[11px] font-bold transition-colors ${
                    rail === tab ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {tab === "chat" ? "Chat" : "Q&A"}
                </button>
              ))}
            </div>

            {rail === "chat" ? (
              <ChatPanel
                className="h-[52vh] min-h-[300px]"
                messages={room.chat}
                you={room.you}
                connection={room.connection}
                enabled={!!room.liveClass?.chat_enabled}
                disabledReason="The host has turned chat off."
                onSend={(body) => room.send("chat", body)}
                onDelete={room.you?.moderator ? room.removeMessage : undefined}
              />
            ) : (
              <QaPanel
                className="h-[52vh] min-h-[300px]"
                questions={room.questions}
                you={room.you}
                enabled={!!room.liveClass?.qa_enabled}
                disabledReason="The host has turned Q&A off."
                onAsk={(body) => room.send("question", body)}
                onAnswer={room.you?.moderator ? room.answerQuestion : undefined}
                onPin={room.you?.moderator ? room.togglePin : undefined}
                onDelete={room.you?.moderator ? room.removeMessage : undefined}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

/* ── pieces ─────────────────────────────────────────────────────────────── */

/**
 * The one question a guest host has, answered without them asking.
 *
 * "Connected" and "on screen" are different states and the difference is not
 * observable from a camera preview, which is why a guest with no banner spends
 * the class quietly wondering whether anyone can see them.
 */
function StatusBanner({
  onAir,
  hasProducer,
  relayAvailable,
  peerState,
}: {
  onAir: boolean
  hasProducer: boolean
  relayAvailable: boolean
  peerState: RTCPeerConnectionState | undefined
}) {
  if (!hasProducer) {
    return (
      <Banner tone="slate" icon={<Loader2 className="h-4 w-4 animate-spin" />}>
        The host has not opened their studio yet. Stay on this page — you will connect automatically.
      </Banner>
    )
  }

  if (peerState === "failed" || peerState === "closed") {
    return (
      <Banner tone="rose" icon={<ShieldAlert className="h-4 w-4" />}>
        Your camera could not reach the host.
        {relayAvailable
          ? " Retrying over the relay — if this persists, check whether your network blocks video calls."
          : " This deployment has no TURN relay configured, which is usually the cause on restrictive networks."}
      </Banner>
    )
  }

  if (peerState !== "connected") {
    return (
      <Banner tone="slate" icon={<Loader2 className="h-4 w-4 animate-spin" />}>
        Connecting your camera to the host&rsquo;s studio…
      </Banner>
    )
  }

  return onAir ? (
    <Banner tone="rose" icon={<Radio className="h-4 w-4 animate-pulse" />}>
      You are on screen. The class can see and hear you.
    </Banner>
  ) : (
    <Banner tone="emerald" icon={<UserCheck className="h-4 w-4" />}>
      Connected and ready. The host has not put you on screen yet.
    </Banner>
  )
}

function Banner({
  tone,
  icon,
  children,
}: {
  tone: "slate" | "rose" | "emerald"
  icon: React.ReactNode
  children: React.ReactNode
}) {
  const tones = {
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    rose: "border-rose-200 bg-rose-50 text-rose-800",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
  }
  return (
    <div className={`flex items-start gap-2.5 rounded-2xl border px-4 py-3 ${tones[tone]}`}>
      <span className="mt-0.5 flex-shrink-0">{icon}</span>
      <p className="text-xs font-medium leading-relaxed">{children}</p>
    </div>
  )
}

function ControlButton({
  onClick,
  active,
  activeTone = "rose",
  icon,
  label,
}: {
  onClick: () => void
  active?: boolean
  activeTone?: "rose" | "blue"
  icon: React.ReactNode
  label: string
}) {
  const tone = activeTone === "blue" ? "bg-blue-600 text-white" : "bg-rose-600 text-white"
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-colors ${
        active ? tone : "bg-slate-800 text-slate-200 hover:bg-slate-700"
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function BlockedCard({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">This co-host link is not usable</h2>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">{message}</p>
        <p className="mt-4 text-[11px] text-slate-400">
          Ask the host to send you a new link from the class studio.
        </p>
      </div>
    </div>
  )
}
