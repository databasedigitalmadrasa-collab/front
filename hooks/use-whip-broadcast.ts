"use client"

/**
 * useWhipBroadcast — the connection to Cloudflare Stream, and nothing else.
 *
 * WHAT THIS USED TO BE, AND WHY IT CHANGED
 * ----------------------------------------
 * This hook used to own the camera, the microphone, the screen share and the
 * WHIP connection together. That was coherent while a broadcast *was* a
 * camera: one getUserMedia stream in, one WHIP session out.
 *
 * It stopped being true when classes gained co-hosts. What goes up the pipe
 * now is a composited canvas — several cameras, a shared screen, the remote
 * co-hosts and the overlays, mixed by `useStageCompositor` — and the camera is
 * one input to that rather than the subject of it. Leaving device handling in
 * here would have meant the broadcast hook holding a camera it no longer
 * publishes, which is exactly the kind of thing that ends with a camera light
 * that will not go out.
 *
 * So: inputs are `useMediaSources`, the picture is `useStageCompositor`, and
 * this is the transport. It takes a `MediaStream` and gets it to Cloudflare.
 *
 * WHAT IT STILL DOES THAT THE ORIGINAL STUDIO DID NOT
 * --------------------------------------------------
 * Measure. "Stream Health: Good" and "Internet Upload Speed: 12.5 Mbps" were
 * both hardcoded strings before any of this. `getStats()` gives the real
 * outbound bitrate, packet loss, round-trip time and the resolution and frame
 * rate the encoder actually settled on — which, when a laptop cannot keep up
 * with compositing at 1080p, is the number that explains why.
 */

import { useCallback, useEffect, useRef, useState } from "react"

export type StreamHealth = "excellent" | "good" | "fair" | "poor" | "unknown"

export interface BroadcastStats {
  /** Measured outbound bitrate in kbps, video + audio. */
  bitrateKbps: number
  /** Fraction of packets lost since the broadcast started, 0-1. */
  packetLoss: number
  /** Round-trip time to the edge, milliseconds. */
  rttMs: number
  /** What the encoder is actually sending, which is not always what was asked. */
  width: number
  height: number
  fps: number
  health: StreamHealth
}

const EMPTY_STATS: BroadcastStats = {
  bitrateKbps: 0,
  packetLoss: 0,
  rttMs: 0,
  width: 0,
  height: 0,
  fps: 0,
  health: "unknown",
}

export type PublishState = "idle" | "connecting" | "publishing" | "failed"

const STATS_INTERVAL_MS = 2000

export interface WhipBroadcast {
  state: PublishState
  error: string | null
  stats: BroadcastStats
  publishing: boolean

  /** Open a WHIP session carrying this stream. */
  publish: (whipUrl: string, stream: MediaStream) => Promise<boolean>
  /**
   * Swap what is being sent without renegotiating — used when the compositor
   * restarts at a different resolution, which mints a new canvas track.
   */
  replaceTracks: (stream: MediaStream) => Promise<void>
  stop: () => Promise<void>
}

export function useWhipBroadcast(): WhipBroadcast {
  const pcRef = useRef<RTCPeerConnection | null>(null)
  /** WHIP resource URL from the answer's Location header, for a clean DELETE. */
  const resourceRef = useRef<string | null>(null)
  const statsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastStatsRef = useRef<{ bytes: number; at: number } | null>(null)

  const [state, setState] = useState<PublishState>("idle")
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<BroadcastStats>(EMPTY_STATS)

  /* ── stats ────────────────────────────────────────────────────────────── */

  const sampleStats = useCallback(async () => {
    const pc = pcRef.current
    if (!pc) return

    const report = await pc.getStats().catch(() => null)
    if (!report) return

    let bytesSent = 0
    let packetsSent = 0
    let packetsLost = 0
    let width = 0
    let height = 0
    let fps = 0
    let rttMs = 0

    report.forEach((entry) => {
      if (entry.type === "outbound-rtp" && !entry.isRemote) {
        bytesSent += Number(entry.bytesSent ?? 0)
        packetsSent += Number(entry.packetsSent ?? 0)
        if (entry.kind === "video") {
          width = Number(entry.frameWidth ?? width)
          height = Number(entry.frameHeight ?? height)
          fps = Math.round(Number(entry.framesPerSecond ?? fps))
        }
      }
      // Loss is only visible from the receiver's point of view, which reaches
      // us as remote-inbound RTCP.
      if (entry.type === "remote-inbound-rtp") {
        packetsLost += Number(entry.packetsLost ?? 0)
        if (entry.roundTripTime) rttMs = Math.round(Number(entry.roundTripTime) * 1000)
      }
      if (entry.type === "candidate-pair" && entry.state === "succeeded" && entry.currentRoundTripTime) {
        rttMs = Math.round(Number(entry.currentRoundTripTime) * 1000)
      }
    })

    const now = Date.now()
    const previous = lastStatsRef.current
    lastStatsRef.current = { bytes: bytesSent, at: now }

    const bitrateKbps =
      previous && now > previous.at
        ? Math.max(0, Math.round(((bytesSent - previous.bytes) * 8) / (now - previous.at)))
        : 0

    setStats({
      bitrateKbps,
      packetLoss: packetsSent > 0 ? Math.min(1, packetsLost / packetsSent) : 0,
      rttMs,
      width,
      height,
      fps,
      health: gradeHealth(
        bitrateKbps,
        packetsSent > 0 ? Math.min(1, packetsLost / packetsSent) : 0,
        rttMs,
        previous !== null,
      ),
    })
  }, [])

  /* ── publish ──────────────────────────────────────────────────────────── */

  const teardownConnection = useCallback(async () => {
    if (statsTimerRef.current) clearInterval(statsTimerRef.current)
    statsTimerRef.current = null
    lastStatsRef.current = null

    // WHIP's own goodbye. Without it Cloudflare holds the session open until it
    // times out, and the class shows as still live for a minute after the host
    // has closed the tab.
    const resource = resourceRef.current
    resourceRef.current = null
    if (resource) await fetch(resource, { method: "DELETE" }).catch(() => undefined)

    pcRef.current?.close()
    pcRef.current = null
    setStats(EMPTY_STATS)
  }, [])

  const publish = useCallback(
    async (whipUrl: string, stream: MediaStream): Promise<boolean> => {
      if (!whipUrl) {
        setError("This class has no WebRTC ingest URL. Recreate it, or stream with OBS instead.")
        setState("failed")
        return false
      }
      if (!stream.getTracks().length) {
        setError("There is nothing to broadcast yet. Start the studio first.")
        setState("failed")
        return false
      }

      // A second publish over a live one would leave the first session open at
      // Cloudflare's end and both would fight for the input.
      await teardownConnection()

      setError(null)
      setState("connecting")

      try {
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.cloudflare.com:3478" }],
          bundlePolicy: "max-bundle",
        })
        pcRef.current = pc

        // sendonly: this is a broadcast, and offering to receive makes
        // Cloudflare negotiate transceivers that are then never used.
        for (const track of stream.getTracks()) {
          pc.addTransceiver(track, { direction: "sendonly", streams: [stream] })
        }

        pc.onconnectionstatechange = () => {
          const cs = pc.connectionState
          if (cs === "connected") setState("publishing")
          if (cs === "failed") {
            setState("failed")
            setError("The connection to Cloudflare Stream dropped. Check your network and go live again.")
          }
        }

        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        await waitForIceGathering(pc)

        const response = await fetch(whipUrl, {
          method: "POST",
          headers: { "Content-Type": "application/sdp" },
          body: pc.localDescription?.sdp ?? offer.sdp,
        })

        if (!response.ok) {
          throw new Error(`Cloudflare Stream refused the broadcast (HTTP ${response.status}).`)
        }

        const location = response.headers.get("Location")
        if (location) resourceRef.current = new URL(location, whipUrl).toString()

        await pc.setRemoteDescription({ type: "answer", sdp: await response.text() })

        setState("publishing")
        statsTimerRef.current = setInterval(() => void sampleStats(), STATS_INTERVAL_MS)
        return true
      } catch (err) {
        await teardownConnection()
        setState("failed")
        setError(err instanceof Error ? err.message : "Could not start the broadcast.")
        return false
      }
    },
    [sampleStats, teardownConnection],
  )

  /**
   * Hand new tracks to the existing senders.
   *
   * This is what `RTCRtpSender.replaceTrack` is for, and it matters here: a
   * host switching the broadcast from 720p to 1080p gets a brand-new canvas
   * track, and renegotiating the WHIP session to carry it would drop the class
   * off the air for several seconds mid-lesson.
   */
  const replaceTracks = useCallback(async (stream: MediaStream) => {
    const pc = pcRef.current
    if (!pc) return

    for (const kind of ["video", "audio"] as const) {
      const track = stream.getTracks().find((t) => t.kind === kind) ?? null
      const sender = pc.getSenders().find((s) => s.track?.kind === kind)
      if (sender && track && sender.track !== track) {
        await sender.replaceTrack(track).catch(() => undefined)
      }
    }
  }, [])

  const stop = useCallback(async () => {
    await teardownConnection()
    setState("idle")
    setError(null)
  }, [teardownConnection])

  // Leaving the page must not leave a session open at Cloudflare's end.
  useEffect(() => {
    return () => {
      if (statsTimerRef.current) clearInterval(statsTimerRef.current)
      const resource = resourceRef.current
      if (resource) void fetch(resource, { method: "DELETE" }).catch(() => undefined)
      pcRef.current?.close()
    }
  }, [])

  return {
    state,
    error,
    stats,
    publishing: state === "publishing",
    publish,
    replaceTracks,
    stop,
  }
}

/* ── helpers ────────────────────────────────────────────────────────────── */

/**
 * Wait for ICE, but not forever.
 *
 * WHIP is a single request/response: whatever candidates are in the offer are
 * all Cloudflare will ever see, so sending before gathering finishes costs
 * connectivity. Trickle would avoid the wait, and Cloudflare's endpoint does
 * not accept it — hence the timeout, which in practice resolves in well under
 * a second on a normal network.
 */
function waitForIceGathering(pc: RTCPeerConnection, timeoutMs = 3000): Promise<void> {
  if (pc.iceGatheringState === "complete") return Promise.resolve()

  return new Promise((resolve) => {
    const done = () => {
      pc.removeEventListener("icegatheringstatechange", onChange)
      clearTimeout(timer)
      resolve()
    }
    const onChange = () => {
      if (pc.iceGatheringState === "complete") done()
    }
    const timer = setTimeout(done, timeoutMs)
    pc.addEventListener("icegatheringstatechange", onChange)
  })
}

/**
 * Grade the connection the way a host would judge it: is the picture getting
 * out, is it arriving intact, and is it arriving soon.
 */
function gradeHealth(
  bitrateKbps: number,
  packetLoss: number,
  rttMs: number,
  hasSample: boolean,
): StreamHealth {
  if (!hasSample) return "unknown"
  if (bitrateKbps < 150) return "poor"
  if (packetLoss > 0.05 || rttMs > 400) return "poor"
  if (packetLoss > 0.02 || rttMs > 250 || bitrateKbps < 600) return "fair"
  if (bitrateKbps >= 1800 && packetLoss < 0.005 && rttMs < 120) return "excellent"
  return "good"
}
