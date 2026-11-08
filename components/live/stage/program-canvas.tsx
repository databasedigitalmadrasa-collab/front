"use client"

/**
 * The programme monitor.
 *
 * This canvas is not a preview of the broadcast — it *is* the broadcast. The
 * same element `useStageCompositor` paints into is the one
 * `canvas.captureStream()` reads from, so what the host sees here is what
 * Cloudflare receives, frame for frame.
 *
 * The one exception is "Mirror my view": then the compositor also paints a
 * second canvas, identical except that the host's own camera is flipped, and
 * that is laid over this one. The broadcast canvas underneath keeps running
 * and is still what goes out; a tag in the corner says the view is mirrored.
 *
 * Over each tile sits a hover toolbar — feature, mute, take off stage — in
 * exactly the geometry the compositor used, because the layout is computed
 * once in `computeStageLayout` and shared. Clicking a tile used to switch the
 * whole stage to the Spotlight layout, which turned "who is this?" into a
 * layout change on air.
 */

import { ArrowDownToLine, Loader2, Mic, MicOff, Radio, Star } from "lucide-react"
import type { StageTile } from "@/lib/live-stage"

export interface ProgramCanvasProps {
  canvasRef: (el: HTMLCanvasElement | null) => void
  /** The host-only view; shown over the broadcast while `previewActive`. */
  previewCanvasRef?: (el: HTMLCanvasElement | null) => void
  previewActive?: boolean
  tiles: StageTile[]
  width: number
  height: number
  running: boolean
  starting?: boolean
  live: boolean
  featured: string | null
  muted: string[]
  actualFps: number
  targetFps: number
  canProduce: boolean
  onFeature: (sourceId: string | null) => void
  onToggleMute: (sourceId: string) => void
  onRemove: (sourceId: string) => void
  onStart: () => void
  className?: string
}

export function ProgramCanvas({
  canvasRef,
  previewCanvasRef,
  previewActive = false,
  tiles,
  width,
  height,
  running,
  starting = false,
  live,
  featured,
  muted,
  actualFps,
  targetFps,
  canProduce,
  onFeature,
  onToggleMute,
  onRemove,
  onStart,
  className = "",
}: ProgramCanvasProps) {
  // The encoder is falling behind when it cannot hold four fifths of the
  // target. Worth saying out loud: the usual cause is compositing at 1080p on
  // a laptop that cannot, and the fix is one setting away.
  const dropping = running && actualFps > 0 && actualFps < targetFps * 0.8

  return (
    <div
      className={`relative aspect-video w-full overflow-hidden rounded-xl bg-slate-950 shadow-lg ring-1 ${
        live ? "ring-2 ring-rose-500" : "ring-slate-800"
      } ${className}`}
    >
      <canvas ref={canvasRef} width={width} height={height} className="h-full w-full" aria-label="Programme output" />
      {previewCanvasRef && (
        <canvas
          ref={previewCanvasRef}
          width={width}
          height={height}
          className={`absolute inset-0 h-full w-full ${previewActive ? "" : "hidden"}`}
          aria-label="Your view of the programme, with your camera mirrored"
        />
      )}

      {!running && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 px-6 text-center">
          <Radio className="mb-3 h-9 w-9 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-100">Your studio is ready</h3>
          <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-slate-400">
            Turn on your camera and microphone to set up the stage. Nothing is broadcast until you go live.
          </p>
          <button
            type="button"
            onClick={onStart}
            disabled={starting}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-900 transition-colors hover:bg-slate-100 disabled:opacity-50"
          >
            {starting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {starting ? "Starting…" : "Enter studio"}
          </button>
        </div>
      )}

      {running && canProduce && (
        <div className="absolute inset-0">
          {tiles.map((tile) => {
            const isFeatured = featured === tile.id
            const isMuted = muted.includes(tile.id)
            return (
              <div
                key={tile.id}
                style={{
                  left: `${(tile.x / width) * 100}%`,
                  top: `${(tile.y / height) * 100}%`,
                  width: `${(tile.w / width) * 100}%`,
                  height: `${(tile.h / height) * 100}%`,
                }}
                className="group absolute rounded-md ring-inset transition-shadow hover:ring-2 hover:ring-blue-400/80"
              >
                <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                  <TileButton
                    title={isFeatured ? `Stop featuring ${tile.label}` : `Feature ${tile.label}`}
                    active={isFeatured}
                    onClick={() => onFeature(isFeatured ? null : tile.id)}
                  >
                    <Star className={`h-3.5 w-3.5 ${isFeatured ? "fill-current" : ""}`} />
                  </TileButton>
                  <TileButton
                    title={isMuted ? `Unmute ${tile.label}` : `Mute ${tile.label}`}
                    active={isMuted}
                    tone="rose"
                    onClick={() => onToggleMute(tile.id)}
                  >
                    {isMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                  </TileButton>
                  <TileButton title={`Remove ${tile.label} from the stage`} onClick={() => onRemove(tile.id)}>
                    <ArrowDownToLine className="h-3.5 w-3.5" />
                  </TileButton>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="pointer-events-none absolute left-2.5 top-2.5 flex items-center gap-1.5">
        {live ? (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-white shadow">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            ON AIR
          </span>
        ) : running ? (
          <span className="rounded-md bg-slate-900/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-300 backdrop-blur">
            Preview
          </span>
        ) : null}
        {running && previewActive && (
          <span
            className="rounded-md bg-slate-900/80 px-2 py-0.5 text-[10px] font-bold text-slate-200 backdrop-blur"
            title="Mirror my view is on: you see your camera mirrored. Students and the recording see it the other way round."
          >
            Your view: mirrored
          </span>
        )}
      </div>

      {dropping && (
        <span
          className="pointer-events-none absolute bottom-2.5 right-2.5 rounded-md bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold text-amber-950"
          title="The mixer is not keeping up. Try 720p in Settings, or take a source off the stage."
        >
          {actualFps}/{targetFps} fps — mixer is struggling
        </span>
      )}
    </div>
  )
}

function TileButton({
  title,
  active,
  tone = "amber",
  onClick,
  children,
}: {
  title: string
  active?: boolean
  tone?: "amber" | "rose"
  onClick: () => void
  children: React.ReactNode
}) {
  const on = tone === "rose" ? "bg-rose-600 text-white" : "bg-amber-400 text-amber-950"
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={`pointer-events-auto rounded-md p-1.5 shadow backdrop-blur transition-colors ${
        active ? on : "bg-slate-950/80 text-white hover:bg-slate-800"
      }`}
    >
      {children}
    </button>
  )
}
