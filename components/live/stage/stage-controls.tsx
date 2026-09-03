"use client"

/**
 * The producer's desk: what is on air, in what arrangement, and who is muted.
 *
 * Two controls, deliberately separate. The layout picker decides the shape;
 * the source rail decides the contents. Bundling them — "2-up with Ahmed and
 * the screen" as one button — is what makes broadcast software unusable the
 * moment a class does something its designer did not anticipate.
 *
 * Every change here goes out over the room socket and is applied by the
 * Durable Object, so a co-host's studio and the host's agree without either
 * polling. The optimistic local update in `useLiveRoom.setStage` is what makes
 * the click feel instant.
 */

import {
  Columns2,
  Grid2x2,
  LayoutGrid,
  Mic,
  MicOff,
  Monitor,
  PictureInPicture2,
  Radio,
  Rows3,
  Sparkles,
  Square,
  Video,
  VideoOff,
  Wifi,
  WifiOff,
} from "lucide-react"
import type { StageLayout, StageSnapshot } from "@/lib/live-room"
import type { CompositorSource } from "@/hooks/use-stage-compositor"

const LAYOUTS: { value: StageLayout; label: string; icon: React.ReactNode; hint: string }[] = [
  { value: "auto", label: "Auto", icon: <Sparkles className="h-3.5 w-3.5" />, hint: "Pick a sensible layout for whatever is on stage" },
  { value: "solo", label: "Solo", icon: <Square className="h-3.5 w-3.5" />, hint: "One source, full frame" },
  { value: "split", label: "Split", icon: <Columns2 className="h-3.5 w-3.5" />, hint: "Two side by side" },
  { value: "grid", label: "Grid", icon: <Grid2x2 className="h-3.5 w-3.5" />, hint: "Everyone, equal size" },
  { value: "sidebar", label: "Sidebar", icon: <Rows3 className="h-3.5 w-3.5" />, hint: "One large, the rest in a column" },
  { value: "spotlight", label: "Spotlight", icon: <LayoutGrid className="h-3.5 w-3.5" />, hint: "One large, the rest along the bottom" },
  { value: "screen", label: "Screen", icon: <Monitor className="h-3.5 w-3.5" />, hint: "The shared screen large, cameras beside it" },
  { value: "pip", label: "PiP", icon: <PictureInPicture2 className="h-3.5 w-3.5" />, hint: "A small inset over a full-frame source" },
]

export interface StageControlsProps {
  stage: StageSnapshot
  sources: CompositorSource[]
  onStageIds: string[]
  peerStates: Record<string, RTCPeerConnectionState>
  canProduce: boolean
  onLayout: (layout: StageLayout) => void
  onToggleOnStage: (sourceId: string) => void
  onSpotlight: (sourceId: string | null) => void
  onToggleMute: (sourceId: string) => void
  className?: string
}

export function StageControls({
  stage,
  sources,
  onStageIds,
  peerStates,
  canProduce,
  onLayout,
  onToggleOnStage,
  onSpotlight,
  onToggleMute,
  className = "",
}: StageControlsProps) {
  return (
    <section className={`space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-5 ${className}`}>
      <div>
        <h3 className="text-sm font-bold tracking-tight text-slate-900">Stage</h3>
        <p className="mt-0.5 text-[11px] text-slate-500">
          {canProduce
            ? "Choose an arrangement, then pick who is in it."
            : "The host is arranging the stage. Your camera appears here once it is on air."}
        </p>
      </div>

      {/* ── layout ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-1.5">
        {LAYOUTS.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={!canProduce}
            onClick={() => onLayout(option.value)}
            title={option.hint}
            aria-pressed={stage.layout === option.value}
            className={`flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-[10px] font-bold transition-colors disabled:opacity-40 ${
              stage.layout === option.value
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {option.icon}
            {option.label}
          </button>
        ))}
      </div>

      {/* ── sources ────────────────────────────────────────────────────── */}
      <div className="space-y-1.5 border-t border-slate-100 pt-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
          Sources ({sources.length})
        </p>

        {!sources.length && (
          <p className="rounded-xl bg-slate-50 px-3 py-4 text-center text-[11px] text-slate-400">
            No cameras yet. Start the studio, or share a co-host link.
          </p>
        )}

        {sources.map((source) => {
          const onAir = onStageIds.includes(source.id)
          const spotlit = stage.spotlight === source.id
          const muted = stage.muted.includes(source.id)
          const connection = source.peerCid ? peerStates[source.peerCid] : undefined

          return (
            <div
              key={source.id}
              className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-colors ${
                onAir ? "border-emerald-200 bg-emerald-50/70" : "border-slate-200 bg-white"
              }`}
            >
              <span
                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${
                  source.kind === "screen"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {source.kind === "screen" ? (
                  <Monitor className="h-3.5 w-3.5" />
                ) : source.live ? (
                  <Video className="h-3.5 w-3.5" />
                ) : (
                  <VideoOff className="h-3.5 w-3.5" />
                )}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-bold text-slate-800">{source.label}</p>
                <p className="flex items-center gap-1 text-[10px] text-slate-500">
                  {source.peerCid ? (
                    <>
                      {connection === "connected" ? (
                        <Wifi className="h-2.5 w-2.5 text-emerald-500" />
                      ) : (
                        <WifiOff className="h-2.5 w-2.5 text-amber-500" />
                      )}
                      {connectionLabel(connection)}
                    </>
                  ) : (
                    "This device"
                  )}
                </p>
              </div>

              {canProduce && (
                <div className="flex flex-shrink-0 items-center gap-1">
                  <IconToggle
                    active={muted}
                    activeTone="rose"
                    onClick={() => onToggleMute(source.id)}
                    title={muted ? "Unmute" : "Mute"}
                    icon={muted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                  />
                  <IconToggle
                    active={spotlit}
                    activeTone="amber"
                    onClick={() => onSpotlight(spotlit ? null : source.id)}
                    title={spotlit ? "Remove spotlight" : "Spotlight"}
                    icon={<Sparkles className="h-3.5 w-3.5" />}
                  />
                  <button
                    type="button"
                    onClick={() => onToggleOnStage(source.id)}
                    className={`rounded-lg px-2 py-1.5 text-[10px] font-bold transition-colors ${
                      onAir
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {onAir ? "On air" : "Off"}
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {canProduce && !!sources.length && (
          <p className="pt-1 text-[10px] leading-relaxed text-slate-400">
            <Radio className="mr-1 inline h-2.5 w-2.5" />
            With nothing explicitly on air, everything on this list goes out.
          </p>
        )}
      </div>
    </section>
  )
}

function IconToggle({
  active,
  activeTone,
  onClick,
  title,
  icon,
}: {
  active: boolean
  activeTone: "rose" | "amber"
  onClick: () => void
  title: string
  icon: React.ReactNode
}) {
  const tone = activeTone === "rose" ? "bg-rose-600 text-white" : "bg-amber-500 text-white"
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={`rounded-lg p-1.5 transition-colors ${
        active ? tone : "bg-slate-100 text-slate-500 hover:bg-slate-200"
      }`}
    >
      {icon}
    </button>
  )
}

function connectionLabel(state: RTCPeerConnectionState | undefined): string {
  switch (state) {
    case "connected":
      return "Connected"
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
