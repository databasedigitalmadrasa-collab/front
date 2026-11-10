"use client"

/**
 * Backstage — every source the producer could put on air, as live thumbnails.
 *
 * This replaces a list of names with "On air / Off" pills. A producer choosing
 * who goes on stage needs to see them: whether the guest's camera is actually
 * pointing at the guest, whether the screen share is the slide deck or their
 * inbox. Each card plays its own source, and its one big button says what
 * pressing it does.
 *
 * On stage is explicit. Nothing reaches the broadcast unless it was added here
 * (the studio adds the host's own camera, and a fresh screen share, for them).
 */

import { useEffect, useRef } from "react"
import {
  FlipHorizontal2,
  Loader2,
  Mic,
  MicOff,
  Monitor,
  MonitorUp,
  Plus,
  Star,
  UserPlus,
  Video,
  VideoOff,
  X,
} from "lucide-react"
import type { CompositorSource } from "@/hooks/use-stage-compositor"

export interface PendingSource {
  id: string
  kind: "camera" | "screen" | "media"
  label: string
}

export interface BackstageProps {
  sources: CompositorSource[]
  /** Announced by a co-host but not arrived over WebRTC yet. */
  pending: PendingSource[]
  onStageIds: string[]
  /** On stage and actually drawn by the current layout. */
  visibleIds: string[]
  featured: string | null
  muted: string[]
  peerStates: Record<string, RTCPeerConnectionState>
  canProduce: boolean
  onToggleStage: (sourceId: string) => void
  onFeature: (sourceId: string | null) => void
  onToggleMute: (sourceId: string) => void
  /** Local sources only. */
  onToggleCamera?: (sourceId: string) => void
  /** Mirror a local camera, in the broadcast as well as here. */
  onToggleFlip?: (sourceId: string) => void
  onRemoveSource?: (sourceId: string) => void
  onAddCamera?: () => void
  onShareScreen?: () => void
  onInvite?: () => void
  canAddSources: boolean
}

export function Backstage({
  sources,
  pending,
  onStageIds,
  visibleIds,
  featured,
  muted,
  peerStates,
  canProduce,
  onToggleStage,
  onFeature,
  onToggleMute,
  onToggleCamera,
  onToggleFlip,
  onRemoveSource,
  onAddCamera,
  onShareScreen,
  onInvite,
  canAddSources,
}: BackstageProps) {
  return (
    <div className="flex gap-2.5 overflow-x-auto pb-1" role="list" aria-label="Sources">
      {sources.map((source) => {
        const onStage = onStageIds.includes(source.id)
        const hidden = onStage && !visibleIds.includes(source.id)
        const isFeatured = featured === source.id
        const isMuted = muted.includes(source.id)
        const connection = source.peerCid ? peerStates[source.peerCid] : undefined
        const local = !source.peerCid

        return (
          <div
            key={source.id}
            role="listitem"
            className={`group w-48 flex-shrink-0 rounded-xl border bg-white p-1.5 shadow-xs transition-colors ${
              onStage ? "border-emerald-400 ring-1 ring-emerald-400" : "border-slate-200"
            }`}
          >
            <div className="relative aspect-video overflow-hidden rounded-lg bg-slate-900">
              {/* As it appears on the programme, mirror included. */}
              <SourceVideo stream={source.stream} contain={source.kind === "screen"} mirrored={!!source.mirrored} />

              {!source.live && source.kind === "camera" && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                  <VideoOff className="h-5 w-5 text-slate-500" />
                </div>
              )}

              <div className="absolute left-1 top-1 flex items-center gap-1">
                {onStage && (
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white ${
                      hidden ? "bg-amber-500" : "bg-emerald-600"
                    }`}
                    title={hidden ? "On stage, but the current layout has no room for it" : undefined}
                  >
                    {hidden ? "Not shown" : "On stage"}
                  </span>
                )}
                {isFeatured && (
                  <span className="rounded bg-amber-400 p-0.5 text-amber-950" title="Featured">
                    <Star className="h-2.5 w-2.5 fill-current" />
                  </span>
                )}
                {isMuted && (
                  <span className="rounded bg-rose-600 p-0.5 text-white" title="Muted on air">
                    <MicOff className="h-2.5 w-2.5" />
                  </span>
                )}
              </div>

              {/* This device's own camera and screen: switch off or close. On
                  hover, because they are reached for far less often than the
                  stage controls and would crowd the card otherwise. */}
              {canProduce && local && (
                <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                  {source.kind === "camera" && onToggleCamera && (
                    <ThumbIcon
                      title={source.live ? "Turn camera off" : "Turn camera on"}
                      onClick={() => onToggleCamera(source.id)}
                    >
                      {source.live ? <Video className="h-3 w-3" /> : <VideoOff className="h-3 w-3" />}
                    </ThumbIcon>
                  )}
                  {source.kind === "camera" && onToggleFlip && (
                    <ThumbIcon
                      title={
                        source.mirrored
                          ? "Mirrored for you, the students and the recording. Click to unmirror"
                          : "Mirror this camera (you, the students and the recording all see it mirrored)"
                      }
                      active={!!source.mirrored}
                      onClick={() => onToggleFlip(source.id)}
                    >
                      <FlipHorizontal2 className="h-3 w-3" />
                    </ThumbIcon>
                  )}
                  {onRemoveSource && (
                    <ThumbIcon
                      title={source.kind === "screen" ? "Stop sharing" : "Close this camera"}
                      onClick={() => onRemoveSource(source.id)}
                    >
                      <X className="h-3 w-3" />
                    </ThumbIcon>
                  )}
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-gradient-to-t from-black/80 to-transparent px-1.5 pb-1 pt-4">
                {source.kind === "screen" ? (
                  <Monitor className="h-3 w-3 flex-shrink-0 text-blue-300" />
                ) : (
                  <Video className="h-3 w-3 flex-shrink-0 text-white/70" />
                )}
                <span className="truncate text-[10px] font-bold text-white">{source.label}</span>
              </div>

              {source.peerCid && connection !== "connected" && (
                <span className="absolute left-1 top-6 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold text-amber-300">
                  {connectionLabel(connection)}
                </span>
              )}
            </div>

            {canProduce && (
              <div className="mt-1.5 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onToggleStage(source.id)}
                  className={`flex-1 whitespace-nowrap rounded-lg px-2 py-1.5 text-[11px] font-bold transition-colors ${
                    onStage
                      ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {onStage ? "Remove" : "Add to stage"}
                </button>
                <CardIcon
                  title={isFeatured ? "Stop featuring" : "Feature — show this one large"}
                  active={isFeatured}
                  tone="amber"
                  onClick={() => onFeature(isFeatured ? null : source.id)}
                >
                  <Star className={`h-3.5 w-3.5 ${isFeatured ? "fill-current" : ""}`} />
                </CardIcon>
                <CardIcon
                  title={isMuted ? "Unmute on air" : "Mute on air"}
                  active={isMuted}
                  tone="rose"
                  onClick={() => onToggleMute(source.id)}
                >
                  {isMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                </CardIcon>
              </div>
            )}
          </div>
        )
      })}

      {pending.map((source) => (
        <div
          key={source.id}
          role="listitem"
          className="w-48 flex-shrink-0 rounded-xl border border-dashed border-slate-300 bg-white p-1.5"
        >
          <div className="flex aspect-video flex-col items-center justify-center gap-1 rounded-lg bg-slate-100 text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="max-w-full truncate px-2 text-[10px] font-semibold">{source.label}</span>
          </div>
          <p className="mt-1.5 text-center text-[10px] font-medium text-slate-400">Connecting…</p>
        </div>
      ))}

      {canAddSources && (
        <div className="flex w-36 flex-shrink-0 flex-col gap-1.5">
          {onAddCamera && (
            <AddCard onClick={onAddCamera} icon={<Plus className="h-3.5 w-3.5" />} label="Add camera" />
          )}
          {onShareScreen && (
            <AddCard onClick={onShareScreen} icon={<MonitorUp className="h-3.5 w-3.5" />} label="Share screen" />
          )}
          {onInvite && (
            <AddCard onClick={onInvite} icon={<UserPlus className="h-3.5 w-3.5" />} label="Invite a guest" />
          )}
        </div>
      )}
    </div>
  )
}

/** A live thumbnail of one source. Muted: audio is the mixer's business. */
function SourceVideo({ stream, contain, mirrored }: { stream: MediaStream; contain: boolean; mirrored?: boolean }) {
  const ref = useRef<HTMLVideoElement | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (el.srcObject !== stream) el.srcObject = stream
    void el.play().catch(() => undefined)
  }, [stream])

  return (
    <video
      ref={ref}
      muted
      autoPlay
      playsInline
      className={`h-full w-full ${contain ? "object-contain" : "object-cover"} ${mirrored ? "-scale-x-100" : ""}`}
    />
  )
}

function CardIcon({
  title,
  active,
  tone = "rose",
  onClick,
  children,
}: {
  title: string
  active?: boolean
  tone?: "rose" | "amber"
  onClick: () => void
  children: React.ReactNode
}) {
  const on = tone === "amber" ? "bg-amber-400 text-amber-950" : "bg-rose-600 text-white"
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={`rounded-lg p-1.5 transition-colors ${active ? on : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
    >
      {children}
    </button>
  )
}

function ThumbIcon({
  title,
  active,
  onClick,
  children,
}: {
  title: string
  active?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={`rounded-md p-1 text-white backdrop-blur transition-colors ${
        active ? "bg-blue-600 hover:bg-blue-700" : "bg-black/70 hover:bg-black/90"
      }`}
    >
      {children}
    </button>
  )
}

function AddCard({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-white px-2 py-2 text-[11px] font-bold text-slate-600 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
    >
      {icon}
      {label}
    </button>
  )
}

function connectionLabel(state: RTCPeerConnectionState | undefined): string {
  switch (state) {
    case "connecting":
    case "new":
      return "Connecting…"
    case "disconnected":
      return "Reconnecting…"
    case "failed":
      return "Connection failed"
    case "closed":
      return "Disconnected"
    default:
      return "Waiting…"
  }
}
