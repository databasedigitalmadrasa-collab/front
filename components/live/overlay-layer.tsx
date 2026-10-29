"use client"

/**
 * The student-side overlay layer.
 *
 * Only rendered when a class is set to `overlay_render: "viewer"` (or "both"),
 * which means: nothing in our code is touching the video, because the class is
 * being fed by OBS or another external encoder over RTMPS.
 *
 * WHY THIS IS THE FALLBACK AND NOT THE DEFAULT
 * -------------------------------------------
 * An HLS player runs several seconds behind the encoder. A DOM overlay is
 * drawn at wall-clock time, so a lower third switched on the moment a guest
 * starts speaking appears over whatever the student is watching *now* — which
 * is the host still introducing them. Worse, it is in nobody's recording: the
 * recording is made from the ingest, and the ingest never saw it.
 *
 * When the studio is compositing, overlays are burned into the frame instead,
 * where they are on the right moment of the lesson and survive into the
 * recording. That is `overlay_render: "burn"`, and it is the default.
 */

import { useEffect, useState } from "react"
import {
  anchorCss,
  countdownSeconds,
  overlayStyle,
  overlayText,
} from "@/lib/live-stage"
import { formatClock } from "@/lib/live-compositor"
import type { RoomOverlay } from "@/lib/live-room"

export interface OverlayLayerProps {
  overlays: RoomOverlay[]
  className?: string
}

export function OverlayLayer({ overlays, className = "" }: OverlayLayerProps) {
  if (!overlays.length) return null

  return (
    // `pointer-events-none` throughout: an overlay must never swallow a click
    // meant for the player's own controls.
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {overlays.map((overlay) => (
        <OverlayItem key={overlay.id} overlay={overlay} />
      ))}
    </div>
  )
}

function OverlayItem({ overlay }: { overlay: RoomOverlay }) {
  const style = overlayStyle(overlay)
  const position = anchorCss(style)

  switch (overlay.kind) {
    case "ticker":
      return <Ticker overlay={overlay} />

    case "lower_third": {
      const title = overlayText(overlay, "title")
      const subtitle = overlayText(overlay, "subtitle")
      if (!title && !subtitle) return null
      return (
        <div
          style={{ ...position, opacity: style.opacity }}
          className="flex overflow-hidden rounded-lg shadow-lg"
        >
          <span style={{ background: style.accent }} className="w-1.5 flex-shrink-0" />
          <span style={{ background: style.bg }} className="px-3 py-2 sm:px-4 sm:py-2.5">
            <span style={{ color: style.fg }} className="block text-xs font-bold sm:text-sm">
              {title}
            </span>
            {subtitle && (
              <span className="mt-0.5 block text-[10px] text-white/70 sm:text-xs">{subtitle}</span>
            )}
          </span>
        </div>
      )
    }

    case "banner": {
      const text = overlayText(overlay)
      if (!text) return null
      return (
        <div
          style={{ ...position, background: style.bg, color: style.fg, opacity: style.opacity }}
          className="rounded-full px-4 py-1.5 text-[11px] font-bold shadow-lg sm:text-xs"
        >
          {text}
        </div>
      )
    }

    case "logo": {
      const url = overlayText(overlay, "url")
      const text = overlayText(overlay)
      if (!url && !text) return null
      return (
        <div
          style={{ ...position, opacity: style.opacity }}
          className="flex items-center gap-2 rounded-lg bg-slate-950/55 px-2.5 py-1.5 backdrop-blur-md"
        >
          {url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="h-4 w-auto sm:h-5" />
          )}
          {text && (
            <span style={{ color: style.fg }} className="text-[10px] font-semibold sm:text-[11px]">
              {text}
            </span>
          )}
        </div>
      )
    }

    case "text": {
      const text = overlayText(overlay)
      if (!text) return null
      return (
        <div
          style={{ ...position, color: style.fg, opacity: style.opacity }}
          className="text-sm font-bold drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] sm:text-base"
        >
          {text}
        </div>
      )
    }

    case "countdown":
      return <Countdown overlay={overlay} />

    case "image": {
      const url = overlayText(overlay, "url")
      if (!url) return null
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          style={{ ...position, width: `${style.scale * 100}%`, opacity: style.opacity }}
        />
      )
    }

    default:
      return null
  }
}

/**
 * The scrolling bar.
 *
 * CSS animation rather than a JS loop: a ticker that ran on a timer would keep
 * a student's phone awake re-rendering React thirty times a second for the
 * length of a lesson, and the compositor already owns the version that ends up
 * in the broadcast.
 */
function Ticker({ overlay }: { overlay: RoomOverlay }) {
  const style = overlayStyle(overlay)
  const text = overlayText(overlay)
  const label = typeof overlay.payload.label === "string" ? overlay.payload.label : "LIVE"
  if (!text) return null

  // style.speed is canvas-widths per second; the DOM version is expressed as
  // the time for one full pass, which is its reciprocal.
  const duration = Math.max(6, Math.round(1 / style.speed))

  return (
    <div
      style={{ background: style.bg, opacity: style.opacity }}
      className="absolute inset-x-0 bottom-0 flex items-stretch overflow-hidden"
    >
      <span
        style={{ background: style.accent }}
        className="flex flex-shrink-0 items-center px-3 text-[10px] font-extrabold tracking-wide text-white sm:text-[11px]"
      >
        {label}
      </span>
      <div className="relative flex-1 overflow-hidden py-1.5">
        <div
          className="dm-ticker-track whitespace-nowrap"
          style={{ color: style.fg, animationDuration: `${duration}s` }}
        >
          <span className="px-8 text-[11px] font-medium sm:text-xs">{text}</span>
          <span className="px-8 text-[11px] font-medium sm:text-xs">{text}</span>
        </div>
      </div>

      <style jsx>{`
        .dm-ticker-track {
          display: inline-flex;
          animation-name: dm-ticker;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        @keyframes dm-ticker {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .dm-ticker-track {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}

function Countdown({ overlay }: { overlay: RoomOverlay }) {
  const style = overlayStyle(overlay)
  const [seconds, setSeconds] = useState<number | null>(() => countdownSeconds(overlay))

  useEffect(() => {
    const tick = () => setSeconds(countdownSeconds(overlay))
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [overlay])

  if (seconds === null) return null
  const label = overlayText(overlay, "label")

  return (
    <div
      style={{ ...anchorCss(style), background: style.bg, opacity: style.opacity }}
      className="rounded-xl px-3 py-2 text-center shadow-lg"
    >
      {label && <p className="text-[9px] font-semibold uppercase tracking-wide text-white/70">{label}</p>}
      <p
        style={{ color: seconds === 0 ? style.accent : style.fg }}
        className="font-mono text-sm font-bold tabular-nums sm:text-base"
      >
        {formatClock(seconds)}
      </p>
    </div>
  )
}
