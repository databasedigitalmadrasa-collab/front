"use client"

/**
 * The viewer's video stage.
 *
 * Renders the Cloudflare Stream player when the class is on air, and something
 * honest and useful when it is not: a live countdown before it starts, a clear
 * close-out after it ends. The previous page rendered nothing at all unless
 * `status === "live"`, so a student arriving five minutes early saw an empty
 * screen with no indication anything was going to happen.
 */

import { useEffect, useMemo, useState } from "react"
import { CalendarClock, CheckCircle2, Radio, Users } from "lucide-react"
import { formatDuration, secondsSince, type RoomLiveClass, type RoomOverlay } from "@/lib/live-room"
import { OverlayLayer } from "./overlay-layer"

export interface StreamStageProps {
  liveClass: RoomLiveClass
  participantCount: number
  /** The ones on air. Drawn here only when the class is not compositing. */
  overlays?: RoomOverlay[]
  className?: string
}

export function StreamStage({
  liveClass,
  participantCount,
  overlays = [],
  className = "",
}: StreamStageProps) {
  const tick = useTicker(liveClass.status === "live")
  const startsIn = useCountdown(liveClass.scheduled_at, liveClass.status === "scheduled")

  // `tick` is the dependency that makes this recompute every second; the value
  // itself is never read.
  const sessionSeconds = useMemo(
    () => (liveClass.started_at ? secondsSince(liveClass.started_at) : 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [liveClass.started_at, tick],
  )

  return (
    <div
      className={`relative aspect-video w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 ${className}`}
    >
      {liveClass.status === "live" && liveClass.cf_playback_url ? (
        <iframe
          key={liveClass.cf_playback_url}
          src={`${liveClass.cf_playback_url}?autoplay=true&preload=true`}
          title={liveClass.title}
          className="h-full w-full border-0"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center px-6 text-center">
          {liveClass.status === "ended" ? (
            <>
              <CheckCircle2 className="mb-3 h-10 w-10 text-emerald-400" />
              <h3 className="text-base font-bold text-white">This class has ended</h3>
              <p className="mt-1 max-w-sm text-xs text-slate-400">
                Thank you for attending. A recording will appear in your class materials once it has been processed.
              </p>
            </>
          ) : liveClass.status === "cancelled" ? (
            <>
              <CalendarClock className="mb-3 h-10 w-10 text-amber-400" />
              <h3 className="text-base font-bold text-white">This class was cancelled</h3>
              <p className="mt-1 text-xs text-slate-400">Please check your schedule for a new date.</p>
            </>
          ) : (
            <>
              <Radio className="mb-3 h-10 w-10 animate-pulse text-blue-400" />
              {/*
                A class can be marked live before a playback URL exists — the
                host has pressed Go live but Cloudflare has not finished
                provisioning, or the class was created before the Stream
                customer code was configured. Telling those students the class
                "has not started" is wrong and makes them close the tab.
              */}
              <h3 className="text-base font-bold text-white">
                {liveClass.status === "live" ? "The stream is starting" : "The class has not started yet"}
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                {liveClass.status === "live"
                  ? "Your teacher is live. The video will appear in a few seconds."
                  : "Keep this page open — the stream begins automatically."}
              </p>
              {startsIn !== null && startsIn > 0 && (
                <p className="mt-4 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2 font-mono text-lg font-bold tracking-tight text-white">
                  {formatDuration(startsIn)}
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Overlays sit above the iframe and must never swallow its controls. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-2 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          {liveClass.status === "live" ? (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-2.5 py-1 text-[11px] font-extrabold text-white shadow-md">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              LIVE
            </span>
          ) : (
            <span className="rounded-md bg-slate-800/90 px-2.5 py-1 text-[11px] font-bold uppercase text-slate-300 backdrop-blur-md">
              {liveClass.status}
            </span>
          )}

          <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-700/60 bg-slate-900/80 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
            <Users className="h-3 w-3 text-blue-400" />
            {participantCount}
          </span>

          {liveClass.status === "live" && liveClass.started_at && (
            <span className="hidden items-center gap-1.5 rounded-md border border-slate-700/60 bg-slate-900/80 px-2.5 py-1 font-mono text-[11px] font-bold text-emerald-400 backdrop-blur-md sm:inline-flex">
              {formatDuration(sessionSeconds)}
            </span>
          )}
        </div>
      </div>

      {/*
        Overlays are drawn here only for a class whose pixels nobody on our
        side touches — one fed by OBS over RTMPS. When the host studio is
        compositing, the ticker and the logos are already burned into the
        frame, on the right moment of the lesson and in the recording; drawing
        them again here would double them and put the copy several seconds out
        of step with the video underneath it.
      */}
      {liveClass.overlay_render !== "burn" && liveClass.status === "live" && (
        <OverlayLayer overlays={overlays} />
      )}
    </div>
  )
}

/* ── clocks ─────────────────────────────────────────────────────────────── */

/** A once-a-second re-render, only while it is wanted. */
function useTicker(active: boolean): number {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!active) return
    const interval = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [active])
  return tick
}

/** Seconds until a scheduled time, or null once it has passed. */
function useCountdown(scheduledAt: string, active: boolean): number | null {
  const [seconds, setSeconds] = useState<number | null>(null)

  useEffect(() => {
    if (!active) {
      setSeconds(null)
      return
    }

    const compute = () => {
      const target = new Date(scheduledAt).getTime()
      if (Number.isNaN(target)) return setSeconds(null)
      setSeconds(Math.max(0, Math.floor((target - Date.now()) / 1000)))
    }

    compute()
    const interval = setInterval(compute, 1000)
    return () => clearInterval(interval)
  }, [scheduledAt, active])

  return seconds
}
