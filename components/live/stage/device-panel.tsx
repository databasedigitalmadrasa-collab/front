"use client"

/**
 * Cameras, microphone and screen share for whoever is sitting at this machine.
 *
 * The multicam part is the interesting one. A camera here is *added*, not
 * chosen: opening a second one leaves the first running, which is what makes a
 * face camera plus a document camera over a mushaf possible. Swapping which
 * device an existing tile points at is a separate action, and keeps the
 * source's id — because the producer's layout refers to that id, and a swap
 * that minted a new one would silently drop the tile off the broadcast.
 */

import { useState } from "react"
import {
  Camera,
  Loader2,
  Mic,
  MicOff,
  Monitor,
  MonitorUp,
  Plus,
  Trash2,
  Video,
  VideoOff,
} from "lucide-react"
import type { MediaSources } from "@/hooks/use-media-sources"

export interface DevicePanelProps {
  media: MediaSources
  className?: string
}

export function DevicePanel({ media, className = "" }: DevicePanelProps) {
  const [busy, setBusy] = useState(false)

  const withBusy = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    try {
      await fn()
    } finally {
      setBusy(false)
    }
  }

  const cameraSources = media.sources.filter((s) => s.kind === "camera")
  const screenSources = media.sources.filter((s) => s.kind === "screen")

  return (
    <div className={`space-y-5 ${className}`}>
      {/* ── microphone ─────────────────────────────────────────────────── */}
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-bold text-slate-900">Microphone</h4>
          <button
            type="button"
            onClick={media.toggleMic}
            disabled={!media.micTrack}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors disabled:opacity-40 ${
              media.micMuted
                ? "bg-rose-600 text-white hover:bg-rose-700"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {media.micMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
            {media.micMuted ? "Muted" : "Live"}
          </button>
        </div>

        <select
          value={media.micDeviceId}
          onChange={(e) => void withBusy(() => media.selectMic(e.target.value))}
          disabled={busy || !media.microphones.length}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none disabled:opacity-50"
        >
          {!media.microphones.length && <option value="">No microphone found</option>}
          {media.microphones.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label}
            </option>
          ))}
        </select>

        {/* A level meter, not a "mic is on" light: the failure everybody hits
            is a mic that is selected, unmuted and picking up nothing. */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-[width] duration-75 ${
              media.micMuted ? "bg-slate-300" : media.audioLevel > 70 ? "bg-amber-500" : "bg-emerald-500"
            }`}
            style={{ width: `${media.micMuted ? 0 : media.audioLevel}%` }}
          />
        </div>
      </section>

      {/* ── cameras ────────────────────────────────────────────────────── */}
      <section className="space-y-2 border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-bold text-slate-900">
            Cameras {cameraSources.length > 1 && <span className="text-slate-400">({cameraSources.length})</span>}
          </h4>
          <button
            type="button"
            onClick={() => void withBusy(() => media.addCamera())}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-slate-800 disabled:opacity-40"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Add camera
          </button>
        </div>

        {!cameraSources.length && (
          <p className="rounded-xl bg-slate-50 px-3 py-3 text-[11px] text-slate-500">
            No camera is running. Start the studio to open one.
          </p>
        )}

        {cameraSources.map((source) => (
          <div key={source.id} className="rounded-xl border border-slate-200 p-2.5">
            <div className="mb-2 flex items-center gap-2">
              <Camera className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
              <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-slate-800">
                {source.label}
              </span>
              <button
                type="button"
                onClick={() => media.toggleSource(source.id)}
                title={source.enabled ? "Turn this camera off" : "Turn this camera on"}
                className={`rounded-lg p-1.5 transition-colors ${
                  source.enabled
                    ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    : "bg-rose-600 text-white hover:bg-rose-700"
                }`}
              >
                {source.enabled ? <Video className="h-3.5 w-3.5" /> : <VideoOff className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => media.removeSource(source.id)}
                title="Remove this camera"
                className="rounded-lg bg-slate-100 p-1.5 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            <select
              value={source.deviceId ?? ""}
              onChange={(e) => void withBusy(() => media.replaceDevice(source.id, e.target.value))}
              disabled={busy}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none disabled:opacity-50"
            >
              {!media.cameras.length && <option value="">No camera found</option>}
              {media.cameras.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </section>

      {/* ── screen ─────────────────────────────────────────────────────── */}
      <section className="space-y-2 border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-bold text-slate-900">Screen share</h4>
          <button
            type="button"
            onClick={() => void media.startScreenShare()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-2.5 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-blue-700"
          >
            <MonitorUp className="h-3.5 w-3.5" />
            Share a screen
          </button>
        </div>

        {!screenSources.length ? (
          <p className="rounded-xl bg-slate-50 px-3 py-3 text-[11px] text-slate-500">
            A shared screen becomes another source you can put on air, letterboxed so nothing is
            cropped off the slide.
          </p>
        ) : (
          screenSources.map((source) => (
            <div
              key={source.id}
              className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/70 px-2.5 py-2"
            >
              <Monitor className="h-3.5 w-3.5 flex-shrink-0 text-blue-600" />
              <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-blue-900">
                {source.label}
              </span>
              <button
                type="button"
                onClick={() => media.removeSource(source.id)}
                className="rounded-lg bg-white/80 px-2 py-1 text-[10px] font-bold text-blue-700 transition-colors hover:bg-white"
              >
                Stop
              </button>
            </div>
          ))
        )}
      </section>

      {media.error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[11px] leading-relaxed text-rose-800">
          {media.error}
        </p>
      )}
    </div>
  )
}
