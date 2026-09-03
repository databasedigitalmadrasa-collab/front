"use client"

import { Loader2, Radio, WifiOff, Waves } from "lucide-react"
import type { RoomConnection } from "@/hooks/use-live-room"

/**
 * Honest connection state.
 *
 * The old studio rendered a hardcoded "Stream Health: Good" chip that said
 * "Good" while the stream was down, which is worse than showing nothing. This
 * reports what the room socket is actually doing.
 */
const STATES: Record<RoomConnection, { label: string; className: string; icon: typeof Radio }> = {
  live: {
    label: "Connected",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: Waves,
  },
  connecting: {
    label: "Connecting",
    className: "bg-slate-100 text-slate-600 border-slate-200",
    icon: Loader2,
  },
  polling: {
    label: "Slow mode",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Radio,
  },
  offline: {
    label: "Reconnecting",
    className: "bg-rose-50 text-rose-700 border-rose-200",
    icon: WifiOff,
  },
}

export function ConnectionBadge({
  connection,
  className = "",
}: {
  connection: RoomConnection
  className?: string
}) {
  const state = STATES[connection]
  const Icon = state.icon

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${state.className} ${className}`}
      title={
        connection === "polling"
          ? "Your network is blocking live connections, so messages refresh every few seconds."
          : undefined
      }
    >
      <Icon className={`h-3 w-3 ${connection === "connecting" ? "animate-spin" : ""}`} />
      {state.label}
    </span>
  )
}
