"use client"

/**
 * The overlay drawer: tickers, logos, lower thirds and banners, and the switch
 * that puts each one on air.
 *
 * The on-air toggle is the control that gets pressed during a class, so it is
 * one click from the list — never behind an edit screen. Everything else
 * (wording, colours, placement) is editing, and lives in the panel that opens
 * when a row is selected.
 *
 * WHAT THE HOST IS ACTUALLY DOING
 * -------------------------------
 * Switching an overlay on writes `visible = 1` and the room broadcasts it. The
 * host studio's compositor picks it up on its next frame and burns it into the
 * outgoing video; a class fed by OBS instead draws it as DOM on the student's
 * page. Same row, same coordinates, two renderers — which is why every
 * position here is a fraction of the frame rather than a pixel count.
 */

import { useMemo, useState } from "react"
import {
  AlignEndHorizontal,
  Clock,
  Image as ImageIcon,
  Loader2,
  Plus,
  ScrollText,
  Sparkles,
  Trash2,
  Type,
} from "lucide-react"
import {
  OVERLAY_ANCHORS,
  OVERLAY_KIND_LABELS,
  newOverlay,
  overlayStyle,
  type OverlayAnchor,
} from "@/lib/live-stage"
import type { OverlayKind, RoomOverlay } from "@/lib/live-room"
import { ImageFileUpload } from "@/components/live/image-file-upload"

const KIND_ICON: Record<OverlayKind, React.ReactNode> = {
  ticker: <ScrollText className="h-3.5 w-3.5" />,
  logo: <ImageIcon className="h-3.5 w-3.5" />,
  lower_third: <AlignEndHorizontal className="h-3.5 w-3.5" />,
  banner: <Sparkles className="h-3.5 w-3.5" />,
  text: <Type className="h-3.5 w-3.5" />,
  countdown: <Clock className="h-3.5 w-3.5" />,
  image: <ImageIcon className="h-3.5 w-3.5" />,
}

/** The kinds offered on the "add" row, in the order a host reaches for them. */
const ADDABLE: OverlayKind[] = ["ticker", "lower_third", "banner", "logo", "countdown", "text", "image"]

export interface OverlayManagerProps {
  overlays: RoomOverlay[]
  canManage: boolean
  onAdd: (overlay: ReturnType<typeof newOverlay>) => Promise<string | null>
  onUpdate: (
    id: number,
    patch: { name?: string; payload?: Record<string, unknown>; style?: Record<string, unknown>; visible?: boolean },
  ) => Promise<string | null>
  onRemove: (id: number) => Promise<string | null>
  className?: string
}

export function OverlayManager({
  overlays,
  canManage,
  onAdd,
  onUpdate,
  onRemove,
  className = "",
}: OverlayManagerProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selected = useMemo(
    () => overlays.find((o) => o.id === selectedId) ?? null,
    [overlays, selectedId],
  )

  const run = async (fn: () => Promise<string | null>) => {
    setBusy(true)
    const message = await fn()
    setBusy(false)
    setError(message)
  }

  const add = (kind: OverlayKind) =>
    run(async () => {
      const draft = newOverlay(kind)
      const message = await onAdd(draft)
      return message
    })

  if (!canManage) {
    return (
      <p className={`rounded-xl bg-slate-50 px-3 py-4 text-center text-[11px] text-slate-400 ${className}`}>
        Only the host can change what is on screen.
      </p>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-800">
          {error}
        </p>
      )}

      {/* ── add ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1.5">
        {ADDABLE.map((kind) => (
          <button
            key={kind}
            type="button"
            disabled={busy}
            onClick={() => void add(kind)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40"
          >
            <Plus className="h-3 w-3" />
            {OVERLAY_KIND_LABELS[kind]}
          </button>
        ))}
      </div>

      {/* ── list ───────────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        {!overlays.length && (
          <p className="rounded-xl bg-slate-50 px-3 py-5 text-center text-[11px] text-slate-400">
            No overlays yet. A ticker along the bottom is the usual first one.
          </p>
        )}

        {overlays.map((overlay) => (
          <div
            key={overlay.id}
            className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-colors ${
              overlay.visible ? "border-emerald-200 bg-emerald-50/70" : "border-slate-200 bg-white"
            }`}
          >
            <button
              type="button"
              onClick={() => setSelectedId(selectedId === overlay.id ? null : overlay.id)}
              className="flex min-w-0 flex-1 items-center gap-2 text-left"
            >
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                {KIND_ICON[overlay.kind]}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[11px] font-bold text-slate-800">
                  {overlay.name}
                </span>
                <span className="block truncate text-[10px] text-slate-500">
                  {summarise(overlay)}
                </span>
              </span>
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => void run(() => onUpdate(overlay.id, { visible: !overlay.visible }))}
              className={`flex-shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-colors disabled:opacity-40 ${
                overlay.visible
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {overlay.visible ? "On air" : "Off"}
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => void run(() => onRemove(overlay.id))}
              title="Delete this overlay"
              className="flex-shrink-0 rounded-lg bg-slate-100 p-1.5 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {selected && (
        <OverlayEditor
          key={selected.id}
          overlay={selected}
          busy={busy}
          onSave={(patch) => run(() => onUpdate(selected.id, patch))}
        />
      )}
    </div>
  )
}

/* ── editor ─────────────────────────────────────────────────────────────── */

function OverlayEditor({
  overlay,
  busy,
  onSave,
}: {
  overlay: RoomOverlay
  busy: boolean
  onSave: (patch: {
    name?: string
    payload?: Record<string, unknown>
    style?: Record<string, unknown>
  }) => void
}) {
  const style = overlayStyle(overlay)
  const [name, setName] = useState(overlay.name)
  const [payload, setPayload] = useState<Record<string, unknown>>({ ...overlay.payload })
  const [draft, setDraft] = useState({ ...style })

  const field = (key: string) => (typeof payload[key] === "string" ? (payload[key] as string) : "")
  const setField = (key: string, value: string) => setPayload((prev) => ({ ...prev, [key]: value }))

  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
      <Text label="Name (only you see this)" value={name} onChange={setName} />

      {/* ── content, per kind ──────────────────────────────────────────── */}
      {overlay.kind === "ticker" && (
        <>
          <Text label="Ticker text" value={field("text")} onChange={(v) => setField("text", v)} multiline />
          <Text label="Badge" value={field("label")} onChange={(v) => setField("label", v)} placeholder="LIVE" />
        </>
      )}

      {overlay.kind === "lower_third" && (
        <>
          <Text label="Name" value={field("title")} onChange={(v) => setField("title", v)} placeholder="Ustadh Ahmed" />
          <Text
            label="Title"
            value={field("subtitle")}
            onChange={(v) => setField("subtitle", v)}
            placeholder="Tajweed instructor"
          />
        </>
      )}

      {(overlay.kind === "banner" || overlay.kind === "text") && (
        <Text label="Text" value={field("text")} onChange={(v) => setField("text", v)} multiline />
      )}

      {overlay.kind === "logo" && (
        <>
          <Text label="Wordmark" value={field("text")} onChange={(v) => setField("text", v)} />
          <ImageFileUpload
            label="Logo Image (R2 Upload or URL)"
            value={field("url")}
            onChange={(v) => setField("url", v)}
            aspectRatio="square"
            folder="logos"
            helperText="Uploaded to Cloudflare R2 media storage."
          />
        </>
      )}

      {overlay.kind === "image" && (
        <ImageFileUpload
          label="Overlay Graphic / Image (R2 Upload or URL)"
          value={field("url")}
          onChange={(v) => setField("url", v)}
          aspectRatio="16/9"
          folder="overlays"
          helperText="Uploaded to Cloudflare R2 media storage."
        />
      )}

      {overlay.kind === "countdown" && (
        <>
          <Text label="Label" value={field("label")} onChange={(v) => setField("label", v)} placeholder="Starts in" />
          <Text
            label="Counts down to"
            value={field("target")}
            onChange={(v) => setField("target", v)}
            type="datetime-local"
          />
        </>
      )}

      {/* ── placement ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Position
          </span>
          <select
            value={draft.anchor}
            onChange={(e) => setDraft((p) => ({ ...p, anchor: e.target.value as OverlayAnchor }))}
            disabled={overlay.kind === "ticker"}
            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] disabled:opacity-50"
          >
            {OVERLAY_ANCHORS.map((anchor) => (
              <option key={anchor} value={anchor}>
                {anchor.replace("-", " ")}
              </option>
            ))}
          </select>
        </label>

        <Range
          label={`Size ${draft.scale.toFixed(2)}×`}
          value={draft.scale}
          min={0.4}
          max={2.5}
          step={0.05}
          onChange={(scale) => setDraft((p) => ({ ...p, scale }))}
        />

        <Range
          label={`Across ${(draft.x * 100).toFixed(0)}%`}
          value={draft.x}
          min={0}
          max={0.45}
          step={0.005}
          onChange={(x) => setDraft((p) => ({ ...p, x }))}
        />
        <Range
          label={`Down ${(draft.y * 100).toFixed(0)}%`}
          value={draft.y}
          min={0}
          max={0.45}
          step={0.005}
          onChange={(y) => setDraft((p) => ({ ...p, y }))}
        />

        <Colour label="Background" value={draft.bg} onChange={(bg) => setDraft((p) => ({ ...p, bg }))} />
        <Colour label="Text" value={draft.fg} onChange={(fg) => setDraft((p) => ({ ...p, fg }))} />
        <Colour label="Accent" value={draft.accent} onChange={(accent) => setDraft((p) => ({ ...p, accent }))} />

        {overlay.kind === "ticker" && (
          <Range
            label="Scroll speed"
            value={draft.speed}
            min={0.02}
            max={0.25}
            step={0.005}
            onChange={(speed) => setDraft((p) => ({ ...p, speed }))}
          />
        )}
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={() => onSave({ name, payload, style: { ...draft } })}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-[11px] font-bold text-white transition-colors hover:bg-slate-800 disabled:opacity-40"
      >
        {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Save overlay
      </button>

      {!!overlay.visible && (
        <p className="text-center text-[10px] text-emerald-700">
          This overlay is on air — saving changes it for everyone watching.
        </p>
      )}
    </section>
  )
}

/* ── small inputs ───────────────────────────────────────────────────────── */

function Text({
  label,
  value,
  onChange,
  placeholder,
  hint,
  multiline,
  type = "text",
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  hint?: string
  multiline?: boolean
  type?: string
}) {
  const shared =
    "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"

  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {multiline ? (
        <textarea
          value={value}
          rows={2}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={shared}
        />
      ) : (
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={shared}
        />
      )}
      {hint && <span className="mt-1 block text-[10px] leading-relaxed text-slate-400">{hint}</span>}
    </label>
  )
}

function Range({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-slate-900"
      />
    </label>
  )
}

function Colour({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <input
        type="color"
        value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#0f172a"}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-full cursor-pointer rounded-lg border border-slate-200 bg-white"
      />
    </label>
  )
}

/** One line describing an overlay in the list, so a host can tell two apart. */
function summarise(overlay: RoomOverlay): string {
  const text = (key: string) =>
    typeof overlay.payload[key] === "string" ? (overlay.payload[key] as string) : ""

  switch (overlay.kind) {
    case "lower_third":
      return [text("title"), text("subtitle")].filter(Boolean).join(" — ") || "No name set"
    case "logo":
      return text("text") || text("url") || "No logo set"
    case "countdown":
      return text("target") ? `Counting to ${text("target")}` : "No target time set"
    case "image":
      return text("url") || "No image set"
    default:
      return text("text") || `No ${OVERLAY_KIND_LABELS[overlay.kind].toLowerCase()} text yet`
  }
}
