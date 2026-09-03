"use client"

/**
 * The programme monitor.
 *
 * This canvas is not a preview of the broadcast — it *is* the broadcast. The
 * same element `useStageCompositor` paints into is the one
 * `canvas.captureStream()` reads from, so what the host sees here is what
 * Cloudflare receives, frame for frame. There is no second render path that
 * could drift from it.
 *
 * Over the top sit invisible hit targets, one per tile, in exactly the
 * geometry the compositor used. Clicking a face spotlights it. That gesture
 * only works because the layout is computed once, in `computeStageLayout`, and
 * shared — a separately-positioned overlay would put the click targets a few
 * pixels off and the host would spotlight the wrong person.
 */

import { Loader2, Maximize2, Radio, Users } from "lucide-react"
import type { StageTile } from "@/lib/live-stage"

export interface ProgramCanvasProps {
  canvasRef: (el: HTMLCanvasElement | null) => void
  tiles: StageTile[]
  width: number
  height: number
  running: boolean
  starting?: boolean
  live: boolean
  elapsedLabel?: string
  watching: number
  spotlight: string | null
  actualFps: number
  targetFps: number
  onSpotlight: (sourceId: string | null) => void
  onStart: () => void
}

export function ProgramCanvas({
  canvasRef,
  tiles,
  width,
  height,
  running,
  starting = false,
  live,
  elapsedLabel,
  watching,
  spotlight,
  actualFps,
  targetFps,
  onSpotlight,
  onStart,
}: ProgramCanvasProps) {
  // The encoder is falling behind when it cannot hold four fifths of the
  // target. Worth saying out loud: the usual cause is compositing at 1080p on
  // a laptop that cannot, and the fix is one setting away.
  const dropping = running && actualFps > 0 && actualFps < targetFps * 0.8

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-lg">
      <div className="relative aspect-video w-full bg-slate-950">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="h-full w-full"
          aria-label="Programme output"
        />

        {!running && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/92 px-6 text-center">
            <Radio className="mb-3 h-9 w-9 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-100">The studio is not running</h3>
            <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-slate-400">
              Starting the studio opens your camera and begins mixing. Nothing is broadcast until
              you go live.
            </p>
            <button
              type="button"
              onClick={onStart}
              disabled={starting}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-900 transition-colors hover:bg-slate-100 disabled:opacity-50"
            >
              {starting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {starting ? "Starting…" : "Start studio"}
            </button>
          </div>
        )}

        {/* Click targets, in the compositor's own coordinates. */}
        {running && (
          <div className="absolute inset-0">
            {tiles.map((tile) => {
              const spotlit = spotlight === tile.id
              return (
                <button
                  key={tile.id}
                  type="button"
                  onClick={() => onSpotlight(spotlit ? null : tile.id)}
                  title={spotlit ? `Remove spotlight from ${tile.label}` : `Spotlight ${tile.label}`}
                  style={{
                    left: `${(tile.x / width) * 100}%`,
                    top: `${(tile.y / height) * 100}%`,
                    width: `${(tile.w / width) * 100}%`,
                    height: `${(tile.h / height) * 100}%`,
                  }}
                  className={`group absolute flex items-start justify-end p-1.5 transition-colors ${
                    spotlit ? "ring-2 ring-inset ring-amber-400" : "hover:bg-white/5"
                  }`}
                >
                  <span
                    className={`rounded-md bg-slate-950/80 p-1 text-white transition-opacity ${
                      spotlit ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    <Maximize2 className="h-3 w-3" />
                  </span>
                </button>
              )
            })}
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-2 p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2">
            {live ? (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-2.5 py-1 text-[11px] font-extrabold text-white shadow-md">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                ON AIR
              </span>
            ) : (
              <span className="rounded-md bg-slate-800/90 px-2.5 py-1 text-[11px] font-bold uppercase text-slate-300 backdrop-blur-md">
                {running ? "Preview" : "Idle"}
              </span>
            )}

            <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-700/60 bg-slate-900/80 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
              <Users className="h-3 w-3 text-blue-400" />
              {watching}
            </span>

            {live && elapsedLabel && (
              <span className="rounded-md border border-slate-700/60 bg-slate-900/80 px-2.5 py-1 font-mono text-[11px] font-bold text-emerald-400 backdrop-blur-md">
                {elapsedLabel}
              </span>
            )}
          </div>

          {running && (
            <span
              className={`rounded-md px-2.5 py-1 text-[11px] font-bold backdrop-blur-md ${
                dropping ? "bg-amber-500/20 text-amber-300" : "bg-slate-900/80 text-slate-300"
              }`}
              title={
                dropping
                  ? "The mixer is not keeping up. Try 720p, or take a source off the stage."
                  : undefined
              }
            >
              {actualFps} / {targetFps} fps
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
