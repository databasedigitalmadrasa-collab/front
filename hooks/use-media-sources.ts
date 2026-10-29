"use client"

/**
 * useMediaSources — every camera, screen and microphone this browser is
 * contributing, and nothing about how they get anywhere.
 *
 * WHY THIS IS SEPARATE FROM THE BROADCAST
 * ---------------------------------------
 * The studio this replaces owned one camera and one microphone, and owned them
 * inside the hook that also held the WHIP connection. That was workable while
 * "the stream" and "the camera" were the same object. They are not any more:
 * the thing that goes up the WHIP pipe is a composited canvas, and the camera
 * is one of several inputs to it — alongside a second camera, a shared screen,
 * and whatever the co-hosts are sending.
 *
 * So this hook owns inputs, `useStageCompositor` owns the picture, and
 * `useWhipBroadcast` owns the connection. Each one can be reasoned about, and
 * changing a camera no longer has any path to touching the broadcast.
 *
 * MULTICAM
 * --------
 * A camera is added, not selected. `addCamera()` opens another device and
 * leaves the first running, which is what makes a two-angle setup — a face
 * camera and a document camera over a book — possible at all. Switching
 * (rather than adding) is `replaceDevice`, which swaps the track inside an
 * existing source so its id survives and the producer's layout does not drop
 * it.
 */

import { useCallback, useEffect, useRef, useState } from "react"
import type { StageSource } from "@/lib/live-room"

export interface MediaDeviceItem {
  deviceId: string
  label: string
}

export interface LocalSource {
  /** Stable for the life of the tab; the stage layout refers to it. */
  id: string
  kind: "camera" | "screen"
  label: string
  stream: MediaStream
  /** The camera this came from, so the picker can show what is in use. */
  deviceId: string | null
  /** False while the track is paused — camera off, but the tile keeps its seat. */
  enabled: boolean
}

export interface MediaSources {
  ready: boolean
  error: string | null

  cameras: MediaDeviceItem[]
  microphones: MediaDeviceItem[]

  sources: LocalSource[]
  micTrack: MediaStreamTrack | null
  micDeviceId: string
  micMuted: boolean
  audioLevel: number
  screenSharing: boolean

  /** Open the microphone and the default camera. Safe to call twice. */
  start: () => Promise<boolean>
  addCamera: (deviceId?: string) => Promise<string | null>
  replaceDevice: (sourceId: string, deviceId: string) => Promise<void>
  removeSource: (sourceId: string) => void
  toggleSource: (sourceId: string) => void
  startScreenShare: () => Promise<string | null>
  selectMic: (deviceId: string) => Promise<void>
  toggleMic: () => void
  stopAll: () => void

  /** What the room is told this browser is offering. */
  announce: () => StageSource[]
}

/**
 * Source ids are prefixed per tab, not per person.
 *
 * They have to survive a socket reconnect — the connection id does not, and a
 * co-host whose train went through a tunnel would otherwise come back as a
 * brand-new set of cameras and fall out of the layout. They also have to
 * differ between two tabs of the same account, or a host reviewing the class
 * in a second window would collide with themselves.
 */
function sourcePrefix(): string {
  if (typeof window === "undefined") return "src"
  try {
    const existing = window.sessionStorage.getItem("dm_live_source_prefix")
    if (existing) return existing
    const minted = crypto.randomUUID().slice(0, 8)
    window.sessionStorage.setItem("dm_live_source_prefix", minted)
    return minted
  } catch {
    return crypto.randomUUID().slice(0, 8)
  }
}

export function useMediaSources(): MediaSources {
  const [sources, setSources] = useState<LocalSource[]>([])
  const [cameras, setCameras] = useState<MediaDeviceItem[]>([])
  const [microphones, setMicrophones] = useState<MediaDeviceItem[]>([])
  const [micDeviceId, setMicDeviceId] = useState("")
  const [micMuted, setMicMuted] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const micStreamRef = useRef<MediaStream | null>(null)
  const [micTrack, setMicTrack] = useState<MediaStreamTrack | null>(null)

  const prefixRef = useRef<string>("")
  const counterRef = useRef(0)
  const sourcesRef = useRef<LocalSource[]>([])
  sourcesRef.current = sources

  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number | null>(null)

  if (!prefixRef.current) prefixRef.current = sourcePrefix()

  const mintId = (kind: "camera" | "screen") => {
    counterRef.current += 1
    return `${prefixRef.current}#${kind}-${counterRef.current}`
  }

  /* ── devices ──────────────────────────────────────────────────────────── */

  const loadDevices = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) return
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      setMicrophones(
        devices
          .filter((d) => d.kind === "audioinput")
          .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Microphone ${i + 1}` })),
      )
      setCameras(
        devices
          .filter((d) => d.kind === "videoinput")
          .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Camera ${i + 1}` })),
      )
    } catch {
      // Enumeration without permission returns empty labels rather than
      // throwing; anything thrown here means no device access at all.
    }
  }, [])

  useEffect(() => {
    void loadDevices()
    if (typeof navigator === "undefined" || !navigator.mediaDevices) return
    // A camera unplugged mid-class should leave the list.
    navigator.mediaDevices.addEventListener("devicechange", loadDevices)
    return () => navigator.mediaDevices.removeEventListener("devicechange", loadDevices)
  }, [loadDevices])

  /* ── audio meter ──────────────────────────────────────────────────────── */

  const stopMeter = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    analyserRef.current = null
    void audioCtxRef.current?.close().catch(() => undefined)
    audioCtxRef.current = null
    setAudioLevel(0)
  }, [])

  const startMeter = useCallback(
    (stream: MediaStream) => {
      stopMeter()
      try {
        const Ctor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        const ctx = new Ctor()
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 256
        ctx.createMediaStreamSource(stream).connect(analyser)

        audioCtxRef.current = ctx
        analyserRef.current = analyser

        const data = new Uint8Array(analyser.frequencyBinCount)
        const loop = () => {
          const node = analyserRef.current
          if (!node) return
          node.getByteTimeDomainData(data)

          // RMS around the 128 midpoint: a real loudness measure, unlike
          // averaging the frequency bins, which reads near-zero on speech.
          let sum = 0
          for (let i = 0; i < data.length; i++) {
            const deviation = (data[i] - 128) / 128
            sum += deviation * deviation
          }
          setAudioLevel(Math.min(100, Math.round(Math.sqrt(sum / data.length) * 240)))
          rafRef.current = requestAnimationFrame(loop)
        }
        loop()
      } catch {
        // AudioContext is a nicety; a browser that refuses it still streams.
      }
    },
    [stopMeter],
  )

  /* ── opening devices ──────────────────────────────────────────────────── */

  const openCamera = useCallback(
    async (deviceId?: string): Promise<MediaStream> =>
      navigator.mediaDevices.getUserMedia({
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 } },
      }),
    [],
  )

  const labelFor = useCallback(
    (deviceId: string | null, fallback: string) =>
      cameras.find((c) => c.deviceId === deviceId)?.label || fallback,
    [cameras],
  )

  const start = useCallback(async (): Promise<boolean> => {
    setError(null)
    try {
      // Audio and video are opened in one call the first time, so the browser
      // shows a single permission prompt rather than two in a row.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: micDeviceId ? { deviceId: { exact: micDeviceId } } : true,
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      })

      const audio = stream.getAudioTracks()[0] ?? null
      const video = stream.getVideoTracks()[0] ?? null

      if (audio) {
        micStreamRef.current?.getTracks().forEach((t) => t.stop())
        const micStream = new MediaStream([audio])
        micStreamRef.current = micStream
        audio.enabled = !micMuted
        setMicTrack(audio)
        setMicDeviceId(audio.getSettings().deviceId ?? "")
        startMeter(micStream)
      }

      if (video) {
        const id = mintId("camera")
        const deviceId = video.getSettings().deviceId ?? null
        setSources((prev) => {
          // `start` is idempotent by design — the studio calls it on mount and
          // the host may press "Start camera" after denying once. A second
          // camera appearing from that would be a surprise.
          if (prev.some((s) => s.kind === "camera")) {
            video.stop()
            return prev
          }
          return [
            ...prev,
            {
              id,
              kind: "camera",
              label: labelFor(deviceId, "Camera"),
              stream: new MediaStream([video]),
              deviceId,
              enabled: true,
            },
          ]
        })
      }

      setReady(true)
      // Labels only populate once permission is granted, so rebuild the lists.
      await loadDevices()
      return true
    } catch (err) {
      setError(describeMediaError(err))
      setReady(false)
      return false
    }
  }, [micDeviceId, micMuted, startMeter, loadDevices, labelFor])

  const addCamera = useCallback(
    async (deviceId?: string): Promise<string | null> => {
      setError(null)
      try {
        const stream = await openCamera(deviceId)
        const track = stream.getVideoTracks()[0]
        if (!track) return null

        const id = mintId("camera")
        const resolved = track.getSettings().deviceId ?? deviceId ?? null
        setSources((prev) => [
          ...prev,
          {
            id,
            kind: "camera",
            label: labelFor(resolved, `Camera ${prev.filter((s) => s.kind === "camera").length + 1}`),
            stream,
            deviceId: resolved,
            enabled: true,
          },
        ])
        await loadDevices()
        return id
      } catch (err) {
        setError(describeMediaError(err))
        return null
      }
    },
    [openCamera, labelFor, loadDevices],
  )

  /**
   * Point an existing source at a different camera.
   *
   * The source keeps its id, which is the whole point: the producer's layout,
   * the on-stage list and the peer connection's transceiver all refer to it,
   * and a swap that minted a new id would drop the tile off the broadcast for
   * as long as it took a human to put it back.
   */
  const replaceDevice = useCallback(
    async (sourceId: string, deviceId: string) => {
      setError(null)
      const source = sourcesRef.current.find((s) => s.id === sourceId)
      if (!source || source.kind !== "camera") return

      try {
        const fresh = await openCamera(deviceId)
        const next = fresh.getVideoTracks()[0]
        if (!next) return

        next.enabled = source.enabled

        const previous = source.stream.getVideoTracks()[0]
        if (previous) {
          source.stream.removeTrack(previous)
          previous.stop()
        }
        source.stream.addTrack(next)

        setSources((prev) =>
          prev.map((s) =>
            s.id === sourceId ? { ...s, deviceId, label: labelFor(deviceId, s.label) } : s,
          ),
        )
      } catch (err) {
        setError(describeMediaError(err))
      }
    },
    [openCamera, labelFor],
  )

  const removeSource = useCallback((sourceId: string) => {
    setSources((prev) => {
      const target = prev.find((s) => s.id === sourceId)
      target?.stream.getTracks().forEach((t) => t.stop())
      return prev.filter((s) => s.id !== sourceId)
    })
  }, [])

  /**
   * Camera off without giving up the seat.
   *
   * `track.enabled = false` keeps the sender alive and the tile in the layout,
   * showing the source's name card instead of a hole. Stopping the track would
   * renegotiate the peer connection and shuffle everyone else's tiles.
   */
  const toggleSource = useCallback((sourceId: string) => {
    setSources((prev) =>
      prev.map((s) => {
        if (s.id !== sourceId) return s
        const enabled = !s.enabled
        s.stream.getVideoTracks().forEach((t) => (t.enabled = enabled))
        return { ...s, enabled }
      }),
    )
  }, [])

  const startScreenShare = useCallback(async (): Promise<string | null> => {
    setError(null)
    try {
      // Screen audio is requested but not required: a host sharing a recitation
      // video wants its sound in the mix, and a host sharing slides does not
      // notice either way. Browsers that refuse it still give us the video.
      const display = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30 } },
        audio: true,
      })

      const track = display.getVideoTracks()[0]
      if (!track) return null

      const id = mintId("screen")
      setSources((prev) => [
        ...prev,
        { id, kind: "screen", label: "Shared screen", stream: display, deviceId: null, enabled: true },
      ])

      // Fires when the host stops sharing from the browser's own bar rather
      // than from our button.
      track.onended = () => {
        setSources((prev) => {
          prev.find((s) => s.id === id)?.stream.getTracks().forEach((t) => t.stop())
          return prev.filter((s) => s.id !== id)
        })
      }

      return id
    } catch {
      // The host dismissed the picker. Not an error worth surfacing.
      return null
    }
  }, [])

  const selectMic = useCallback(
    async (deviceId: string) => {
      setMicDeviceId(deviceId)
      setError(null)
      try {
        const fresh = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: deviceId } },
        })
        const track = fresh.getAudioTracks()[0]
        if (!track) return

        track.enabled = !micMuted
        micStreamRef.current?.getTracks().forEach((t) => t.stop())
        const micStream = new MediaStream([track])
        micStreamRef.current = micStream
        setMicTrack(track)
        startMeter(micStream)
      } catch (err) {
        setError(describeMediaError(err))
      }
    },
    [micMuted, startMeter],
  )

  const toggleMic = useCallback(() => {
    setMicMuted((muted) => {
      const next = !muted
      micStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !next))
      return next
    })
  }, [])

  const stopAll = useCallback(() => {
    sourcesRef.current.forEach((s) => s.stream.getTracks().forEach((t) => t.stop()))
    setSources([])
    micStreamRef.current?.getTracks().forEach((t) => t.stop())
    micStreamRef.current = null
    setMicTrack(null)
    stopMeter()
    setReady(false)
  }, [stopMeter])

  // Leaving the page must not leave the camera light on.
  useEffect(() => {
    return () => {
      sourcesRef.current.forEach((s) => s.stream.getTracks().forEach((t) => t.stop()))
      micStreamRef.current?.getTracks().forEach((t) => t.stop())
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      void audioCtxRef.current?.close().catch(() => undefined)
    }
  }, [])

  /** The room's view of what this browser has to offer. */
  const announce = useCallback(
    (): StageSource[] =>
      sourcesRef.current.map((s) => ({
        id: s.id,
        kind: s.kind,
        label: s.label,
        live: s.enabled,
        selfMuted: micMuted,
      })),
    [micMuted],
  )

  return {
    ready,
    error,
    cameras,
    microphones,
    sources,
    micTrack,
    micDeviceId,
    micMuted,
    audioLevel,
    screenSharing: sources.some((s) => s.kind === "screen"),
    start,
    addCamera,
    replaceDevice,
    removeSource,
    toggleSource,
    startScreenShare,
    selectMic,
    toggleMic,
    stopAll,
    announce,
  }
}

/** Turn a DOMException into something a teacher can act on. */
export function describeMediaError(err: unknown): string {
  switch ((err as DOMException)?.name) {
    case "NotAllowedError":
    case "SecurityError":
      return "Camera and microphone access was blocked. Allow it in your browser's address bar, then try again."
    case "NotFoundError":
    case "OverconstrainedError":
      return "The selected camera or microphone is not available. Pick a different device below."
    case "NotReadableError":
      return "Another app is using your camera or microphone. Close it and try again."
    default:
      return err instanceof Error ? err.message : "Could not access your camera and microphone."
  }
}
