"use client"

/**
 * useStageRtc — how a co-host's camera reaches the broadcast.
 *
 * TOPOLOGY: A STAR, NOT A MESH
 * ----------------------------
 * Every publisher connects to exactly one peer: the producer, which is the
 * host's studio. Nobody connects to anybody else.
 *
 * A mesh is the obvious first design and the wrong one here. Only one browser
 * needs everyone's media — the one compositing the picture that goes up the
 * WHIP pipe — so a mesh would have five co-hosts each encoding four extra
 * outbound streams to produce a view nobody watches. The star costs each
 * contributor one upload, which is exactly what they would spend streaming
 * alone.
 *
 * The producer sends a feed back down the same connection: the composited
 * programme, so a co-host sees precisely what the class sees, and a *per-peer*
 * audio mix with their own microphone removed. That mix-minus is not a nicety.
 * Send a co-host an audio mix containing their own voice and they hear
 * themselves a few hundred milliseconds late, which is the single most
 * disorienting thing you can do to someone trying to speak.
 *
 * NEGOTIATION: ONE OFFERER, ALWAYS
 * --------------------------------
 * The contributor offers and the producer only ever answers. That removes
 * glare entirely — no polite/impolite dance, no rollback — and it falls out of
 * the roles: the contributor is the side that knows how many tracks it has, so
 * it is the side that can build a complete offer. When a co-host adds a screen
 * share mid-class, they re-offer; the producer answers again and nothing else
 * on the stage notices.
 *
 * Which transceiver carries what is stated explicitly in a `map` sent
 * alongside the SDP, keyed by mid. The alternative — inferring it from track
 * order or from `track.label` — breaks the moment somebody has two cameras,
 * and breaks silently, by putting the document camera where the face was.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { roomApi, type RoomAuth, type RoomEvent, type StagePeer } from "@/lib/live-room"
import type { LocalSource } from "@/hooks/use-media-sources"

/* ── wire ───────────────────────────────────────────────────────────────── */

interface MidEntry {
  /** `publish` flows contributor → producer; `program` flows the other way. */
  purpose: "publish" | "program"
  kind: "video" | "audio"
  /** Set for `publish` video, so the producer can label what arrives. */
  sourceId?: string
}

type SignalPayload =
  | { kind: "offer"; sdp: string; map: Record<string, MidEntry> }
  | { kind: "answer"; sdp: string }
  | { kind: "candidate"; candidate: RTCIceCandidateInit }
  | { kind: "bye" }

/* ── public shape ───────────────────────────────────────────────────────── */

export interface StageRtcOptions {
  enabled: boolean
  /** True in the host studio: receive from everyone, send the programme back. */
  producer: boolean
  /** The room's current stage, for the peer list. */
  peers: StagePeer[]
  /** This browser's connection id, so it can leave itself out. */
  selfCid: string | null
  auth: RoomAuth | null
  signal: (to: string, payload: unknown) => boolean
  onEvent: (handler: (event: RoomEvent) => void) => () => void

  /** Contributor: what to publish. */
  localSources?: LocalSource[]
  micTrack?: MediaStreamTrack | null

  /** Producer: the programme feed for one contributor. */
  getReturnTracks?: (peerCid: string) => {
    video: MediaStreamTrack | null
    audio: MediaStreamTrack | null
  }
}

export interface StageRtc {
  /** Producer: remote source id → a one-track stream ready to draw. */
  remoteVideo: Map<string, MediaStream>
  /** Producer: contributor cid → their microphone, for the audio mix. */
  remoteAudio: Map<string, MediaStreamTrack>
  /** Contributor: the composited programme coming back from the studio. */
  programStream: MediaStream | null
  /** Peer cid → connection state, for the studio's per-guest badge. */
  peerStates: Record<string, RTCPeerConnectionState>
  relayAvailable: boolean
  error: string | null
  /** Producer: re-attach the programme tracks after the compositor restarts. */
  refreshReturnTracks: () => void
}

/* ── internals ──────────────────────────────────────────────────────────── */

interface PeerCtx {
  pc: RTCPeerConnection
  /** mid → what that transceiver is for, as declared in the offer. */
  map: Map<string, MidEntry>
  /** Candidates that arrived before the description they belong to. */
  pending: RTCIceCandidateInit[]
  /** Contributor only: source id → the transceiver publishing it. */
  senders: Map<string, RTCRtpTransceiver>
  micSender: RTCRtpTransceiver | null
  negotiating: boolean
  /** A source changed while an offer was still in flight. */
  renegotiate: boolean
}

const FALLBACK_ICE: RTCIceServer[] = [{ urls: "stun:stun.cloudflare.com:3478" }]

export function useStageRtc(opts: StageRtcOptions): StageRtc {
  const {
    enabled,
    producer,
    peers,
    selfCid,
    auth,
    signal,
    onEvent,
    localSources = [],
    micTrack = null,
    getReturnTracks,
  } = opts

  const [remoteVideo, setRemoteVideo] = useState<Map<string, MediaStream>>(new Map())
  const [remoteAudio, setRemoteAudio] = useState<Map<string, MediaStreamTrack>>(new Map())
  const [programStream, setProgramStream] = useState<MediaStream | null>(null)
  const [peerStates, setPeerStates] = useState<Record<string, RTCPeerConnectionState>>({})
  const [relayAvailable, setRelayAvailable] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** Bumped when a connection fails, to make the peer effect rebuild it. */
  const [retry, setRetry] = useState(0)

  const peersRef = useRef<Map<string, PeerCtx>>(new Map())
  const iceRef = useRef<RTCIceServer[]>(FALLBACK_ICE)

  // Read inside callbacks that must not be re-created per render — a signalling
  // handler that changes identity every frame would be torn down and rebuilt
  // in the middle of a negotiation.
  const localSourcesRef = useRef<LocalSource[]>(localSources)
  localSourcesRef.current = localSources
  const micTrackRef = useRef<MediaStreamTrack | null>(micTrack)
  micTrackRef.current = micTrack
  const returnRef = useRef(getReturnTracks)
  returnRef.current = getReturnTracks
  const signalRef = useRef(signal)
  signalRef.current = signal

  /* ── ICE servers ──────────────────────────────────────────────────────── */

  useEffect(() => {
    if (!enabled || !auth) return
    let cancelled = false

    void roomApi.ice(auth).then((res) => {
      if (cancelled) return
      if (res.ok && res.data?.ice_servers?.length) {
        iceRef.current = res.data.ice_servers
        setRelayAvailable(!!res.data.relay_available)
      } else {
        // STUN-only still connects for most people; it is the ones behind
        // symmetric NAT who silently never appear, so the studio says so.
        iceRef.current = FALLBACK_ICE
        setRelayAvailable(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [enabled, auth])

  /* ── peer plumbing ────────────────────────────────────────────────────── */

  const dropPeer = useCallback((cid: string) => {
    const ctx = peersRef.current.get(cid)
    if (!ctx) return
    peersRef.current.delete(cid)

    try {
      ctx.pc.close()
    } catch {
      // Already closed; nothing to do.
    }

    setPeerStates((prev) => {
      const next = { ...prev }
      delete next[cid]
      return next
    })

    // Everything this peer was putting on screen goes with them.
    setRemoteVideo((prev) => {
      const next = new Map(prev)
      for (const [sourceId, _stream] of prev) {
        if (sourceId.startsWith(`${cid}:`)) next.delete(sourceId)
      }
      for (const [mid, entry] of ctx.map) {
        void mid
        if (entry.sourceId) next.delete(entry.sourceId)
      }
      return next
    })
    setRemoteAudio((prev) => {
      const next = new Map(prev)
      next.delete(cid)
      return next
    })
  }, [])

  const createPeer = useCallback(
    (cid: string): PeerCtx => {
      const pc = new RTCPeerConnection({
        iceServers: iceRef.current,
        bundlePolicy: "max-bundle",
        // Everything rides one transport, which is what makes a single ICE
        // negotiation enough for four cameras plus a screen plus the return.
        rtcpMuxPolicy: "require",
      })

      const ctx: PeerCtx = {
        pc,
        map: new Map(),
        pending: [],
        senders: new Map(),
        micSender: null,
        negotiating: false,
        renegotiate: false,
      }
      peersRef.current.set(cid, ctx)

      pc.onicecandidate = (event) => {
        if (!event.candidate) return
        // Trickle: we have a socket, so there is no reason to sit on
        // candidates until gathering completes the way a bare WHIP POST must.
        signalRef.current(cid, { kind: "candidate", candidate: event.candidate.toJSON() })
      }

      pc.onconnectionstatechange = () => {
        setPeerStates((prev) => ({ ...prev, [cid]: pc.connectionState }))
        if (pc.connectionState === "failed") {
          // A failed transport does not recover on its own. Tearing it down
          // and bumping the retry counter is what rebuilds it: the peer list
          // has not changed, so nothing else would ever ask for a new
          // connection, and the co-host would sit there looking connected on
          // their own screen and absent on the host's.
          dropPeer(cid)
          setRetry((n) => n + 1)
        }
      }

      pc.ontrack = (event) => {
        const mid = event.transceiver.mid ?? ""
        const entry = ctx.map.get(mid)
        const track = event.track

        if (producer) {
          if (track.kind === "audio") {
            setRemoteAudio((prev) => new Map(prev).set(cid, track))
            return
          }
          // A video track whose mid we cannot place is a track we would draw
          // in the wrong tile. Give it a deterministic id instead of guessing.
          const sourceId = entry?.sourceId || `${cid}:${mid || track.id}`
          setRemoteVideo((prev) => new Map(prev).set(sourceId, new MediaStream([track])))
          return
        }

        // Contributor: everything arriving is the programme return feed.
        setProgramStream((prev) => {
          const stream = prev ?? new MediaStream()
          stream.getTracks().filter((t) => t.kind === track.kind).forEach((t) => stream.removeTrack(t))
          stream.addTrack(track)
          // A new object each time, or React sees the same reference and the
          // <video> never re-binds.
          return new MediaStream(stream.getTracks())
        })
      }

      return ctx
    },
    [producer, dropPeer],
  )

  /* ── contributor: build and send the offer ────────────────────────────── */

  /**
   * Reconcile transceivers against the current source list, then offer.
   *
   * Transceivers are reused rather than recreated: a source that is removed
   * has its track replaced with null and its direction set inactive, so the
   * m-line stays in place. Removing m-lines renumbers mids, which invalidates
   * the map the producer is holding for every *other* source on the same
   * connection.
   */
  const negotiate = useCallback(
    async (cid: string) => {
      const ctx = peersRef.current.get(cid)
      if (!ctx || ctx.negotiating) return

      // An offer is already out and its answer has not arrived. Offering again
      // now would leave the far end answering a description we have already
      // replaced. Remember that something changed and re-run once the answer
      // puts us back in `stable`.
      if (ctx.pc.signalingState !== "stable") {
        ctx.renegotiate = true
        return
      }

      ctx.negotiating = true

      try {
        const pc = ctx.pc
        const sources = localSourcesRef.current
        const map = new Map<string, MidEntry>()

        for (const source of sources) {
          const track = source.stream.getVideoTracks()[0]
          if (!track) continue

          let transceiver = ctx.senders.get(source.id)
          if (!transceiver) {
            transceiver = pc.addTransceiver(track, { direction: "sendonly" })
            ctx.senders.set(source.id, transceiver)
          } else {
            transceiver.direction = "sendonly"
            if (transceiver.sender.track !== track) {
              await transceiver.sender.replaceTrack(track).catch(() => undefined)
            }
          }
        }

        // Sources that have gone away keep their m-line but stop sending.
        for (const [sourceId, transceiver] of ctx.senders) {
          if (sources.some((s) => s.id === sourceId)) continue
          transceiver.direction = "inactive"
          await transceiver.sender.replaceTrack(null).catch(() => undefined)
        }

        const mic = micTrackRef.current
        if (mic) {
          if (!ctx.micSender) {
            ctx.micSender = pc.addTransceiver(mic, { direction: "sendonly" })
          } else if (ctx.micSender.sender.track !== mic) {
            ctx.micSender.direction = "sendonly"
            await ctx.micSender.sender.replaceTrack(mic).catch(() => undefined)
          }
        }

        // The two return-feed slots, created once and never removed.
        if (!pc.getTransceivers().some((t) => t.direction === "recvonly")) {
          pc.addTransceiver("video", { direction: "recvonly" })
          pc.addTransceiver("audio", { direction: "recvonly" })
        }

        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)

        // mids only exist after setLocalDescription, which is why the map is
        // built here rather than while the transceivers were being added.
        for (const [sourceId, transceiver] of ctx.senders) {
          if (transceiver.mid) map.set(transceiver.mid, { purpose: "publish", kind: "video", sourceId })
        }
        if (ctx.micSender?.mid) {
          map.set(ctx.micSender.mid, { purpose: "publish", kind: "audio" })
        }
        for (const transceiver of pc.getTransceivers()) {
          if (transceiver.direction !== "recvonly" || !transceiver.mid) continue
          map.set(transceiver.mid, {
            purpose: "program",
            kind: transceiver.receiver.track?.kind === "audio" ? "audio" : "video",
          })
        }

        ctx.map = map
        signalRef.current(cid, {
          kind: "offer",
          sdp: pc.localDescription?.sdp ?? offer.sdp ?? "",
          map: Object.fromEntries(map),
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not reach the host studio.")
      } finally {
        ctx.negotiating = false
      }
    },
    [],
  )

  /* ── producer: answer ─────────────────────────────────────────────────── */

  const answer = useCallback(
    async (cid: string, payload: Extract<SignalPayload, { kind: "offer" }>) => {
      let ctx = peersRef.current.get(cid)
      if (!ctx) ctx = createPeer(cid)

      const pc = ctx.pc

      // The map goes in before the description, because `ontrack` fires
      // *during* setRemoteDescription and needs it to label what arrives.
      ctx.map = new Map(Object.entries(payload.map ?? {}))

      try {
        await pc.setRemoteDescription({ type: "offer", sdp: payload.sdp })

        // Attach the programme feed to the slots the contributor left for it.
        const tracks = returnRef.current?.(cid) ?? { video: null, audio: null }
        for (const transceiver of pc.getTransceivers()) {
          const entry = transceiver.mid ? ctx.map.get(transceiver.mid) : undefined
          if (entry?.purpose !== "program") continue

          const track = entry.kind === "audio" ? tracks.audio : tracks.video
          transceiver.direction = track ? "sendonly" : "inactive"
          if (track) await transceiver.sender.replaceTrack(track).catch(() => undefined)
        }

        await pc.setLocalDescription(await pc.createAnswer())
        signalRef.current(cid, { kind: "answer", sdp: pc.localDescription?.sdp ?? "" })

        for (const candidate of ctx.pending.splice(0)) {
          await pc.addIceCandidate(candidate).catch(() => undefined)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not accept the co-host's connection.")
      }
    },
    [createPeer],
  )

  /* ── signalling ───────────────────────────────────────────────────────── */

  useEffect(() => {
    if (!enabled) return

    return onEvent((event) => {
      if (event.t !== "signal") return
      const cid = event.from
      const payload = event.payload as SignalPayload
      if (!payload?.kind) return

      void (async () => {
        if (payload.kind === "offer") {
          if (!producer) return
          await answer(cid, payload)
          return
        }

        const ctx = peersRef.current.get(cid)
        if (!ctx) return

        if (payload.kind === "answer") {
          await ctx.pc
            .setRemoteDescription({ type: "answer", sdp: payload.sdp })
            .catch(() => undefined)
          for (const candidate of ctx.pending.splice(0)) {
            await ctx.pc.addIceCandidate(candidate).catch(() => undefined)
          }
          // A camera added while this offer was in flight has been waiting for
          // exactly this moment.
          if (ctx.renegotiate) {
            ctx.renegotiate = false
            await negotiate(cid)
          }
          return
        }

        if (payload.kind === "candidate") {
          // A candidate can legitimately beat its own description through the
          // room, so hold it rather than throwing it away.
          if (!ctx.pc.remoteDescription) ctx.pending.push(payload.candidate)
          else await ctx.pc.addIceCandidate(payload.candidate).catch(() => undefined)
          return
        }

        if (payload.kind === "bye") dropPeer(cid)
      })()
    })
  }, [enabled, producer, onEvent, answer, dropPeer, negotiate])

  /* ── who we should be connected to ────────────────────────────────────── */

  /**
   * The producer, as everyone agrees on it.
   *
   * Two admins opening the studio at once both look like producers. Sorting by
   * connection id gives every contributor the same answer without a round of
   * negotiation about it, so they all land on one mixer rather than splitting
   * between two.
   */
  const producerCid = useMemo(() => {
    const candidates = peers.filter((p) => p.producer).map((p) => p.cid).sort()
    return candidates[0] ?? null
  }, [peers])

  const contributorCids = useMemo(
    () =>
      peers
        .filter((p) => !p.producer && p.cid !== selfCid)
        .map((p) => p.cid)
        .sort()
        .join(","),
    [peers, selfCid],
  )

  useEffect(() => {
    if (!enabled) return

    if (producer) {
      const wanted = contributorCids ? contributorCids.split(",") : []
      // Someone whose socket dropped is gone even if their camera never
      // stopped; the room removed them from the peer list, and holding their
      // dead peer connection open only wastes a relay allocation.
      for (const cid of [...peersRef.current.keys()]) {
        if (!wanted.includes(cid)) dropPeer(cid)
      }
      // The producer never offers, so there is nothing to start here — a
      // contributor's offer creates the connection when it arrives.
      return
    }

    if (!producerCid) {
      for (const cid of [...peersRef.current.keys()]) dropPeer(cid)
      return
    }

    for (const cid of [...peersRef.current.keys()]) {
      if (cid !== producerCid) dropPeer(cid)
    }

    if (!peersRef.current.has(producerCid)) createPeer(producerCid)
    void negotiate(producerCid)
  }, [enabled, producer, producerCid, contributorCids, retry, createPeer, dropPeer, negotiate])

  /* ── contributor: renegotiate when the source list changes ────────────── */

  const sourceSignature = useMemo(
    () => localSources.map((s) => s.id).join(",") + `|${micTrack?.id ?? ""}`,
    [localSources, micTrack],
  )

  useEffect(() => {
    if (!enabled || producer || !producerCid) return
    if (!peersRef.current.has(producerCid)) return
    void negotiate(producerCid)
  }, [enabled, producer, producerCid, sourceSignature, negotiate])

  /* ── producer: re-attach the programme after a compositor restart ─────── */

  const refreshReturnTracks = useCallback(() => {
    if (!producer) return
    for (const [cid, ctx] of peersRef.current) {
      const tracks = returnRef.current?.(cid) ?? { video: null, audio: null }
      for (const transceiver of ctx.pc.getTransceivers()) {
        const entry = transceiver.mid ? ctx.map.get(transceiver.mid) : undefined
        if (entry?.purpose !== "program") continue
        const track = entry.kind === "audio" ? tracks.audio : tracks.video
        if (track && transceiver.sender.track !== track) {
          void transceiver.sender.replaceTrack(track).catch(() => undefined)
        }
      }
    }
  }, [producer])

  /* ── teardown ─────────────────────────────────────────────────────────── */

  useEffect(() => {
    if (enabled) return
    for (const cid of [...peersRef.current.keys()]) dropPeer(cid)
  }, [enabled, dropPeer])

  useEffect(() => {
    const open = peersRef.current
    return () => {
      for (const [cid, ctx] of open) {
        // Best effort: tell the far end rather than leaving them staring at a
        // frozen tile until ICE times out.
        signalRef.current(cid, { kind: "bye" })
        try {
          ctx.pc.close()
        } catch {
          // Already gone.
        }
      }
      open.clear()
    }
  }, [])

  return {
    remoteVideo,
    remoteAudio,
    programStream,
    peerStates,
    relayAvailable,
    error,
    refreshReturnTracks,
  }
}
