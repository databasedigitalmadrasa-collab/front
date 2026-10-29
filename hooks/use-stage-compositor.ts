"use client"

/**
 * useStageCompositor — the mixer.
 *
 * Takes every source on the stage (this browser's cameras and screens, plus
 * whatever the co-hosts are sending over WebRTC), draws them into one canvas
 * under the current layout and overlays, mixes the audio, and hands back a
 * single `MediaStream`. That stream is what `useWhipBroadcast` publishes.
 *
 * This exists because a Cloudflare Stream live input takes one publisher.
 * Everything about multi-host — the layouts, the spotlight, the overlays being
 * burned in rather than drawn on the student's page — follows from that one
 * constraint, and this is where it is resolved.
 *
 * TWO THINGS THAT ARE EASY TO GET WRONG AND EXPENSIVE TO DEBUG
 * -----------------------------------------------------------
 * 1. The frame clock is not `requestAnimationFrame`. rAF stops in a
 *    backgrounded tab, so a host who switched to their notes would freeze the
 *    broadcast on the last frame — silently, since their own preview resumes
 *    the moment they look at it. `setInterval` fares no better: background
 *    tabs clamp it to roughly one second. The clock therefore ticks in a Web
 *    Worker, which is not throttled, and the main thread only draws.
 *
 * 2. Audio is mix-minus, per peer. Everyone hears everyone else and nobody
 *    hears themselves. Sending a co-host the same programme mix the audience
 *    gets would return their own voice a few hundred milliseconds late, which
 *    makes it physically difficult to keep speaking. One extra
 *    `MediaStreamAudioDestinationNode` per co-host buys that outright.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { computeStageLayout, type StageTile } from "@/lib/live-stage"
import { drawStage, ImageCache, type DrawableSource } from "@/lib/live-compositor"
import type { RoomOverlay, StageSnapshot } from "@/lib/live-room"

export interface CompositorSource {
  id: string
  kind: "camera" | "screen" | "media"
  label: string
  stream: MediaStream
  /** Connection id of the co-host this came from; null when it is local. */
  peerCid: string | null
  /** False while the publisher has the camera paused. */
  live: boolean
}

export interface StageCompositorOptions {
  width: number
  height: number
  fps: number
  showNamePlates: boolean
  stage: StageSnapshot
  overlays: RoomOverlay[]
  sources: CompositorSource[]
  /** This browser's microphone. */
  micTrack: MediaStreamTrack | null
  /** Co-host cid → their microphone, from `useStageRtc`. */
  remoteAudio: Map<string, MediaStreamTrack>
}

export interface StageCompositor {
  canvasRef: (el: HTMLCanvasElement | null) => void
  programStream: MediaStream | null
  running: boolean
  /** Frames actually delivered in the last second. */
  actualFps: number
  error: string | null
  /** The tiles as drawn, so the studio can put click targets over them. */
  tiles: StageTile[]
  /** Source ids currently on the programme, resolved from the stage. */
  onStageIds: string[]
  start: () => Promise<boolean>
  stop: () => void
  /** The programme feed for one co-host, with their own microphone removed. */
  getReturnTracks: (peerCid: string) => {
    video: MediaStreamTrack | null
    audio: MediaStreamTrack | null
  }
}

/* ── an unthrottled frame clock ─────────────────────────────────────────── */

/**
 * A timer that keeps running when the tab is in the background.
 *
 * Worker timers are exempt from the throttling that clamps a background tab's
 * `setInterval` to about 1Hz, and posting a message wakes the main thread to
 * draw. The `setInterval` fallback is for the rare environment with no Worker
 * or a CSP that forbids blob workers — there the broadcast degrades to a slide
 * show while backgrounded rather than stopping, which is the best available.
 */
function createTicker(intervalMs: number, onTick: () => void): () => void {
  if (typeof Worker !== "undefined" && typeof Blob !== "undefined") {
    try {
      const source = `let h=null;onmessage=e=>{if(e.data.stop){clearInterval(h);h=null;close();return}clearInterval(h);h=setInterval(()=>postMessage(0),e.data.interval)}`
      const url = URL.createObjectURL(new Blob([source], { type: "text/javascript" }))
      const worker = new Worker(url)
      worker.onmessage = onTick
      worker.postMessage({ interval: intervalMs })
      return () => {
        worker.postMessage({ stop: true })
        worker.terminate()
        URL.revokeObjectURL(url)
      }
    } catch {
      // Fall through to the timer below.
    }
  }

  const handle = setInterval(onTick, intervalMs)
  return () => clearInterval(handle)
}

/* ── audio graph ────────────────────────────────────────────────────────── */

interface AudioInput {
  /** Who this audio belongs to: a co-host's cid, or "self". */
  owner: string
  trackId: string
  node: MediaStreamAudioSourceNode
  gain: GainNode
}

export function useStageCompositor(opts: StageCompositorOptions): StageCompositor {
  const { width, height, fps, showNamePlates, stage, overlays, sources, micTrack, remoteAudio } = opts

  const [running, setRunning] = useState(false)
  const [programStream, setProgramStream] = useState<MediaStream | null>(null)
  const [actualFps, setActualFps] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [tiles, setTiles] = useState<StageTile[]>([])

  const canvasElRef = useRef<HTMLCanvasElement | null>(null)
  const stopTickerRef = useRef<(() => void) | null>(null)
  const startedAtRef = useRef(0)
  const frameCountRef = useRef(0)
  const fpsWindowRef = useRef(0)

  /** Hidden <video> elements, one per source, holding the decoded frames. */
  const videosRef = useRef<Map<string, HTMLVideoElement>>(new Map())
  const videoHostRef = useRef<HTMLDivElement | null>(null)
  const imagesRef = useRef(new ImageCache())

  const audioCtxRef = useRef<AudioContext | null>(null)
  const programDestRef = useRef<MediaStreamAudioDestinationNode | null>(null)
  const peerDestsRef = useRef<Map<string, MediaStreamAudioDestinationNode>>(new Map())
  const inputsRef = useRef<Map<string, AudioInput>>(new Map())
  const canvasTrackRef = useRef<MediaStreamTrack | null>(null)

  // Read inside the frame loop, which must not be re-created per render.
  const stateRef = useRef({ stage, overlays, sources, showNamePlates, width, height, remoteAudio, micTrack })
  stateRef.current = { stage, overlays, sources, showNamePlates, width, height, remoteAudio, micTrack }

  const canvasRef = useCallback((el: HTMLCanvasElement | null) => {
    canvasElRef.current = el
    if (el) {
      el.width = stateRef.current.width
      el.height = stateRef.current.height
    }
  }, [])

  /* ── hidden video elements ────────────────────────────────────────────── */

  /**
   * A `<video>` that is not in the document does not reliably decode on Safari,
   * so they live in a 1px, fully transparent container rather than nowhere.
   * `playsInline` keeps iOS from taking the stream fullscreen.
   */
  const ensureVideoHost = useCallback((): HTMLDivElement => {
    if (videoHostRef.current) return videoHostRef.current
    const host = document.createElement("div")
    host.setAttribute("aria-hidden", "true")
    host.style.cssText =
      "position:fixed;left:0;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none"
    document.body.appendChild(host)
    videoHostRef.current = host
    return host
  }, [])

  const syncVideos = useCallback(
    (list: CompositorSource[]) => {
      const host = ensureVideoHost()
      const wanted = new Set(list.map((s) => s.id))

      for (const [id, el] of videosRef.current) {
        if (wanted.has(id)) continue
        el.srcObject = null
        el.remove()
        videosRef.current.delete(id)
      }

      for (const source of list) {
        let el = videosRef.current.get(source.id)
        if (!el) {
          el = document.createElement("video")
          el.muted = true // never monitor through the speakers; audio is mixed
          el.autoplay = true
          el.playsInline = true
          host.appendChild(el)
          videosRef.current.set(source.id, el)
        }
        if (el.srcObject !== source.stream) {
          el.srcObject = source.stream
          void el.play().catch(() => undefined)
        }
      }
    },
    [ensureVideoHost],
  )

  useEffect(() => {
    syncVideos(sources)
  }, [sources, syncVideos])

  /* ── audio ────────────────────────────────────────────────────────────── */

  const ensureAudio = useCallback((): AudioContext | null => {
    if (audioCtxRef.current) return audioCtxRef.current
    try {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new Ctor()
      audioCtxRef.current = ctx
      programDestRef.current = ctx.createMediaStreamDestination()

      // A bed of digital silence under the mix. With nothing connected — no
      // microphone allowed yet, no co-hosts — the programme's audio track
      // produces no samples at all, and Chrome's MediaRecorder holds the video
      // back waiting for audio to interleave with: the class recording came
      // out almost empty. A zero-level source keeps samples flowing.
      const silence = ctx.createConstantSource()
      silence.offset.value = 0
      silence.connect(programDestRef.current)
      silence.start()
      return ctx
    } catch {
      setError("This browser could not open an audio mixer.")
      return null
    }
  }, [])

  const peerDestination = useCallback(
    (peerCid: string): MediaStreamAudioDestinationNode | null => {
      const ctx = ensureAudio()
      if (!ctx) return null

      const existing = peerDestsRef.current.get(peerCid)
      if (existing) return existing

      const dest = ctx.createMediaStreamDestination()
      peerDestsRef.current.set(peerCid, dest)

      // Wire in everything already playing that is not this peer's own voice.
      for (const input of inputsRef.current.values()) {
        if (input.owner !== peerCid) input.gain.connect(dest)
      }
      return dest
    },
    [ensureAudio],
  )

  /**
   * Reconcile the audio graph against the current inputs.
   *
   * Called from the frame loop rather than from an effect: the inputs change
   * when a co-host's track arrives, which happens outside React's knowledge,
   * and comparing a handful of ids thirty times a second costs nothing next to
   * the drawing that is already happening.
   */
  const syncAudio = useCallback(() => {
    const ctx = audioCtxRef.current
    const program = programDestRef.current
    if (!ctx || !program) return

    const { remoteAudio: remote, micTrack: mic, sources: list, stage: current } = stateRef.current

    // Muting is expressed as source ids, because that is what the producer
    // clicks. A person is muted when any tile of theirs is.
    const mutedOwners = new Set<string>()
    for (const source of list) {
      if (current.muted.includes(source.id)) mutedOwners.add(source.peerCid ?? "self")
    }

    const wanted = new Map<string, { owner: string; track: MediaStreamTrack }>()
    if (mic) wanted.set("self", { owner: "self", track: mic })
    for (const [cid, track] of remote) wanted.set(`peer:${cid}`, { owner: cid, track })
    // A shared screen's own audio — a recitation video, a slide with sound.
    for (const source of list) {
      if (source.kind !== "screen") continue
      const track = source.stream.getAudioTracks()[0]
      if (track) wanted.set(`screen:${source.id}`, { owner: source.peerCid ?? "self", track })
    }

    for (const [key, input] of inputsRef.current) {
      const next = wanted.get(key)
      if (next && next.track.id === input.trackId) continue
      input.gain.disconnect()
      input.node.disconnect()
      inputsRef.current.delete(key)
    }

    for (const [key, { owner, track }] of wanted) {
      if (inputsRef.current.has(key)) continue
      try {
        const node = ctx.createMediaStreamSource(new MediaStream([track]))
        const gain = ctx.createGain()
        node.connect(gain)
        gain.connect(program)
        for (const [cid, dest] of peerDestsRef.current) {
          if (owner !== cid) gain.connect(dest)
        }
        inputsRef.current.set(key, { owner, trackId: track.id, node, gain })
      } catch {
        // A track that cannot be wired is one voice missing, not a dead mix.
      }
    }

    for (const input of inputsRef.current.values()) {
      const target = mutedOwners.has(input.owner) ? 0 : 1
      if (Math.abs(input.gain.gain.value - target) > 0.01) {
        // Ramped, because an instant gain change is an audible click on air.
        input.gain.gain.setTargetAtTime(target, ctx.currentTime, 0.02)
      }
    }
  }, [])

  /* ── which sources are on air ─────────────────────────────────────────── */

  /**
   * An empty on-stage list means "everything", not "nothing".
   *
   * A host who has never touched the stage controls has an empty list, and the
   * only defensible reading of that is the one where their camera is on the
   * air. Failing closed here would mean the first thing every new host sees is
   * a black broadcast with no obvious cause.
   */
  const onStageIds = useMemo(() => {
    const available = sources.map((s) => s.id)
    const curated = stage.onStage.filter((id) => available.includes(id))
    return curated.length ? curated : available
  }, [sources, stage.onStage])

  /* ── the frame ────────────────────────────────────────────────────────── */

  const drawFrame = useCallback(() => {
    const canvas = canvasElRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d", { alpha: false })
    if (!ctx) return

    const s = stateRef.current

    if (canvas.width !== s.width || canvas.height !== s.height) {
      canvas.width = s.width
      canvas.height = s.height
    }

    const available = s.sources.map((x) => x.id)
    const curated = s.stage.onStage.filter((id) => available.includes(id))
    const liveIds = curated.length ? curated : available
    const onStage = liveIds
      .map((id) => s.sources.find((x) => x.id === id))
      .filter((x): x is CompositorSource => !!x)

    const nextTiles = computeStageLayout({
      layout: s.stage.layout,
      sources: onStage.map((x) => ({ id: x.id, kind: x.kind, label: x.label })),
      spotlight: s.stage.spotlight,
      width: s.width,
      height: s.height,
    })

    const drawable = new Map<string, DrawableSource>()
    for (const source of onStage) {
      drawable.set(source.id, {
        id: source.id,
        label: source.label,
        kind: source.kind,
        video: videosRef.current.get(source.id) ?? null,
        live: source.live,
        muted: s.stage.muted.includes(source.id),
      })
    }

    drawStage({
      ctx,
      width: s.width,
      height: s.height,
      tiles: nextTiles,
      sources: drawable,
      overlays: s.overlays,
      showNamePlates: s.showNamePlates,
      elapsedMs: Date.now() - startedAtRef.current,
      images: imagesRef.current,
    })

    syncAudio()

    // Tiles are state because the studio draws click targets over them; only
    // publish when the geometry actually moved, or this is a re-render a frame.
    setTiles((prev) => (sameTiles(prev, nextTiles) ? prev : nextTiles))

    frameCountRef.current += 1
    const now = Date.now()
    if (now - fpsWindowRef.current >= 1000) {
      setActualFps(frameCountRef.current)
      frameCountRef.current = 0
      fpsWindowRef.current = now
    }
  }, [syncAudio])

  /* ── lifecycle ────────────────────────────────────────────────────────── */

  const start = useCallback(async (): Promise<boolean> => {
    const canvas = canvasElRef.current
    if (!canvas) {
      setError("The studio canvas is not ready yet.")
      return false
    }
    if (stopTickerRef.current) return true

    setError(null)
    canvas.width = stateRef.current.width
    canvas.height = stateRef.current.height

    const ctx = ensureAudio()
    // Browsers start an AudioContext suspended until a gesture; `start` is
    // always reached from a click, so this is the moment it can be resumed.
    if (ctx?.state === "suspended") await ctx.resume().catch(() => undefined)

    startedAtRef.current = Date.now()
    fpsWindowRef.current = Date.now()
    frameCountRef.current = 0

    // Draw one frame before capturing: a canvas that has never been painted
    // produces a stream whose first frames are transparent, which some
    // encoders reject outright.
    drawFrame()

    const videoTrack = canvas.captureStream(fps).getVideoTracks()[0] ?? null
    canvasTrackRef.current = videoTrack

    const audioTrack = programDestRef.current?.stream.getAudioTracks()[0] ?? null
    const tracks = [videoTrack, audioTrack].filter((t): t is MediaStreamTrack => !!t)
    setProgramStream(new MediaStream(tracks))

    stopTickerRef.current = createTicker(Math.max(16, Math.round(1000 / fps)), drawFrame)
    setRunning(true)
    return true
  }, [drawFrame, ensureAudio, fps])

  const stop = useCallback(() => {
    stopTickerRef.current?.()
    stopTickerRef.current = null

    canvasTrackRef.current?.stop()
    canvasTrackRef.current = null
    setProgramStream(null)
    setRunning(false)
    setActualFps(0)

    for (const input of inputsRef.current.values()) {
      input.gain.disconnect()
      input.node.disconnect()
    }
    inputsRef.current.clear()
    peerDestsRef.current.clear()

    void audioCtxRef.current?.close().catch(() => undefined)
    audioCtxRef.current = null
    programDestRef.current = null
  }, [])

  // The frame interval is a property of the ticker, so a resolution or frame
  // rate change has to restart it rather than being picked up mid-flight.
  useEffect(() => {
    if (!stopTickerRef.current) return
    stopTickerRef.current()
    stopTickerRef.current = createTicker(Math.max(16, Math.round(1000 / fps)), drawFrame)
  }, [fps, drawFrame])

  useEffect(() => {
    return () => {
      stopTickerRef.current?.()
      stopTickerRef.current = null
      for (const el of videosRef.current.values()) {
        el.srcObject = null
        el.remove()
      }
      videosRef.current.clear()
      videoHostRef.current?.remove()
      videoHostRef.current = null
      canvasTrackRef.current?.stop()
      void audioCtxRef.current?.close().catch(() => undefined)
    }
  }, [])

  const getReturnTracks = useCallback(
    (peerCid: string) => ({
      video: canvasTrackRef.current,
      audio: peerDestination(peerCid)?.stream.getAudioTracks()[0] ?? null,
    }),
    [peerDestination],
  )

  return {
    canvasRef,
    programStream,
    running,
    actualFps,
    error,
    tiles,
    onStageIds,
    start,
    stop,
    getReturnTracks,
  }
}

function sameTiles(a: StageTile[], b: StageTile[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    const x = a[i]
    const y = b[i]
    if (x.id !== y.id || x.x !== y.x || x.y !== y.y || x.w !== y.w || x.h !== y.h) return false
  }
  return true
}
