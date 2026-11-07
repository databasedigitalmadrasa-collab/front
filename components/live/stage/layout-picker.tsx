"use client"

/**
 * The row of layouts under the programme, StreamYard-style.
 *
 * Each button's thumbnail is drawn by `computeStageLayout` itself, from the
 * sources actually on stage (or a stand-in set when the stage is empty). A
 * hand-drawn icon would describe the layout as designed; this shows the layout
 * as it would come out right now, which is what the host is choosing between.
 */

import { useMemo } from "react"
import type { StageLayout, StageSource } from "@/lib/live-room"
import { PICKABLE_LAYOUTS, computeStageLayout, resolveLayout } from "@/lib/live-stage"

const LABELS: Record<StageLayout, { label: string; hint: string }> = {
  auto: { label: "Auto", hint: "Pick the layout for whatever is on stage" },
  solo: { label: "Solo", hint: "The featured source, full frame" },
  grid: { label: "Group", hint: "Everyone on stage, equal size" },
  split: { label: "Group", hint: "Everyone on stage, equal size" },
  spotlight: { label: "Leader", hint: "The featured source large, the rest in a row below" },
  sidebar: { label: "Sidebar", hint: "The featured source large, the rest in a column" },
  screen: { label: "Screen", hint: "The shared screen large, cameras beside it" },
  pip: { label: "PiP", hint: "The featured source full frame, the rest inset" },
}

const THUMB_W = 64
const THUMB_H = 36

/** Stand-ins, so an empty stage still previews each layout's shape. */
const SAMPLE: Pick<StageSource, "id" | "kind" | "label">[] = [
  { id: "a", kind: "camera", label: "" },
  { id: "b", kind: "camera", label: "" },
  { id: "c", kind: "screen", label: "" },
]

export interface LayoutPickerProps {
  layout: StageLayout
  /** What is on stage now, in stage order. */
  sources: Pick<StageSource, "id" | "kind" | "label">[]
  featured: string | null
  disabled?: boolean
  onLayout: (layout: StageLayout) => void
}

export function LayoutPicker({ layout, sources, featured, disabled, onLayout }: LayoutPickerProps) {
  const preview = sources.length >= 2 ? sources : SAMPLE
  const active = layout === "split" ? "grid" : layout
  const autoResolves = resolveLayout("auto", sources)

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5" role="radiogroup" aria-label="Stage layout">
      {PICKABLE_LAYOUTS.map((option) => {
        const selected = active === option
        const { label, hint } = LABELS[option]
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onLayout(option)}
            title={option === "auto" && sources.length ? `${hint} — now ${LABELS[autoResolves].label}` : hint}
            className={`group flex flex-col items-center gap-1 rounded-xl border p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              selected
                ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <Thumb layout={option} sources={preview} featured={featured} selected={selected} />
            <span className={`text-[10px] font-bold ${selected ? "text-blue-700" : "text-slate-600"}`}>
              {label}
              {option === "auto" && sources.length > 0 && (
                <span className="font-medium text-slate-400"> · {LABELS[autoResolves].label}</span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function Thumb({
  layout,
  sources,
  featured,
  selected,
}: {
  layout: StageLayout
  sources: Pick<StageSource, "id" | "kind" | "label">[]
  featured: string | null
  selected: boolean
}) {
  const tiles = useMemo(
    () => computeStageLayout({ layout, sources, spotlight: featured, width: THUMB_W, height: THUMB_H }),
    [layout, sources, featured],
  )

  return (
    <svg
      width={THUMB_W}
      height={THUMB_H}
      viewBox={`0 0 ${THUMB_W} ${THUMB_H}`}
      aria-hidden="true"
      className="rounded-[5px]"
    >
      <rect width={THUMB_W} height={THUMB_H} rx={4} className={selected ? "fill-blue-100" : "fill-slate-100"} />
      {tiles.map((t, i) => (
        <rect
          key={t.id}
          x={t.x}
          y={t.y}
          width={Math.max(1, t.w)}
          height={Math.max(1, t.h)}
          rx={1.5}
          className={
            t.kind === "screen"
              ? selected
                ? "fill-blue-300"
                : "fill-slate-300"
              : i === 0
                ? selected
                  ? "fill-blue-600"
                  : "fill-slate-500"
                : selected
                  ? "fill-blue-400"
                  : "fill-slate-400"
          }
        />
      ))}
    </svg>
  )
}
