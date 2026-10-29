/**
 * Live class room — the client half of the realtime layer.
 *
 * One class, three audiences, one address: `/live-classes/room/<token>`. The
 * token decides which door you came in by (subscriber link or guest link) and
 * whatever credential the browser already holds decides who you are. The host
 * studio, the student page and the guest page all talk to the same endpoints
 * through this module.
 *
 * Sending is HTTP, receiving is the socket — see `useLiveRoom`. The split is
 * deliberate on the server side (auth and rate limiting stay on the HTTP path);
 * here it just means `send()` returns a promise you can show a spinner on,
 * while incoming traffic arrives as state.
 */

import { API_BASE_URL, dmApi, type DmApiResult } from "@/lib/dm-api"

/* ── wire types ─────────────────────────────────────────────────────────── */

/**
 * `cohost` is the role a stage invite link mints. It is staff, not audience:
 * excluded from the head count, sorted with the host in the roster, and — the
 * whole point — allowed to put a camera on the broadcast.
 */
export type RoomRole = "host" | "cohost" | "student" | "guest"
export type MessageKind = "chat" | "question"

export interface RoomIdentity {
  cid: string
  key: string
  role: RoomRole
  userId: number | null
  guestKey: string | null
  name: string
  /** May answer, pin, delete, and post materials and announcements. */
  moderator: boolean
  /** May publish media onto the broadcast. */
  stage: boolean
  /** Set when this person arrived on a co-host invite link. */
  inviteId?: number
}

/** Running the class rather than attending it. */
export function isStaffRole(role: RoomRole | undefined | null): boolean {
  return role === "host" || role === "cohost"
}

export interface RoomMessage {
  id: number
  kind: MessageKind
  user_id: number | null
  author_name: string
  author_role: string
  body: string
  answered: number
  answer_body: string | null
  answered_at: string | null
  answered_by: string | null
  pinned: number
  deleted: number
  created_at: string
}

export interface PresenceEntry {
  cid: string
  name: string
  role: RoomRole
  userId: number | null
}

export interface RoomMaterial {
  id: number
  title: string
  url: string
  file_type: string | null
  size_label: string | null
  position: number
  created_at: string
}

export interface RoomAnnouncement {
  id: number
  body: string
  author_name: string | null
  created_at: string
}

export interface RoomLiveClass {
  id: number
  title: string
  description: string | null
  thumbnail_url?: string | null
  scheduled_at: string
  duration_minutes: number | null
  status: "scheduled" | "live" | "ended" | "cancelled"
  started_at: string | null
  ended_at: string | null
  cf_playback_url: string | null
  cf_hls_url: string | null
  plan_id: number | null
  public_join_token: string
  guest_token: string
  show_watermark: number
  chat_enabled: number
  qa_enabled: number
  recording_enabled: number
  overlay_text: string | null
  overlay_logo_url: string | null
  max_participants: number | null

  /** Layout the studio reopens with. The live value arrives on the socket. */
  stage_layout: StageLayout
  stage_spotlight: string | null
  /** Where overlays are drawn — see `OverlayRender`. */
  overlay_render: OverlayRender
  broadcast_width: number
  broadcast_height: number
  broadcast_fps: number
  show_name_plates: number
}

/**
 * Where the ticker, the logos and the lower thirds get drawn.
 *
 *  * `burn`   — into the outgoing video by the studio compositor. Default, and
 *               the only mode where the overlay is in the recording and lands
 *               on the same frame of the lesson it belongs to.
 *  * `viewer` — as DOM on the student page. The fallback for a class fed by
 *               OBS over RTMPS, where nothing in our code touches the pixels.
 *  * `both`   — while moving a class from one to the other.
 *
 * The distinction matters because an HLS player runs seconds behind the
 * encoder: a DOM overlay saying "Ayan is asking" appears over whatever the
 * student is watching now, not over the moment it was switched on.
 */
export type OverlayRender = "burn" | "viewer" | "both"

export type OverlayKind =
  | "ticker"
  | "logo"
  | "lower_third"
  | "banner"
  | "text"
  | "countdown"
  | "image"

/**
 * One thing drawn over the video.
 *
 * `payload` is the content and `style` the placement, both free-form JSON on
 * the wire and both narrowed by `lib/live-stage.ts`, which is the only module
 * that reads their fields.
 */
export interface RoomOverlay {
  id: number
  kind: OverlayKind
  name: string
  payload: Record<string, unknown>
  style: Record<string, unknown>
  visible: number
  position: number
  created_at: string
  updated_at: string
}

/* ── stage ──────────────────────────────────────────────────────────────── */

export type StageLayout =
  | "auto"
  | "solo"
  | "split"
  | "sidebar"
  | "grid"
  | "spotlight"
  | "pip"
  | "screen"

/** One thing that can be on screen: a camera, a shared screen, a still. */
export interface StageSource {
  id: string
  kind: "camera" | "screen" | "media"
  label: string
  live: boolean
  selfMuted: boolean
}

/** Someone who may publish, and what they are offering right now. */
export interface StagePeer {
  cid: string
  key: string
  name: string
  role: RoomRole
  moderator: boolean
  /** The socket that owns the encoder and drives the layout. */
  producer: boolean
  sources: StageSource[]
}

export interface StageSnapshot {
  layout: StageLayout
  spotlight: string | null
  onStage: string[]
  muted: string[]
  updatedAt: number
  peers: StagePeer[]
}

export const EMPTY_STAGE: StageSnapshot = {
  layout: "auto",
  spotlight: null,
  onStage: [],
  muted: [],
  updatedAt: 0,
  peers: [],
}

/** The producer's half of the stage — the only part a client may move. */
export type StagePatch = Partial<Pick<StageSnapshot, "layout" | "spotlight" | "onStage" | "muted">>

/** Encoder settings the studio sizes its canvas from. */
export interface BroadcastSettings {
  width: number
  height: number
  fps: number
  overlay_render: OverlayRender
  show_name_plates: number
}

export interface RoomStateResponse {
  success: boolean
  live_class: RoomLiveClass
  you: RoomIdentity
  materials: RoomMaterial[]
  announcements: RoomAnnouncement[]
  messages: RoomMessage[]
  presence: PresenceEntry[]
  participant_count: number
  overlays: RoomOverlay[]
  stage: StageSnapshot | null
}

/** Everything the room pushes down the socket. */
export type RoomEvent =
  | { t: "hello"; you: RoomIdentity; presence: PresenceEntry[]; count: number; stage: StageSnapshot }
  | { t: "presence"; presence: PresenceEntry[]; count: number }
  | { t: "message"; message: RoomMessage }
  | { t: "message:update"; message: RoomMessage }
  | { t: "message:delete"; id: number }
  | { t: "announcement"; announcement: RoomAnnouncement }
  | { t: "material"; material: RoomMaterial }
  | { t: "material:delete"; id: number }
  | { t: "status"; status: RoomLiveClass["status"]; started_at?: string | null; ended_at?: string | null }
  | { t: "settings"; settings: Partial<RoomLiveClass> }
  | { t: "overlay"; overlay: RoomOverlay }
  | { t: "overlay:delete"; id: number }
  | { t: "stage"; stage: StageSnapshot }
  | { t: "signal"; from: string; fromName: string; payload: unknown }

/** What a stage client may send back up the socket. */
export type RoomClientMessage =
  | { t: "signal"; to: string; payload: unknown }
  | { t: "sources"; sources: StageSource[] }
  | { t: "stage:set"; patch: StagePatch }

/* ── guest identity ─────────────────────────────────────────────────────── */

const GUEST_KEY_STORAGE = "dm_live_guest_key"

/**
 * A guest's stable id, so a reload rejoins as the same person instead of
 * doubling the attendee count. It is a browser-local random value and carries
 * no authority — the guest link is what grants access.
 */
export function guestKey(): string {
  if (typeof window === "undefined") return ""
  try {
    const existing = window.localStorage.getItem(GUEST_KEY_STORAGE)
    if (existing) return existing
    const minted = crypto.randomUUID().replace(/-/g, "")
    window.localStorage.setItem(GUEST_KEY_STORAGE, minted)
    return minted
  } catch {
    // Private mode: a per-session key still beats no key at all.
    return crypto.randomUUID().replace(/-/g, "")
  }
}

export function rememberGuestName(name: string): void {
  try {
    window.localStorage.setItem("dm_live_guest_name", name)
  } catch {
    /* nothing to remember it with */
  }
}

export function recallGuestName(): string {
  if (typeof window === "undefined") return ""
  try {
    return window.localStorage.getItem("dm_live_guest_name") ?? ""
  } catch {
    return ""
  }
}

/* ── request plumbing ───────────────────────────────────────────────────── */

export interface RoomAuth {
  token: string
  /** Required on the guest link, ignored on the subscriber link. */
  guestName?: string
  guestKey?: string
}

/** Guest identity rides in the query string, since a guest has no bearer. */
function query(auth: RoomAuth, extra: Record<string, string | number | undefined> = {}): string {
  const params = new URLSearchParams()
  if (auth.guestName) params.set("name", auth.guestName)
  if (auth.guestKey) params.set("gk", auth.guestKey)
  for (const [k, v] of Object.entries(extra)) {
    if (v !== undefined && v !== "") params.set(k, String(v))
  }
  const s = params.toString()
  return s ? `?${s}` : ""
}

function path(auth: RoomAuth, suffix = "", extra?: Record<string, string | number | undefined>): string {
  return `/live-classes/room/${encodeURIComponent(auth.token)}${suffix}${query(auth, extra)}`
}

/**
 * Background calls pass `redirectOnUnauthorized: false`.
 *
 * A poll that 401s must not bounce the viewer to the login screen mid-lesson:
 * the page itself already renders a "sign in again" state, and yanking them
 * out of a live class over one failed background request is the wrong trade.
 */
const BACKGROUND = { redirectOnUnauthorized: false } as const

export const roomApi = {
  state(auth: RoomAuth): Promise<DmApiResult<RoomStateResponse>> {
    return dmApi.get<RoomStateResponse>(path(auth), BACKGROUND)
  },

  messages(
    auth: RoomAuth,
    opts: { kind?: MessageKind; after?: number } = {},
  ): Promise<DmApiResult<{ success: boolean; items: RoomMessage[] }>> {
    return dmApi.get(path(auth, "/messages", { kind: opts.kind, after: opts.after }), BACKGROUND)
  },

  send(
    auth: RoomAuth,
    kind: MessageKind,
    body: string,
  ): Promise<DmApiResult<{ success: boolean; message: RoomMessage }>> {
    return dmApi.post(path(auth, "/messages"), { kind, body, guest_name: auth.guestName, guest_key: auth.guestKey })
  },

  answer(
    auth: RoomAuth,
    messageId: number,
    answer: string,
  ): Promise<DmApiResult<{ success: boolean; message: RoomMessage }>> {
    return dmApi.post(path(auth, `/messages/${messageId}/answer`), { answer })
  },

  pin(auth: RoomAuth, messageId: number, pinned: boolean) {
    return dmApi.post(path(auth, `/messages/${messageId}/pin`), { pinned })
  },

  remove(auth: RoomAuth, messageId: number) {
    return dmApi.delete(path(auth, `/messages/${messageId}`))
  },

  participants(auth: RoomAuth): Promise<DmApiResult<{ success: boolean; presence: PresenceEntry[]; count: number }>> {
    return dmApi.get(path(auth, "/participants"), BACKGROUND)
  },

  addMaterial(
    auth: RoomAuth,
    material: { title: string; url: string; size_label?: string },
  ): Promise<DmApiResult<{ success: boolean; material: RoomMaterial }>> {
    return dmApi.post(path(auth, "/materials"), material)
  },

  removeMaterial(auth: RoomAuth, id: number) {
    return dmApi.delete(path(auth, `/materials/${id}`))
  },

  addAnnouncement(
    auth: RoomAuth,
    body: string,
  ): Promise<DmApiResult<{ success: boolean; announcement: RoomAnnouncement }>> {
    return dmApi.post(path(auth, "/announcements"), { body })
  },

  removeAnnouncement(auth: RoomAuth, id: number) {
    return dmApi.delete(path(auth, `/announcements/${id}`))
  },

  /* ── stage ────────────────────────────────────────────────────────────── */

  stage(
    auth: RoomAuth,
  ): Promise<DmApiResult<{ success: boolean; stage: StageSnapshot | null; you: RoomIdentity; broadcast: BroadcastSettings }>> {
    return dmApi.get(path(auth, "/stage"), BACKGROUND)
  },

  /**
   * ICE servers for a stage member.
   *
   * Fetched per join rather than baked into a constant because the TURN
   * credential is short-lived, and because whether a relay exists at all
   * depends on deployment configuration the browser cannot see.
   */
  ice(
    auth: RoomAuth,
  ): Promise<DmApiResult<{ success: boolean; ice_servers: RTCIceServer[]; relay_available: boolean }>> {
    return dmApi.get(path(auth, "/ice"), BACKGROUND)
  },

  overlays(auth: RoomAuth): Promise<DmApiResult<{ success: boolean; items: RoomOverlay[] }>> {
    return dmApi.get(path(auth, "/overlays"), BACKGROUND)
  },

  addOverlay(
    auth: RoomAuth,
    overlay: { kind: OverlayKind; name?: string; payload?: Record<string, unknown>; style?: Record<string, unknown>; visible?: boolean },
  ): Promise<DmApiResult<{ success: boolean; overlay: RoomOverlay }>> {
    return dmApi.post(path(auth, "/overlays"), overlay)
  },

  updateOverlay(
    auth: RoomAuth,
    id: number,
    patch: { name?: string; payload?: Record<string, unknown>; style?: Record<string, unknown>; visible?: boolean; position?: number },
  ): Promise<DmApiResult<{ success: boolean; overlay: RoomOverlay }>> {
    return dmApi.put(path(auth, `/overlays/${id}`), patch)
  },

  removeOverlay(auth: RoomAuth, id: number) {
    return dmApi.delete(path(auth, `/overlays/${id}`))
  },

  updateBroadcast(
    auth: RoomAuth,
    settings: Partial<{ width: number; height: number; fps: number; overlay_render: OverlayRender; show_name_plates: boolean }>,
  ): Promise<DmApiResult<{ success: boolean; broadcast: BroadcastSettings }>> {
    return dmApi.put(path(auth, "/broadcast"), settings)
  },
}

/**
 * Socket URL for the room.
 *
 * The bearer goes in the query string because the WebSocket API gives no way
 * to set a request header. It is the same token the REST calls send, verified
 * by the same code — the transport differs, the trust does not.
 */
export function roomSocketUrl(auth: RoomAuth, bearer: string | null): string {
  const base = API_BASE_URL.replace(/^http/, "ws")
  const params = new URLSearchParams()
  if (bearer) params.set("auth", bearer)
  if (auth.guestName) params.set("name", auth.guestName)
  if (auth.guestKey) params.set("gk", auth.guestKey)
  return `${base}/live-classes/room/${encodeURIComponent(auth.token)}/ws?${params.toString()}`
}

/* ── formatting ─────────────────────────────────────────────────────────── */

/** `10:15 AM` in the viewer's locale, from a SQLite `datetime('now')` string. */
export function clockTime(value: string | null | undefined): string {
  if (!value) return ""
  const iso = value.includes("T") ? value : `${value.replace(" ", "T")}Z`
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
}

/** Seconds since a SQLite timestamp, floored at zero. */
export function secondsSince(value: string | null | undefined): number {
  if (!value) return 0
  const iso = value.includes("T") ? value : `${value.replace(" ", "T")}Z`
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return 0
  return Math.max(0, Math.floor((Date.now() - then) / 1000))
}

/** `01:02:03`, or `02:03` under an hour. */
export function formatDuration(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600)
  const mins = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60
  const pad = (n: number) => String(n).padStart(2, "0")
  return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`
}

/** Initials for an avatar chip — at most two letters. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?"
}

/**
 * A stable colour per person, so the same student is the same colour for
 * everyone in the room and across reloads.
 */
export function avatarTone(seed: string): string {
  const palette = [
    "bg-blue-600",
    "bg-indigo-600",
    "bg-emerald-600",
    "bg-amber-600",
    "bg-rose-600",
    "bg-violet-600",
    "bg-teal-600",
    "bg-cyan-700",
  ]
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return palette[hash % palette.length]
}
