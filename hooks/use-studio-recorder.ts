"use client"

/**
 * useStudioRecorder — the class recording, made in the studio.
 *
 * Cloudflare Stream records an OBS/RTMPS broadcast but not a WHIP one, and
 * WHIP is how this studio broadcasts. So the studio records its own programme
 * feed and uploads it as it goes; see lib/studio-recording.ts for the upload
 * side and dm-api's lib/live-recording.ts for what the server does with it.
 *
 * `record(stream)` is safe to call on every render that wants a recording: the
 * same stream is a no-op, and a different one (the compositor restarted at a
 * new resolution) closes the current file and opens the next.
 */

import { useCallback, useEffect, useRef, useState } from "react"
import {
  RECORDER_TIMESLICE_MS,
  SegmentWriter,
  pickRecordingMime,
  recordingBitrate,
} from "@/lib/studio-recording"

export type RecorderState = "idle" | "recording" | "saving" | "saved" | "failed" | "unsupported"

export interface StudioRecorder {
  state: RecorderState
  error: string | null
  /** Bytes recorded this session, across every file. */
  recordedBytes: number
  /** Bytes the server has acknowledged. */
  uploadedBytes: number
  record: (stream: MediaStream) => void
  /** Stop, and resolve once every byte is on the server and the file is closed. */
  stop: () => Promise<void>
}

export function useStudioRecorder(classId: string | number | null, broadcastHeight: number): StudioRecorder {
  const recorderRef = useRef<MediaRecorder | null>(null)
  const writerRef = useRef<SegmentWriter | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const startedAtRef = useRef(0)
  /** The most recent file's close; the next file waits on it. */
  const closingRef = useRef<Promise<void> | null>(null)
  const stoppingRef = useRef<Promise<void> | null>(null)
  const writersRef = useRef<SegmentWriter[]>([])

  const [state, setState] = useState<RecorderState>("idle")
  const [error, setError] = useState<string | null>(null)
  const [bytes, setBytes] = useState({ recorded: 0, uploaded: 0 })

  const report = useCallback(() => {
    let recorded = 0
    let uploaded = 0
    for (const w of writersRef.current) {
      recorded += w.recordedBytes
      uploaded += w.uploadedBytes
    }
    setBytes({ recorded, uploaded })
  }, [])

  /** Stop the current recorder and close its file. Returns that close. */
  const closeCurrent = useCallback((): Promise<void> => {
    const rec = recorderRef.current
    const writer = writerRef.current
    recorderRef.current = null
    writerRef.current = null
    streamRef.current = null
    if (!rec || !writer) return closingRef.current ?? Promise.resolve()

    const duration = (performance.now() - startedAtRef.current) / 1000
    const stopped = new Promise<void>((resolve) => {
      if (rec.state === "inactive") return resolve()
      rec.addEventListener("stop", () => resolve(), { once: true })
      rec.stop()
    })

    const closing = stopped.then(() => writer.finish(duration))
    closingRef.current = closing
    return closing
  }, [])

  const record = useCallback(
    (stream: MediaStream) => {
      if (!classId || streamRef.current === stream) return

      const mime = pickRecordingMime()
      if (!mime) {
        setState("unsupported")
        setError(
          "This browser cannot record the class. Use Chrome, Edge or Safari to record from the studio, or stream with OBS so Cloudflare records it.",
        )
        return
      }

      const previous = recorderRef.current ? closeCurrent() : closingRef.current

      let rec: MediaRecorder
      try {
        rec = new MediaRecorder(stream, {
          mimeType: mime,
          videoBitsPerSecond: recordingBitrate(broadcastHeight),
          audioBitsPerSecond: 128_000,
        })
      } catch (err) {
        setState("failed")
        setError(`Recording could not start: ${err instanceof Error ? err.message : String(err)}`)
        return
      }

      const writer = new SegmentWriter(classId, rec.mimeType || mime, previous, report, (err) => {
        // The file was closed under us (recording switched off, another
        // studio tab) or refused outright. Stop feeding it; whatever already
        // reached the server is kept there.
        if (rec.state !== "inactive") rec.stop()
        setState("failed")
        setError(`Recording stopped: ${err.message}`)
      })

      rec.ondataavailable = (event) => writer.push(event.data)
      rec.onerror = () => {
        setState("failed")
        setError("The browser's recorder stopped unexpectedly. What was recorded so far is saved.")
      }
      rec.start(RECORDER_TIMESLICE_MS)

      recorderRef.current = rec
      writerRef.current = writer
      streamRef.current = stream
      startedAtRef.current = performance.now()
      stoppingRef.current = null
      writersRef.current.push(writer)
      setState("recording")
      setError(null)
    },
    [classId, broadcastHeight, closeCurrent, report],
  )

  const stop = useCallback((): Promise<void> => {
    if (!recorderRef.current) return stoppingRef.current ?? Promise.resolve()

    setState((s) => (s === "failed" ? s : "saving"))
    stoppingRef.current = closeCurrent().then(
      () => setState((s) => (s === "failed" ? s : "saved")),
      (err: unknown) => {
        setState("failed")
        // A writer that already failed said why when it did; keep that.
        setError(
          (prev) =>
            prev ??
            `The end of the recording could not be saved (${err instanceof Error ? err.message : String(err)}). Everything already uploaded is kept — press "Collect the recording again" on the class page.`,
        )
      },
    )
    return stoppingRef.current
  }, [closeCurrent])

  // Closing the tab mid-upload loses the tail of the lesson, so ask first.
  const busy = state === "recording" || state === "saving"
  useEffect(() => {
    if (!busy) return
    const guard = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", guard)
    return () => window.removeEventListener("beforeunload", guard)
  }, [busy])

  // Leaving the studio inside the app keeps the page's JavaScript alive, so
  // the file is closed and the upload left to finish rather than abandoned.
  useEffect(() => () => void closeCurrent().catch(() => undefined), [closeCurrent])

  return {
    state,
    error,
    recordedBytes: bytes.recorded,
    uploadedBytes: bytes.uploaded,
    record,
    stop,
  }
}
