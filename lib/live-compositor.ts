/**
 * Painting the programme.
 *
 * Everything here is pure drawing: given a 2D context, a set of video
 * elements, a layout and a list of overlays, put a frame on the canvas. No
 * React, no media plumbing, no state — `useStageCompositor` owns all three and
 * calls in here thirty times a second.
 *
 * Split out for two reasons. It is the code most likely to be tweaked (a
 * corner radius, a name plate, a new overlay kind), and it is the code least
 * likely to want a re-render while being tweaked. It is also the only part
 * that can be exercised against a plain canvas with no camera attached.
 *
 * WHAT NEVER GETS DRAWN
 * ---------------------
 * An image that failed its CORS check. Drawing a cross-origin image without
 * `crossOrigin="anonymous"` taints the canvas, and a tainted canvas's
 * `captureStream()` hands back frames the encoder refuses — so a host who
 * uploads a logo to a bucket without CORS headers would not get a broken logo,
 * they would get a broken broadcast. The image cache below only ever yields
 * images that loaded cleanly.
 */

import {
  anchorRect,
  countdownSeconds,
  overlayStyle,
  overlayText,
  type OverlayStyle,
  type StageTile,
} from "@/lib/live-stage"
import type { RoomOverlay } from "@/lib/live-room"

/* ── sources ────────────────────────────────────────────────────────────── */

export interface DrawableSource {
  id: string
  label: string
  kind: "camera" | "screen" | "media"
  /** The element actually holding decoded frames. */
  video: HTMLVideoElement | null
  /** False when the publisher has paused the camera. */
  live: boolean
  /** The producer has silenced them. Shown, not implied. */
  muted: boolean
}

export interface DrawStageOptions {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  tiles: StageTile[]
  sources: Map<string, DrawableSource>
  overlays: RoomOverlay[]
  showNamePlates: boolean
  /** Milliseconds since the compositor started, for anything that animates. */
  elapsedMs: number
  images: ImageCache
}

const BACKDROP = "#0b1120"
const TILE_BG = "#111827"

/* ── frame ──────────────────────────────────────────────────────────────── */

export function drawStage(o: DrawStageOptions): void {
  const { ctx, width, height } = o

  ctx.save()
  ctx.fillStyle = BACKDROP
  ctx.fillRect(0, 0, width, height)

  if (!o.tiles.length) drawEmptyStage(o)
  for (const tile of o.tiles) drawTile(o, tile)

  ctx.restore()

  for (const overlay of o.overlays) drawOverlay(o, overlay)
}

function drawEmptyStage({ ctx, width, height }: DrawStageOptions): void {
  ctx.fillStyle = "#64748b"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.font = `600 ${Math.round(height * 0.038)}px ${FONT}`
  ctx.fillText("Nothing is on stage yet", width / 2, height / 2 - height * 0.02)
  ctx.font = `400 ${Math.round(height * 0.026)}px ${FONT}`
  ctx.fillStyle = "#475569"
  ctx.fillText("Add a camera, then put it on air", width / 2, height / 2 + height * 0.035)
}

function drawTile(o: DrawStageOptions, tile: StageTile): void {
  const { ctx, height } = o
  const source = o.sources.get(tile.id)
  const radius = Math.round(Math.min(tile.w, tile.h) * 0.02)

  ctx.save()
  roundedPath(ctx, tile.x, tile.y, tile.w, tile.h, radius)
  ctx.clip()

  ctx.fillStyle = TILE_BG
  ctx.fillRect(tile.x, tile.y, tile.w, tile.h)

  const video = source?.video
  const ready = !!video && video.readyState >= 2 && video.videoWidth > 0 && !!source?.live

  if (ready && video) {
    // A shared screen is letterboxed rather than cropped: cover-cropping a
    // slide deck cuts the edges off the slide, which is where the diagram
    // usually is. Cameras are cropped, because a camera with bars looks broken.
    if (tile.kind === "screen") drawContain(ctx, video, tile)
    else drawCover(ctx, video, tile)
  } else {
    drawPlaceholder(o, tile, source)
  }

  ctx.restore()

  if (o.showNamePlates && source) drawNamePlate(o, tile, source)

  if (source?.muted) drawMuteBadge(o, tile)

  // A hairline, so two dark tiles side by side still read as two tiles.
  ctx.save()
  ctx.strokeStyle = "rgba(148, 163, 184, 0.22)"
  ctx.lineWidth = Math.max(1, Math.round(height * 0.0015))
  roundedPath(ctx, tile.x, tile.y, tile.w, tile.h, radius)
  ctx.stroke()
  ctx.restore()
}

/** Fill the tile, cropping the overflow — the right default for a face. */
function drawCover(ctx: CanvasRenderingContext2D, video: HTMLVideoElement, tile: StageTile): void {
  const scale = Math.max(tile.w / video.videoWidth, tile.h / video.videoHeight)
  const w = video.videoWidth * scale
  const h = video.videoHeight * scale
  ctx.drawImage(video, tile.x + (tile.w - w) / 2, tile.y + (tile.h - h) / 2, w, h)
}

/** Fit the whole frame inside the tile — the right default for a screen. */
function drawContain(ctx: CanvasRenderingContext2D, video: HTMLVideoElement, tile: StageTile): void {
  const scale = Math.min(tile.w / video.videoWidth, tile.h / video.videoHeight)
  const w = video.videoWidth * scale
  const h = video.videoHeight * scale
  ctx.drawImage(video, tile.x + (tile.w - w) / 2, tile.y + (tile.h - h) / 2, w, h)
}

/**
 * What a tile shows when its camera is off.
 *
 * Deliberately not a black rectangle: a black tile is indistinguishable from a
 * broken one, and the class spends the next minute typing "we can't see you".
 * Initials and a name say the seat is taken and the camera is not on.
 */
function drawPlaceholder(o: DrawStageOptions, tile: StageTile, source?: DrawableSource): void {
  const { ctx } = o
  const cx = tile.x + tile.w / 2
  const cy = tile.y + tile.h / 2
  const radius = Math.min(tile.w, tile.h) * 0.17

  ctx.fillStyle = "#1e293b"
  ctx.beginPath()
  ctx.arc(cx, cy - tile.h * 0.03, radius, 0, Math.PI * 2)
  ctx.fill()

  const label = source?.label ?? ""
  ctx.fillStyle = "#94a3b8"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.font = `700 ${Math.round(radius * 0.8)}px ${FONT}`
  ctx.fillText(initials(label), cx, cy - tile.h * 0.03)

  if (label) {
    ctx.font = `600 ${Math.round(Math.min(tile.w, tile.h) * 0.06)}px ${FONT}`
    ctx.fillStyle = "#64748b"
    ctx.fillText(label, cx, cy + radius + tile.h * 0.06)
  }
}

function drawNamePlate(o: DrawStageOptions, tile: StageTile, source: DrawableSource): void {
  const { ctx } = o
  if (!source.label) return

  const fontSize = Math.round(Math.min(tile.h * (tile.scale === "small" ? 0.085 : 0.055), o.height * 0.032))
  if (fontSize < 9) return

  const padX = Math.round(fontSize * 0.7)
  const padY = Math.round(fontSize * 0.42)
  const inset = Math.round(Math.min(tile.w, tile.h) * 0.035)

  ctx.save()
  ctx.font = `600 ${fontSize}px ${FONT}`
  const textWidth = ctx.measureText(source.label).width
  const boxW = textWidth + padX * 2
  const boxH = fontSize + padY * 2

  const x = tile.x + inset
  const y = tile.y + tile.h - inset - boxH

  ctx.fillStyle = "rgba(2, 6, 23, 0.72)"
  roundedPath(ctx, x, y, boxW, boxH, boxH / 2.6)
  ctx.fill()

  ctx.fillStyle = "#f8fafc"
  ctx.textAlign = "left"
  ctx.textBaseline = "middle"
  ctx.fillText(source.label, x + padX, y + boxH / 2 + 1)
  ctx.restore()
}

function drawMuteBadge(o: DrawStageOptions, tile: StageTile): void {
  const { ctx } = o
  const size = Math.round(Math.min(tile.w, tile.h) * 0.09)
  const inset = Math.round(Math.min(tile.w, tile.h) * 0.035)
  const x = tile.x + tile.w - inset - size
  const y = tile.y + inset

  ctx.save()
  ctx.fillStyle = "rgba(190, 18, 60, 0.92)"
  ctx.beginPath()
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2)
  ctx.fill()

  // A microphone with a stroke through it, drawn rather than loaded: an icon
  // font would be one more asset that has to survive CORS to reach the canvas.
  ctx.strokeStyle = "#ffffff"
  ctx.lineWidth = Math.max(1.5, size * 0.08)
  ctx.lineCap = "round"
  const cx = x + size / 2
  const cy = y + size / 2
  ctx.beginPath()
  ctx.roundRect?.(cx - size * 0.11, cy - size * 0.22, size * 0.22, size * 0.28, size * 0.11)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx - size * 0.2, cy + size * 0.06)
  ctx.quadraticCurveTo(cx, cy + size * 0.3, cx + size * 0.2, cy + size * 0.06)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx - size * 0.26, cy - size * 0.28)
  ctx.lineTo(cx + size * 0.26, cy + size * 0.28)
  ctx.stroke()
  ctx.restore()
}

/* ── overlays ───────────────────────────────────────────────────────────── */

function drawOverlay(o: DrawStageOptions, overlay: RoomOverlay): void {
  const style = overlayStyle(overlay)
  const { ctx } = o

  ctx.save()
  ctx.globalAlpha = style.opacity

  switch (overlay.kind) {
    case "ticker":
      drawTicker(o, overlay, style)
      break
    case "lower_third":
      drawLowerThird(o, overlay, style)
      break
    case "banner":
      drawBanner(o, overlay, style)
      break
    case "logo":
      drawLogo(o, overlay, style)
      break
    case "text":
      drawPlainText(o, overlay, style)
      break
    case "countdown":
      drawCountdown(o, overlay, style)
      break
    case "image":
      drawImage(o, overlay, style)
      break
  }

  ctx.restore()
}

/**
 * The scrolling news bar.
 *
 * The text is drawn twice, one full gap apart, so it wraps seamlessly instead
 * of leaving the bar empty while the tail walks off the left edge. Position is
 * derived from elapsed time rather than accumulated per frame, so a dropped
 * frame slows nothing down and two clients started at different moments still
 * scroll at the same speed.
 */
function drawTicker(o: DrawStageOptions, overlay: RoomOverlay, style: OverlayStyle): void {
  const { ctx, width, height } = o
  const text = overlayText(overlay)
  if (!text.trim()) return

  const barH = Math.round(height * 0.075 * style.scale)
  const y = anchorRect(style, { w: width, h: barH }, { width, height }).y
  const fontSize = Math.round(barH * 0.42)

  ctx.fillStyle = style.bg
  ctx.fillRect(0, y, width, barH)

  // The accent block carries the label and gives the eye somewhere to start.
  const labelText = typeof overlay.payload.label === "string" ? overlay.payload.label : "LIVE"
  ctx.font = `800 ${Math.round(fontSize * 0.86)}px ${FONT}`
  const labelW = ctx.measureText(labelText).width + fontSize * 1.6
  ctx.fillStyle = style.accent
  ctx.fillRect(0, y, labelW, barH)
  ctx.fillStyle = "#ffffff"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(labelText, labelW / 2, y + barH / 2 + 1)

  ctx.save()
  ctx.beginPath()
  ctx.rect(labelW, y, width - labelW, barH)
  ctx.clip()

  ctx.font = `500 ${fontSize}px ${FONT}`
  ctx.fillStyle = style.fg
  ctx.textAlign = "left"

  const gap = fontSize * 4
  const textW = ctx.measureText(text).width + gap
  const travelled = (o.elapsedMs / 1000) * style.speed * width
  const offset = textW > 0 ? travelled % textW : 0

  ctx.fillText(text, width - offset, y + barH / 2 + 1)
  ctx.fillText(text, width - offset + textW, y + barH / 2 + 1)
  ctx.restore()
}

function drawLowerThird(o: DrawStageOptions, overlay: RoomOverlay, style: OverlayStyle): void {
  const { ctx, width, height } = o
  const title = overlayText(overlay, "title")
  const subtitle = overlayText(overlay, "subtitle")
  if (!title.trim() && !subtitle.trim()) return

  const titleSize = Math.round(height * 0.048 * style.scale)
  const subSize = Math.round(height * 0.03 * style.scale)
  const padX = Math.round(titleSize * 0.85)
  const padY = Math.round(titleSize * 0.55)
  const accentW = Math.round(titleSize * 0.18)

  ctx.font = `700 ${titleSize}px ${FONT}`
  const titleW = ctx.measureText(title).width
  ctx.font = `500 ${subSize}px ${FONT}`
  const subW = subtitle ? ctx.measureText(subtitle).width : 0

  const boxW = Math.max(titleW, subW) + padX * 2 + accentW
  const boxH = titleSize + (subtitle ? subSize + padY * 0.5 : 0) + padY * 2

  const rect = anchorRect(style, { w: boxW, h: boxH }, { width, height })

  ctx.fillStyle = style.bg
  roundedPath(ctx, rect.x, rect.y, rect.w, rect.h, Math.round(titleSize * 0.25))
  ctx.fill()

  ctx.fillStyle = style.accent
  roundedPath(ctx, rect.x, rect.y, accentW, rect.h, Math.round(titleSize * 0.25))
  ctx.fill()

  ctx.textAlign = "left"
  ctx.textBaseline = "top"
  ctx.fillStyle = style.fg
  ctx.font = `700 ${titleSize}px ${FONT}`
  ctx.fillText(title, rect.x + accentW + padX, rect.y + padY)

  if (subtitle) {
    ctx.font = `500 ${subSize}px ${FONT}`
    ctx.fillStyle = "rgba(248, 250, 252, 0.75)"
    ctx.fillText(subtitle, rect.x + accentW + padX, rect.y + padY + titleSize + padY * 0.35)
  }
}

function drawBanner(o: DrawStageOptions, overlay: RoomOverlay, style: OverlayStyle): void {
  const { ctx, width, height } = o
  const text = overlayText(overlay)
  if (!text.trim()) return

  const fontSize = Math.round(height * 0.042 * style.scale)
  const padX = fontSize
  const padY = Math.round(fontSize * 0.55)

  ctx.font = `700 ${fontSize}px ${FONT}`
  const boxW = ctx.measureText(text).width + padX * 2
  const boxH = fontSize + padY * 2
  const rect = anchorRect(style, { w: boxW, h: boxH }, { width, height })

  ctx.fillStyle = style.bg
  roundedPath(ctx, rect.x, rect.y, rect.w, rect.h, boxH / 2.4)
  ctx.fill()

  ctx.fillStyle = style.fg
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(text, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1)
}

function drawLogo(o: DrawStageOptions, overlay: RoomOverlay, style: OverlayStyle): void {
  const { ctx, width, height } = o
  const url = overlayText(overlay, "url")
  const text = overlayText(overlay)
  const image = url ? o.images.get(url) : null

  const fontSize = Math.round(height * 0.028 * style.scale)
  const padX = Math.round(fontSize * 0.8)
  const padY = Math.round(fontSize * 0.55)
  const logoH = image ? Math.round(height * 0.05 * style.scale) : 0
  const logoW = image ? Math.round((image.naturalWidth / image.naturalHeight) * logoH) : 0

  ctx.font = `600 ${fontSize}px ${FONT}`
  const textW = text ? ctx.measureText(text).width : 0
  const gap = image && text ? padX * 0.7 : 0

  const boxW = logoW + gap + textW + padX * 2
  const boxH = Math.max(logoH, fontSize) + padY * 2
  if (boxW <= padX * 2) return

  const rect = anchorRect(style, { w: boxW, h: boxH }, { width, height })

  ctx.fillStyle = "rgba(2, 6, 23, 0.55)"
  roundedPath(ctx, rect.x, rect.y, rect.w, rect.h, Math.round(boxH * 0.28))
  ctx.fill()

  let cursor = rect.x + padX
  if (image) {
    ctx.drawImage(image, cursor, rect.y + (rect.h - logoH) / 2, logoW, logoH)
    cursor += logoW + gap
  }
  if (text) {
    ctx.fillStyle = style.fg
    ctx.textAlign = "left"
    ctx.textBaseline = "middle"
    ctx.fillText(text, cursor, rect.y + rect.h / 2 + 1)
  }
}

function drawPlainText(o: DrawStageOptions, overlay: RoomOverlay, style: OverlayStyle): void {
  const { ctx, width, height } = o
  const text = overlayText(overlay)
  if (!text.trim()) return

  const fontSize = Math.round(height * 0.04 * style.scale)
  ctx.font = `700 ${fontSize}px ${FONT}`
  const rect = anchorRect(
    style,
    { w: ctx.measureText(text).width, h: fontSize },
    { width, height },
  )

  // A drop shadow rather than a plate: plain text is chosen when the host
  // wants the video to show through, and it has to stay legible over both a
  // white slide and a dark room.
  ctx.shadowColor = "rgba(0, 0, 0, 0.65)"
  ctx.shadowBlur = Math.round(fontSize * 0.35)
  ctx.fillStyle = style.fg
  ctx.textAlign = "left"
  ctx.textBaseline = "top"
  ctx.fillText(text, rect.x, rect.y)
}

function drawCountdown(o: DrawStageOptions, overlay: RoomOverlay, style: OverlayStyle): void {
  const { ctx, width, height } = o
  const seconds = countdownSeconds(overlay)
  if (seconds === null) return

  const label = overlayText(overlay, "label")
  const clock = formatClock(seconds)

  const clockSize = Math.round(height * 0.05 * style.scale)
  const labelSize = Math.round(height * 0.024 * style.scale)
  const padX = Math.round(clockSize * 0.7)
  const padY = Math.round(clockSize * 0.45)

  ctx.font = `700 ${clockSize}px ${MONO}`
  const clockW = ctx.measureText(clock).width
  ctx.font = `600 ${labelSize}px ${FONT}`
  const labelW = label ? ctx.measureText(label).width : 0

  const boxW = Math.max(clockW, labelW) + padX * 2
  const boxH = clockSize + (label ? labelSize + padY * 0.4 : 0) + padY * 2
  const rect = anchorRect(style, { w: boxW, h: boxH }, { width, height })

  ctx.fillStyle = style.bg
  roundedPath(ctx, rect.x, rect.y, rect.w, rect.h, Math.round(clockSize * 0.28))
  ctx.fill()

  ctx.textAlign = "center"
  ctx.textBaseline = "top"

  if (label) {
    ctx.font = `600 ${labelSize}px ${FONT}`
    ctx.fillStyle = "rgba(248, 250, 252, 0.7)"
    ctx.fillText(label, rect.x + rect.w / 2, rect.y + padY)
  }

  ctx.font = `700 ${clockSize}px ${MONO}`
  ctx.fillStyle = seconds === 0 ? style.accent : style.fg
  ctx.fillText(clock, rect.x + rect.w / 2, rect.y + padY + (label ? labelSize + padY * 0.4 : 0))
}

function drawImage(o: DrawStageOptions, overlay: RoomOverlay, style: OverlayStyle): void {
  const { ctx, width, height } = o
  const image = o.images.get(overlayText(overlay, "url"))
  if (!image) return

  const w = width * style.scale
  const h = (image.naturalHeight / image.naturalWidth) * w
  const rect = anchorRect(style, { w, h }, { width, height })
  ctx.drawImage(image, rect.x, rect.y, rect.w, rect.h)
}

/* ── image cache ────────────────────────────────────────────────────────── */

/**
 * Loads overlay images once, and only ones the canvas can safely use.
 *
 * `crossOrigin = "anonymous"` is set before `src`, which is the only order
 * that works, and an image that fails is remembered as failed so a broken URL
 * is not re-requested thirty times a second for the length of a lesson.
 */
export class ImageCache {
  private entries = new Map<string, HTMLImageElement | "loading" | "error">()

  get(url: string): HTMLImageElement | null {
    if (!url) return null

    const existing = this.entries.get(url)
    if (existing instanceof HTMLImageElement) return existing
    if (existing) return null

    this.entries.set(url, "loading")
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.onload = () => this.entries.set(url, image)
    image.onerror = () => this.entries.set(url, "error")
    image.src = url
    return null
  }

  /** True when a URL was fetched and refused — the studio warns about CORS. */
  failed(url: string): boolean {
    return this.entries.get(url) === "error"
  }
}

/* ── small helpers ──────────────────────────────────────────────────────── */

const FONT =
  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif'
const MONO = '"SF Mono", "Roboto Mono", ui-monospace, Menlo, Consolas, monospace'

function roundedPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2))
  ctx.beginPath()
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, radius)
    return
  }
  // Safari before 16 has no roundRect and is still a meaningful share of the
  // iPads these classes are watched on.
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?"
}

export function formatClock(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600)
  const mins = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60
  const pad = (n: number) => String(n).padStart(2, "0")
  return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`
}
