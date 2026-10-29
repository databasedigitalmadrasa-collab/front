"use client"

/**
 * useLiveRoom — one live class, kept in sync.
 *
 * Loads the room in a single request, then keeps it current over a WebSocket:
 * chat, Q&A, presence, materials, announcements and the class's own status all
 * arrive as events and land in one state object.
 *
 * THREE THINGS THIS HANDLES THAT A NAIVE SOCKET DOES NOT
 * -----------------------------------------------------
 *  1. Reconnection. Networks on a phone drop constantly. Each reconnect
 *     backs off, and on success replays `GET /messages?after=<lastId>` so
 *     nothing sent during the gap is missed — which is the whole reason
 *     messages carry monotonic ids.
 *
 *  2. Fallback. School and office networks block WebSocket upgrades. After
 *     repeated failures the hook drops to polling the same endpoints. Chat
 *     gets slower, it does not stop working.
 *
 *  3. Idle tabs. A backgrounded tab is throttled and its socket often dies
 *     without an event; coming back to the tab forces a resync rather than
 *     trusting whatever the socket thinks its state is.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { resolveToken, type Principal } from "@/lib/dm-api"
import {
  EMPTY_STAGE,
  roomApi,
  roomSocketUrl,
  type MessageKind,
  type OverlayKind,
  type PresenceEntry,
  type RoomAnnouncement,
  type RoomAuth,
  type RoomClientMessage,
  type RoomEvent,
  type RoomIdentity,
  type RoomLiveClass,
  type RoomMaterial,
  type RoomMessage,
  type RoomOverlay,
  type StagePatch,
  type StageSnapshot,
  type StageSource,
} from "@/lib/live-room"

export type RoomConnection = "connecting" | "live" | "polling" | "offline"

export interface UseLiveRoomOptions {
  /** Public join token or guest token. Null holds the hook idle. */
  token: string | null
  /** Required on the guest link. */
  guestName?: string
  guestKey?: string
  /** Which stored bearer to hand the socket. */
  principal?: Principal
  /** Skip connecting entirely (e.g. the guest has not named themselves yet). */
  enabled?: boolean
}

export interface LiveRoom {
  loading: boolean
  error: string | null
  errorStatus: number
  connection: RoomConnection

  liveClass: RoomLiveClass | null
  you: RoomIdentity | null
  messages: RoomMessage[]
  chat: RoomMessage[]
  questions: RoomMessage[]
  presence: PresenceEntry[]
  participantCount: number
  materials: RoomMaterial[]
  announcements: RoomAnnouncement[]
  overlays: RoomOverlay[]
  /** Only the ones actually on air, in draw order. */
  liveOverlays: RoomOverlay[]
  stage: StageSnapshot

  send: (kind: MessageKind, body: string) => Promise<string | null>
  answerQuestion: (id: number, answer: string) => Promise<string | null>
  togglePin: (id: number, pinned: boolean) => Promise<string | null>
  removeMessage: (id: number) => Promise<string | null>
  addMaterial: (m: { title: string; url: string; size_label?: string }) => Promise<string | null>
  removeMaterial: (id: number) => Promise<string | null>
  addAnnouncement: (body: string) => Promise<string | null>
  removeAnnouncement: (id: number) => Promise<string | null>
  refresh: () => Promise<void>

  /* ── stage ──────────────────────────────────────────────────────────── */

  addOverlay: (
    overlay: { kind: OverlayKind; name?: string; payload?: Record<string, unknown>; style?: Record<string, unknown>; visible?: boolean },
  ) => Promise<string | null>
  updateOverlay: (
    id: number,
    patch: { name?: string; payload?: Record<string, unknown>; style?: Record<string, unknown>; visible?: boolean; position?: number },
  ) => Promise<string | null>
  removeOverlay: (id: number) => Promise<string | null>

  /** Move the programme. Ignored by the server unless you are the producer. */
  setStage: (patch: StagePatch) => void
  /** Tell the room what this browser is currently offering. */
  publishSources: (sources: StageSource[]) => void
  /** Send one WebRTC signalling payload to one connection id. */
  signal: (to: string, payload: unknown) => boolean

  /**
   * Subscribe to raw room events.
   *
   * The WebRTC layer needs `signal` frames the instant they land and cannot
   * wait for a React state round trip — an ICE candidate that arrives a render
   * late is a candidate that arrives after the answer. Returns an unsubscribe.
   */
  onEvent: (handler: (event: RoomEvent) => void) => () => void
}

/** Reconnect delays. The last value repeats for as long as it keeps failing. */
const BACKOFF_MS = [1000, 2000, 5000, 10000, 15000]
/** Consecutive socket failures before giving up on WebSocket for this session. */
const FALLBACK_AFTER = 3
const POLL_INTERVAL_MS = 4000
/** Below this, a "connection" that died instantly was never really open. */
const STABLE_CONNECTION_MS = 10_000

export function useLiveRoom(opts: UseLiveRoomOptions): LiveRoom {
  const { token, guestName, guestKey, principal = "auto", enabled = true } = opts

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errorStatus, setErrorStatus] = useState(0)
  const [connection, setConnection] = useState<RoomConnection>("connecting")

  const [liveClass, setLiveClass] = useState<RoomLiveClass | null>(null)
  const [you, setYou] = useState<RoomIdentity | null>(null)
  const [messages, setMessages] = useState<RoomMessage[]>([])
  const [presence, setPresence] = useState<PresenceEntry[]>([])
  const [participantCount, setParticipantCount] = useState(0)
  const [materials, setMaterials] = useState<RoomMaterial[]>([])
  const [announcements, setAnnouncements] = useState<RoomAnnouncement[]>([])
  const [overlays, setOverlays] = useState<RoomOverlay[]>([])
  const [stage, setStageState] = useState<StageSnapshot>(EMPTY_STAGE)

  const socketRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const failuresRef = useRef(0)
  const openedAtRef = useRef(0)
  const lastMessageIdRef = useRef(0)
  const closedByUsRef = useRef(false)

  /**
   * Raw event subscribers, held in a ref rather than in state.
   *
   * Adding a subscriber must not re-create the socket effect, and delivering
   * to them must not wait for a render — see `onEvent` on the returned object.
   */
  const listenersRef = useRef(new Set<(event: RoomEvent) => void>())

  /**
   * What this browser last told the room it is offering.
   *
   * Kept so the announcement can be replayed the moment a reconnect finishes:
   * the room stores a publisher's source list in that socket's attachment, so
   * a dropped socket takes the co-host's cameras off the producer's rail even
   * though the camera never stopped running.
   */
  const sourcesRef = useRef<StageSource[]>([])

  const auth: RoomAuth | null = useMemo(
    () => (token ? { token, guestName, guestKey } : null),
    [token, guestName, guestKey],
  )

  /* ── message merging ──────────────────────────────────────────────────── */

  /**
   * Upsert by id and keep the list sorted.
   *
   * Every path — first load, socket event, poll, reconnect replay — funnels
   * through here, so a message that arrives twice (the poll and the socket
   * both carrying it, say) collapses instead of appearing twice.
   */
  const mergeMessages = useCallback((incoming: RoomMessage[]) => {
    if (!incoming.length) return
    setMessages((prev) => {
      const byId = new Map(prev.map((m) => [m.id, m]))
      for (const m of incoming) byId.set(m.id, m)
      const next = [...byId.values()].sort((a, b) => a.id - b.id)
      const highest = next.length ? next[next.length - 1].id : 0
      if (highest > lastMessageIdRef.current) lastMessageIdRef.current = highest
      return next
    })
  }, [])

  const applyEvent = useCallback(
    (event: RoomEvent) => {
      switch (event.t) {
        case "hello":
          setYou(event.you)
          setPresence(event.presence)
          setParticipantCount(event.count)
          if (event.stage) setStageState(event.stage)
          break
        case "presence":
          setPresence(event.presence)
          setParticipantCount(event.count)
          break
        case "message":
        case "message:update":
          mergeMessages([event.message])
          break
        case "message:delete":
          setMessages((prev) => prev.filter((m) => m.id !== event.id))
          break
        case "announcement":
          setAnnouncements((prev) =>
            prev.some((a) => a.id === event.announcement.id) ? prev : [event.announcement, ...prev],
          )
          break
        case "material":
          setMaterials((prev) =>
            prev.some((m) => m.id === event.material.id)
              ? prev.map((m) => (m.id === event.material.id ? event.material : m))
              : [...prev, event.material],
          )
          break
        case "material:delete":
          setMaterials((prev) => prev.filter((m) => m.id !== event.id))
          break
        case "status":
          setLiveClass((prev) =>
            prev
              ? {
                  ...prev,
                  status: event.status,
                  started_at: event.started_at ?? prev.started_at,
                  ended_at: event.ended_at ?? prev.ended_at,
                }
              : prev,
          )
          break
        case "settings":
          setLiveClass((prev) => (prev ? { ...prev, ...event.settings } : prev))
          break
        case "overlay":
          setOverlays((prev) => {
            const next = prev.some((o) => o.id === event.overlay.id)
              ? prev.map((o) => (o.id === event.overlay.id ? event.overlay : o))
              : [...prev, event.overlay]
            return next.sort(byDrawOrder)
          })
          break
        case "overlay:delete":
          setOverlays((prev) => prev.filter((o) => o.id !== event.id))
          break
        case "stage":
          setStageState(event.stage)
          break
        case "signal":
          // Delivered to subscribers only — see `listenersRef` below. Putting
          // an SDP blob into React state would be a re-render per ICE
          // candidate for a value nothing renders.
          break
      }

      // After the reducer, so a subscriber that reads state sees the update
      // it was told about rather than the one before it.
      for (const listener of listenersRef.current) {
        try {
          listener(event)
        } catch {
          // One bad subscriber must not stop the others, and must not take the
          // socket down with it.
        }
      }
    },
    [mergeMessages],
  )

  const onEvent = useCallback((handler: (event: RoomEvent) => void) => {
    listenersRef.current.add(handler)
    return () => {
      listenersRef.current.delete(handler)
    }
  }, [])

  /* ── initial + manual load ────────────────────────────────────────────── */

  const refresh = useCallback(async () => {
    if (!auth) return
    const res = await roomApi.state(auth)

    if (!res.ok || !res.data) {
      setError(res.error || "This live class is not available.")
      setErrorStatus(res.status)
      setLoading(false)
      return
    }

    setError(null)
    setErrorStatus(0)
    setLiveClass(res.data.live_class)
    // Keep the connection id the socket handed us. `resolveRoomAccess` mints a
    // fresh `cid` per request, so taking this response's wholesale would leave
    // the page thinking it is a different connection than the one the room has
    // in its roster — and the stage would then try to open a peer connection
    // to itself.
    setYou((prev) => (prev ? { ...res.data!.you, cid: prev.cid } : res.data!.you))
    setMaterials(res.data.materials ?? [])
    setAnnouncements(res.data.announcements ?? [])
    setPresence(res.data.presence ?? [])
    setParticipantCount(res.data.participant_count ?? 0)
    setOverlays([...(res.data.overlays ?? [])].sort(byDrawOrder))
    // A null stage means the room object was unreachable, not that the stage
    // is empty — keep whatever the socket last delivered rather than blanking
    // a live programme because one HTTP call lost a race.
    if (res.data.stage) setStageState(res.data.stage)

    // Replace rather than merge: this is the authoritative snapshot, and a
    // message deleted while we were away must not survive in local state.
    const loaded = res.data.messages ?? []
    lastMessageIdRef.current = loaded.length ? loaded[loaded.length - 1].id : 0
    setMessages(loaded)
    setLoading(false)
  }, [auth])

  useEffect(() => {
    if (!auth || !enabled) return
    setLoading(true)
    void refresh()
  }, [auth, enabled, refresh])

  /* ── tail: catch up on anything the socket missed ─────────────────────── */

  const catchUp = useCallback(async () => {
    if (!auth) return
    const res = await roomApi.messages(auth, { after: lastMessageIdRef.current })
    if (!res.ok || !res.data) return

    const items = res.data.items ?? []
    // `after` queries include tombstones so a delete that happened during the
    // gap is applied rather than silently missed.
    const deleted = items.filter((m) => m.deleted)
    const alive = items.filter((m) => !m.deleted)

    if (deleted.length) {
      const gone = new Set(deleted.map((m) => m.id))
      setMessages((prev) => prev.filter((m) => !gone.has(m.id)))
      const highest = Math.max(...deleted.map((m) => m.id))
      if (highest > lastMessageIdRef.current) lastMessageIdRef.current = highest
    }
    mergeMessages(alive)
  }, [auth, mergeMessages])

  /* ── socket ───────────────────────────────────────────────────────────── */

  useEffect(() => {
    if (!auth || !enabled || typeof window === "undefined") return

    closedByUsRef.current = false
    let disposed = false

    const clearReconnect = () => {
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current)
        reconnectRef.current = null
      }
    }

    const scheduleReconnect = () => {
      if (disposed || closedByUsRef.current) return

      if (failuresRef.current >= FALLBACK_AFTER) {
        // The upgrade is not getting through this network. Stop retrying it
        // every few seconds and let the poller carry the room.
        setConnection("polling")
        return
      }

      const delay = BACKOFF_MS[Math.min(failuresRef.current, BACKOFF_MS.length - 1)]
      clearReconnect()
      reconnectRef.current = setTimeout(connect, delay)
    }

    function connect() {
      if (disposed || !auth) return
      setConnection((c) => (c === "polling" ? c : "connecting"))

      let socket: WebSocket
      try {
        socket = new WebSocket(roomSocketUrl(auth, resolveToken(principal)))
      } catch {
        failuresRef.current += 1
        scheduleReconnect()
        return
      }

      socketRef.current = socket

      socket.onopen = () => {
        openedAtRef.current = Date.now()
        setConnection("live")
        // Anything that happened between the snapshot and this socket opening.
        void catchUp()

        // The room keeps a publisher's source list in the socket attachment,
        // so a reconnect starts with an empty one even though the camera has
        // been running the whole time. Re-announce, or the producer's rail
        // loses a co-host who never actually went away.
        if (sourcesRef.current.length) {
          try {
            socket.send(JSON.stringify({ t: "sources", sources: sourcesRef.current }))
          } catch {
            // The close handler will schedule a reconnect.
          }
        }
      }

      socket.onmessage = (event) => {
        try {
          applyEvent(JSON.parse(event.data as string) as RoomEvent)
        } catch {
          // A frame we cannot parse is a frame from a newer server. Ignore it
          // rather than tearing down a working connection.
        }
      }

      socket.onclose = () => {
        if (socketRef.current === socket) socketRef.current = null
        if (disposed || closedByUsRef.current) return

        // A socket that survived a while and then dropped is a network blip,
        // not a blocked upgrade — reset the budget so one bad hour does not
        // permanently demote a viewer to polling.
        if (Date.now() - openedAtRef.current > STABLE_CONNECTION_MS) failuresRef.current = 0
        else failuresRef.current += 1

        setConnection((c) => (c === "polling" ? c : "offline"))
        scheduleReconnect()
      }

      socket.onerror = () => {
        // onclose always follows; counting here too would double the penalty.
      }
    }

    connect()

    return () => {
      disposed = true
      closedByUsRef.current = true
      clearReconnect()
      socketRef.current?.close()
      socketRef.current = null
    }
  }, [auth, enabled, principal, applyEvent, catchUp])

  /* ── polling fallback ─────────────────────────────────────────────────── */

  useEffect(() => {
    if (!auth || !enabled || connection !== "polling") return

    const tick = async () => {
      await catchUp()
      const res = await roomApi.participants(auth)
      if (res.ok && res.data) {
        setPresence(res.data.presence ?? [])
        setParticipantCount(res.data.count ?? 0)
      }
    }

    void tick()
    const interval = setInterval(tick, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [auth, enabled, connection, catchUp])

  /* ── resync when the tab comes back ───────────────────────────────────── */

  useEffect(() => {
    if (!auth || !enabled) return

    const onVisible = () => {
      if (document.visibilityState !== "visible") return
      void catchUp()
      // A throttled tab's socket often dies without firing onclose; if it is
      // not actually open, force the reconnect the close handler never ran.
      const socket = socketRef.current
      if (!socket || socket.readyState > WebSocket.OPEN) setConnection((c) => (c === "polling" ? c : "offline"))
    }

    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("online", onVisible)
    return () => {
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("online", onVisible)
    }
  }, [auth, enabled, catchUp])

  /* ── actions ──────────────────────────────────────────────────────────── */

  /**
   * Every action returns an error string or null.
   *
   * They deliberately do not write to local state on success: the room echoes
   * the change back over the socket, and applying it twice is how duplicate
   * chat lines happen. When the socket is down, `catchUp` picks it up on the
   * next poll.
   */
  const send = useCallback(
    async (kind: MessageKind, body: string): Promise<string | null> => {
      if (!auth) return "Not connected"
      const res = await roomApi.send(auth, kind, body)
      if (!res.ok) return res.error || "Message could not be sent."
      if (res.data?.message) mergeMessages([res.data.message])
      return null
    },
    [auth, mergeMessages],
  )

  const answerQuestion = useCallback(
    async (id: number, answer: string) => {
      if (!auth) return "Not connected"
      const res = await roomApi.answer(auth, id, answer)
      if (!res.ok) return res.error || "Could not post the answer."
      if (res.data?.message) mergeMessages([res.data.message])
      return null
    },
    [auth, mergeMessages],
  )

  const togglePin = useCallback(
    async (id: number, pinned: boolean) => {
      if (!auth) return "Not connected"
      const res = await roomApi.pin(auth, id, pinned)
      return res.ok ? null : res.error || "Could not update the question."
    },
    [auth],
  )

  const removeMessage = useCallback(
    async (id: number) => {
      if (!auth) return "Not connected"
      const res = await roomApi.remove(auth, id)
      if (!res.ok) return res.error || "Could not remove the message."
      setMessages((prev) => prev.filter((m) => m.id !== id))
      return null
    },
    [auth],
  )

  const addMaterial = useCallback(
    async (m: { title: string; url: string; size_label?: string }) => {
      if (!auth) return "Not connected"
      const res = await roomApi.addMaterial(auth, m)
      if (!res.ok) return res.error || "Could not add the material."
      if (res.data?.material) applyEvent({ t: "material", material: res.data.material })
      return null
    },
    [auth, applyEvent],
  )

  const removeMaterial = useCallback(
    async (id: number) => {
      if (!auth) return "Not connected"
      const res = await roomApi.removeMaterial(auth, id)
      if (!res.ok) return res.error || "Could not remove the material."
      setMaterials((prev) => prev.filter((m) => m.id !== id))
      return null
    },
    [auth],
  )

  const addAnnouncement = useCallback(
    async (body: string) => {
      if (!auth) return "Not connected"
      const res = await roomApi.addAnnouncement(auth, body)
      if (!res.ok) return res.error || "Could not send the announcement."
      if (res.data?.announcement) {
        applyEvent({ t: "announcement", announcement: res.data.announcement })
      }
      return null
    },
    [auth, applyEvent],
  )

  const removeAnnouncement = useCallback(
    async (id: number) => {
      if (!auth) return "Not connected"
      const res = await roomApi.removeAnnouncement(auth, id)
      if (!res.ok) return res.error || "Could not remove the announcement."
      setAnnouncements((prev) => prev.filter((a) => a.id !== id))
      return null
    },
    [auth],
  )

  /* ── socket writes ────────────────────────────────────────────────────── */

  /**
   * The one thing clients send up the socket.
   *
   * Chat and moderation stay on HTTP, where the auth and the rate limits live.
   * Signalling and stage control go here because they are a conversation
   * between browsers that has to complete in a few hundred milliseconds, and
   * because the room reads the sender's identity from the socket rather than
   * from the message — see src/durable/live-room.ts.
   */
  const sendSocket = useCallback((message: RoomClientMessage): boolean => {
    const socket = socketRef.current
    if (!socket || socket.readyState !== WebSocket.OPEN) return false
    try {
      socket.send(JSON.stringify(message))
      return true
    } catch {
      return false
    }
  }, [])

  const signal = useCallback(
    (to: string, payload: unknown) => sendSocket({ t: "signal", to, payload }),
    [sendSocket],
  )

  const publishSources = useCallback(
    (sources: StageSource[]) => {
      sourcesRef.current = sources
      sendSocket({ t: "sources", sources })
    },
    [sendSocket],
  )

  const setStage = useCallback(
    (patch: StagePatch) => {
      // Optimistic: the producer clicking a layout should see it move now, and
      // the room echoes the authoritative version back within the frame.
      setStageState((prev) => ({ ...prev, ...patch }))
      sendSocket({ t: "stage:set", patch })
    },
    [sendSocket],
  )

  /* ── overlays ─────────────────────────────────────────────────────────── */

  const addOverlay = useCallback(
    async (overlay: Parameters<LiveRoom["addOverlay"]>[0]) => {
      if (!auth) return "Not connected"
      const res = await roomApi.addOverlay(auth, overlay)
      if (!res.ok) return res.error || "Could not add the overlay."
      if (res.data?.overlay) applyEvent({ t: "overlay", overlay: res.data.overlay })
      return null
    },
    [auth, applyEvent],
  )

  const updateOverlay = useCallback(
    async (id: number, patch: Parameters<LiveRoom["updateOverlay"]>[1]) => {
      if (!auth) return "Not connected"
      const res = await roomApi.updateOverlay(auth, id, patch)
      if (!res.ok) return res.error || "Could not update the overlay."
      if (res.data?.overlay) applyEvent({ t: "overlay", overlay: res.data.overlay })
      return null
    },
    [auth, applyEvent],
  )

  const removeOverlay = useCallback(
    async (id: number) => {
      if (!auth) return "Not connected"
      const res = await roomApi.removeOverlay(auth, id)
      if (!res.ok) return res.error || "Could not remove the overlay."
      setOverlays((prev) => prev.filter((o) => o.id !== id))
      return null
    },
    [auth],
  )

  /* ── derived ──────────────────────────────────────────────────────────── */

  const liveOverlays = useMemo(() => overlays.filter((o) => o.visible), [overlays])

  const chat = useMemo(() => messages.filter((m) => m.kind === "chat" && !m.deleted), [messages])

  const questions = useMemo(() => {
    // Pinned first, then unanswered, then newest — the order a host works in.
    return messages
      .filter((m) => m.kind === "question" && !m.deleted)
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return b.pinned - a.pinned
        if (a.answered !== b.answered) return a.answered - b.answered
        return b.id - a.id
      })
  }, [messages])

  return {
    loading,
    error,
    errorStatus,
    connection,
    liveClass,
    you,
    messages,
    chat,
    questions,
    presence,
    participantCount,
    materials,
    announcements,
    overlays,
    liveOverlays,
    stage,
    send,
    answerQuestion,
    togglePin,
    removeMessage,
    addMaterial,
    removeMaterial,
    addAnnouncement,
    removeAnnouncement,
    refresh,
    addOverlay,
    updateOverlay,
    removeOverlay,
    setStage,
    publishSources,
    signal,
    onEvent,
  }
}

/**
 * Draw order: `position` low to high, id as the tie-break.
 *
 * Stable ordering matters more than it looks. The compositor paints in list
 * order, so an unstable sort means a logo that is behind the ticker on the
 * host's screen and in front of it in the broadcast.
 */
function byDrawOrder(a: RoomOverlay, b: RoomOverlay): number {
  return a.position !== b.position ? a.position - b.position : a.id - b.id
}
