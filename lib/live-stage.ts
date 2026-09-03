/**
 * The stage model — layouts, overlays and co-host links.
 *
 * This module is deliberately pure and shared. Three very different renderers
 * read from it:
 *
 *   1. The studio compositor, which draws to a canvas that becomes the
 *      broadcast (components/live/stage/compositor.ts).
 *   2. The student page's DOM fallback, for classes fed by OBS where nothing
 *      in our code touches the pixels (components/live/overlay-layer.tsx).
 *   3. The editors, which have to show a host where a thing will land before
 *      it is on air.
 *
 * If the geometry lived in the compositor, the DOM fallback would drift from
 * it the first time either was touched — and the failure mode is a logo that
 * sits in a different corner depending on how the class happens to be
 * streamed, which nobody notices until a parent screenshots it.
 *
 * Coordinates are normalised 0-1 against the canvas, never pixels. A ticker
 * positioned at 1280x720 has to land in the same place at 1920x1080 and in a
 * 320px-wide preview, and the only way that holds is if the stored value is
 * resolution-free.
 */

import type { CSSProperties } from "react"
import { dmApi, type DmApiResult } from "@/lib/dm-api"
import type {
  OverlayKind,
  RoomOverlay,
  StageLayout,
  StageSource,
} from "@/lib/live-room"

/* ── geometry ───────────────────────────────────────────────────────────── */

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface StageTile extends Rect {
  id: string
  kind: StageSource["kind"]
  label: string
  /** Tiles below full size get a smaller name plate and thinner border. */
  scale: "large" | "small"
}

export type OverlayAnchor =
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "center"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"

export const OVERLAY_ANCHORS: OverlayAnchor[] = [
  "top-left",
  "top-center",
  "top-right",
  "middle-left",
  "center",
  "middle-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
]

/* ── stage layouts ──────────────────────────────────────────────────────── */

/** Gutter between tiles, as a fraction of the canvas width. */
const GUTTER = 0.008

export interface LayoutInput {
  layout: StageLayout
  /** Sources on the programme, in the producer's order. */
  sources: Pick<StageSource, "id" | "kind" | "label">[]
  spotlight: string | null
  width: number
  height: number
}

/**
 * Where every on-stage source goes, in canvas pixels.
 *
 * One function rather than a component per layout because the same answer is
 * needed by the canvas (to draw), by the studio preview (to draw a click
 * target over each tile) and by the hit test that decides which tile a
 * producer just clicked on. Three implementations of "where is the second
 * camera" would disagree the first time a layout gained a gutter.
 */
export function computeStageLayout({
  layout,
  sources,
  spotlight,
  width,
  height,
}: LayoutInput): StageTile[] {
  const live = sources.filter((s) => s.id)
  if (!live.length) return []

  const gutter = Math.round(width * GUTTER)
  const resolved = layout === "auto" ? autoLayout(live) : layout

  const tile = (
    source: Pick<StageSource, "id" | "kind" | "label">,
    rect: Rect,
    scale: StageTile["scale"] = "large",
  ): StageTile => ({ ...rect, id: source.id, kind: source.kind, label: source.label, scale })

  switch (resolved) {
    case "solo":
      return [tile(live[0], { x: 0, y: 0, w: width, h: height })]

    case "pip": {
      // Picture-in-picture is the one layout where the small tile overlaps the
      // big one rather than sharing space with it, so it is not a grid case.
      const inset = Math.round(width * 0.02)
      const pipW = Math.round(width * 0.24)
      const pipH = Math.round((pipW * height) / width)
      const out = [tile(live[0], { x: 0, y: 0, w: width, h: height })]
      if (live[1]) {
        out.push(
          tile(
            live[1],
            { x: width - pipW - inset, y: height - pipH - inset, w: pipW, h: pipH },
            "small",
          ),
        )
      }
      return out
    }

    case "split": {
      const half = Math.floor((width - gutter) / 2)
      return live
        .slice(0, 2)
        .map((s, i) => tile(s, { x: i * (half + gutter), y: 0, w: half, h: height }))
    }

    case "sidebar":
      return sidebar(live, width, height, gutter, live[0]?.id ?? null, tile)

    case "screen": {
      // The shared screen is the point of this layout, so it takes the large
      // pane whether or not the producer happened to order it first.
      const screen = live.find((s) => s.kind === "screen") ?? live[0]
      return sidebar(live, width, height, gutter, screen.id, tile)
    }

    case "spotlight": {
      const hero = live.find((s) => s.id === spotlight) ?? live[0]
      const rest = live.filter((s) => s.id !== hero.id)
      if (!rest.length) return [tile(hero, { x: 0, y: 0, w: width, h: height })]

      // A strip along the bottom rather than a sidebar: a spotlit speaker
      // should keep a 16:9 frame, and taking width away from them to make room
      // for thumbnails is what makes single-speaker layouts look cramped.
      const stripH = Math.round(height * 0.2)
      const heroH = height - stripH - gutter
      const out = [tile(hero, { x: 0, y: 0, w: width, h: heroH })]

      const count = Math.min(rest.length, 6)
      const stripW = Math.floor((width - gutter * (count - 1)) / count)
      rest.slice(0, count).forEach((s, i) => {
        out.push(
          tile(
            s,
            { x: i * (stripW + gutter), y: heroH + gutter, w: stripW, h: stripH },
            "small",
          ),
        )
      })
      return out
    }

    case "grid":
    default:
      return grid(live, width, height, gutter, tile)
  }
}

/**
 * What "auto" means, which is: do what a person would have chosen.
 *
 * A shared screen always wins, because someone sharing a screen is showing
 * something and shrinking it into a grid cell defeats the purpose. After that
 * it is just headcount.
 */
function autoLayout(sources: Pick<StageSource, "id" | "kind">[]): StageLayout {
  if (sources.some((s) => s.kind === "screen")) return "screen"
  if (sources.length <= 1) return "solo"
  if (sources.length === 2) return "split"
  return "grid"
}

function sidebar(
  live: Pick<StageSource, "id" | "kind" | "label">[],
  width: number,
  height: number,
  gutter: number,
  heroId: string | null,
  tile: (s: Pick<StageSource, "id" | "kind" | "label">, r: Rect, scale?: StageTile["scale"]) => StageTile,
): StageTile[] {
  const hero = live.find((s) => s.id === heroId) ?? live[0]
  const rest = live.filter((s) => s.id !== hero.id)
  if (!rest.length) return [tile(hero, { x: 0, y: 0, w: width, h: height })]

  const mainW = Math.round(width * 0.76) - gutter
  const railW = width - mainW - gutter
  const count = Math.min(rest.length, 4)
  const railH = Math.floor((height - gutter * (count - 1)) / count)

  const out = [tile(hero, { x: 0, y: 0, w: mainW, h: height })]
  rest.slice(0, count).forEach((s, i) => {
    out.push(
      tile(s, { x: mainW + gutter, y: i * (railH + gutter), w: railW, h: railH }, "small"),
    )
  })
  return out
}

function grid(
  live: Pick<StageSource, "id" | "kind" | "label">[],
  width: number,
  height: number,
  gutter: number,
  tile: (s: Pick<StageSource, "id" | "kind" | "label">, r: Rect, scale?: StageTile["scale"]) => StageTile,
): StageTile[] {
  const count = Math.min(live.length, 9)
  const cols = count <= 1 ? 1 : count <= 4 ? 2 : 3
  const rowCount = Math.ceil(count / cols)

  const cellW = Math.floor((width - gutter * (cols - 1)) / cols)
  const cellH = Math.floor((height - gutter * (rowCount - 1)) / rowCount)

  return live.slice(0, count).map((s, i) => {
    const row = Math.floor(i / cols)
    const col = i % cols
    // Centre a short last row rather than leaving a hole on the right, which
    // is what makes a three-person grid look like a bug.
    const inRow = Math.min(cols, count - row * cols)
    const rowWidth = inRow * cellW + (inRow - 1) * gutter
    const offset = Math.round((width - rowWidth) / 2)

    return tile(
      s,
      { x: offset + col * (cellW + gutter), y: row * (cellH + gutter), w: cellW, h: cellH },
      count > 4 ? "small" : "large",
    )
  })
}

/* ── overlays ───────────────────────────────────────────────────────────── */

export interface OverlayStyle {
  anchor: OverlayAnchor
  /** Offset from the anchored edge, as a fraction of width / height. */
  x: number
  y: number
  /** 1 is the kind's natural size. */
  scale: number
  bg: string
  fg: string
  accent: string
  opacity: number
  /** Ticker only: scroll speed in canvas widths per second. */
  speed: number
}

const BASE_STYLE: OverlayStyle = {
  anchor: "bottom-left",
  x: 0.03,
  y: 0.06,
  scale: 1,
  bg: "#0f172a",
  fg: "#ffffff",
  accent: "#2563eb",
  opacity: 1,
  speed: 0.06,
}

/**
 * Where each kind sits when a host adds it without touching anything.
 *
 * These are not arbitrary. A ticker belongs pinned to the bottom edge and a
 * lower third above it, because the two are routinely on air together and a
 * default that overlaps them means every host's first experience of the
 * feature is fixing a collision.
 */
const KIND_STYLE: Record<OverlayKind, Partial<OverlayStyle>> = {
  ticker: { anchor: "bottom-center", x: 0, y: 0, bg: "#0f172a", accent: "#2563eb" },
  logo: { anchor: "bottom-right", x: 0.025, y: 0.045, opacity: 0.92 },
  lower_third: { anchor: "bottom-left", x: 0.05, y: 0.16 },
  banner: { anchor: "top-center", x: 0, y: 0.05, bg: "#b91c1c" },
  text: { anchor: "top-left", x: 0.05, y: 0.08 },
  countdown: { anchor: "top-right", x: 0.04, y: 0.06, bg: "#0f172a", accent: "#f59e0b" },
  image: { anchor: "center", x: 0, y: 0, scale: 0.5 },
}

const KIND_PAYLOAD: Record<OverlayKind, Record<string, unknown>> = {
  ticker: { text: "Welcome to today's class · Please keep questions in the Q&A tab" },
  logo: { text: "Digital Madarsa", url: "" },
  lower_third: { title: "", subtitle: "" },
  banner: { text: "" },
  text: { text: "" },
  countdown: { target: "", label: "Starts in" },
  image: { url: "" },
}

export const OVERLAY_KIND_LABELS: Record<OverlayKind, string> = {
  ticker: "Ticker",
  logo: "Logo / watermark",
  lower_third: "Lower third",
  banner: "Banner",
  text: "Text",
  countdown: "Countdown",
  image: "Image",
}

/** A ready-to-POST overlay of the given kind. */
export function newOverlay(kind: OverlayKind, name?: string) {
  return {
    kind,
    name: name || OVERLAY_KIND_LABELS[kind],
    payload: { ...KIND_PAYLOAD[kind] },
    style: { ...BASE_STYLE, ...KIND_STYLE[kind] },
    visible: false,
  }
}

/**
 * Read an overlay's style, filling every gap.
 *
 * Never returns a partial: a renderer that has to guard each field ends up
 * with a different fallback in the canvas than in the DOM, and the overlay
 * silently changes colour depending on how the class is being streamed.
 */
export function overlayStyle(overlay: RoomOverlay): OverlayStyle {
  const raw = overlay.style ?? {}
  const kindDefaults = { ...BASE_STYLE, ...(KIND_STYLE[overlay.kind] ?? {}) }

  const anchor = OVERLAY_ANCHORS.includes(raw.anchor as OverlayAnchor)
    ? (raw.anchor as OverlayAnchor)
    : kindDefaults.anchor

  return {
    anchor,
    x: numberOr(raw.x, kindDefaults.x),
    y: numberOr(raw.y, kindDefaults.y),
    scale: clamp(numberOr(raw.scale, kindDefaults.scale), 0.2, 4),
    bg: stringOr(raw.bg, kindDefaults.bg),
    fg: stringOr(raw.fg, kindDefaults.fg),
    accent: stringOr(raw.accent, kindDefaults.accent),
    opacity: clamp(numberOr(raw.opacity, kindDefaults.opacity), 0, 1),
    speed: clamp(numberOr(raw.speed, kindDefaults.speed), 0.01, 0.5),
  }
}

export function overlayText(overlay: RoomOverlay, field = "text"): string {
  const value = overlay.payload?.[field]
  return typeof value === "string" ? value : ""
}

/**
 * Place an anchored box on a canvas of the given size.
 *
 * `w` and `h` are the box's own measured size; this only decides where its
 * corner goes. Text has to be measured by whoever is drawing it — the canvas
 * knows its font metrics and the DOM knows its own — so measurement stays out
 * of here and placement stays in one place.
 */
export function anchorRect(
  style: OverlayStyle,
  box: { w: number; h: number },
  canvas: { width: number; height: number },
): Rect {
  const offsetX = style.x * canvas.width
  const offsetY = style.y * canvas.height

  const [vertical, horizontal] = splitAnchor(style.anchor)

  let x: number
  if (horizontal === "left") x = offsetX
  else if (horizontal === "right") x = canvas.width - box.w - offsetX
  else x = (canvas.width - box.w) / 2 + offsetX

  let y: number
  if (vertical === "top") y = offsetY
  else if (vertical === "bottom") y = canvas.height - box.h - offsetY
  else y = (canvas.height - box.h) / 2 + offsetY

  return { x, y, w: box.w, h: box.h }
}

/** CSS `position: absolute` offsets for the same anchor, for the DOM renderer. */
export function anchorCss(style: OverlayStyle): CSSProperties {
  const [vertical, horizontal] = splitAnchor(style.anchor)
  const css: CSSProperties = { position: "absolute" }

  if (horizontal === "left") css.left = pct(style.x)
  else if (horizontal === "right") css.right = pct(style.x)
  else {
    css.left = "50%"
    css.transform = "translateX(-50%)"
  }

  if (vertical === "top") css.top = pct(style.y)
  else if (vertical === "bottom") css.bottom = pct(style.y)
  else {
    css.top = "50%"
    css.transform = css.transform ? `${css.transform} translateY(-50%)` : "translateY(-50%)"
  }

  return css
}

function splitAnchor(anchor: OverlayAnchor): ["top" | "middle" | "bottom", "left" | "center" | "right"] {
  if (anchor === "center") return ["middle", "center"]
  const [v, h] = anchor.split("-") as ["top" | "middle" | "bottom", "left" | "center" | "right"]
  return [v, h]
}

const pct = (value: number) => `${(value * 100).toFixed(3)}%`

function numberOr(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value)
  return Number.isFinite(n) ? n : fallback
}

function stringOr(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * Seconds left on a countdown overlay, or null when it has no target.
 *
 * Shared so the canvas and the DOM agree to the second; two independent
 * `new Date()` calls in two renderers drift apart on the same screen.
 */
export function countdownSeconds(overlay: RoomOverlay, now = Date.now()): number | null {
  const target = overlay.payload?.target
  if (typeof target !== "string" || !target) return null
  const at = Date.parse(target.includes("T") ? target : `${target.replace(" ", "T")}Z`)
  if (!Number.isFinite(at)) return null
  return Math.max(0, Math.round((at - now) / 1000))
}

/* ── co-host links ──────────────────────────────────────────────────────── */

export interface StageInvite {
  id: number
  live_class_id: number
  token: string
  label: string
  role: "cohost" | "guest"
  can_moderate: number
  display_name: string | null
  name_locked: number
  max_uses: number
  expires_at: string | null
  revoked: number
  created_at: string
  last_used_at: string | null
  used_count: number
}

export interface StageInviteUse {
  id: number
  display_name: string | null
  first_used_at: string
  last_used_at: string
}

export interface NewStageInvite {
  label: string
  role?: "cohost" | "guest"
  can_moderate?: boolean
  display_name?: string | null
  name_locked?: boolean
  max_uses?: number
  expires_at?: string | null
}

/**
 * Invite management is keyed by class id, not by room token: minting a link is
 * a management act, and a co-host holding a room token must not be able to
 * mint further co-hosts with it.
 */
export const stageInviteApi = {
  list(classId: number | string): Promise<DmApiResult<{ success: boolean; items: StageInvite[] }>> {
    return dmApi.get(`/live-classes/${classId}/stage-invites`)
  },

  create(
    classId: number | string,
    invite: NewStageInvite,
  ): Promise<DmApiResult<{ success: boolean; invite: StageInvite }>> {
    return dmApi.post(`/live-classes/${classId}/stage-invites`, invite)
  },

  update(
    classId: number | string,
    inviteId: number,
    patch: Partial<NewStageInvite & { revoked: boolean }>,
  ): Promise<DmApiResult<{ success: boolean; invite: StageInvite }>> {
    return dmApi.put(`/live-classes/${classId}/stage-invites/${inviteId}`, patch)
  },

  remove(classId: number | string, inviteId: number) {
    return dmApi.delete(`/live-classes/${classId}/stage-invites/${inviteId}`)
  },

  uses(
    classId: number | string,
    inviteId: number,
  ): Promise<DmApiResult<{ success: boolean; items: StageInviteUse[] }>> {
    return dmApi.get(`/live-classes/${classId}/stage-invites/${inviteId}/uses`)
  },
}

/** The URL a guest host opens. */
export function stageInviteUrl(token: string, origin?: string): string {
  const base = origin || (typeof window !== "undefined" ? window.location.origin : "")
  return `${base}/live/studio/${token}`
}
