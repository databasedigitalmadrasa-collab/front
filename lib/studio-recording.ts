/**
 * The studio's own recording of a live class, without React.
 *
 * WHY THE STUDIO RECORDS AT ALL
 * -----------------------------
 * The studio broadcasts over WHIP, and Cloudflare Stream does not record a
 * WebRTC input — "Recording and live HLS playback are not yet supported"
 * (developers.cloudflare.com/stream/webrtc-beta). The `recording: automatic`
 * flag on the live input only ever did anything for an OBS/RTMPS class. So the
 * studio records the programme feed itself: the same composited canvas and
 * mixed audio it sends to Stream, overlays and co-hosts included.
 *
 * HOW IT GETS TO R2
 * -----------------
 * MediaRecorder hands over a chunk every couple of seconds. Those are
 * re-sliced into parts of exactly `part_size` bytes — R2 refuses a multipart
 * upload whose parts (bar the last) differ in size — and uploaded one at a
 * time, in order, retrying through network drops. The server keeps the part
 * list, so a tab that crashes mid-lesson still leaves everything it had
 * uploaded behind as a playable file.
 *
 * One `SegmentWriter` is one file. A recorder cannot switch tracks mid-file,
 * so when the compositor restarts at a new resolution the studio closes the
 * file and opens another; the recording page plays them in order.
 */

import { dmApi } from "@/lib/dm-api"

/** MediaRecorder emits data this often. Small enough to lose little on a crash. */
export const RECORDER_TIMESLICE_MS = 2000

/**
 * Best first. MP4/H.264 + AAC plays everywhere, iPhones included; WebM is the
 * fallback for browsers whose recorder cannot write MP4 (Firefox).
 */
const MIME_CANDIDATES = [
  'video/mp4;codecs="avc1.640028,mp4a.40.2"',
  "video/mp4;codecs=avc1,mp4a.40.2",
  "video/mp4",
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
]

export function pickRecordingMime(): string | null {
  if (typeof MediaRecorder === "undefined") return null
  for (const mime of MIME_CANDIDATES) {
    try {
      if (MediaRecorder.isTypeSupported(mime)) return mime
    } catch {
      // Some engines throw on a codec string they do not parse.
    }
  }
  return null
}

/**
 * Enough for a lecture at either broadcast size, and modest on purpose: the
 * host's uplink is already carrying the live broadcast at the same time.
 */
export function recordingBitrate(height: number): number {
  return height >= 1080 ? 3_500_000 : 2_000_000
}

class UploadError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }

  /** Worth retrying: the network, or the server having a bad moment. */
  get transient(): boolean {
    return this.status === 0 || this.status === 429 || this.status >= 500
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function errorFrom(res: Response): Promise<UploadError> {
  let detail = `${res.status}`
  try {
    const body = (await res.json()) as { error?: string }
    if (body?.error) detail = body.error
  } catch {
    // Not JSON; the status is all there is.
  }
  return new UploadError(res.status, detail)
}

export interface SegmentProgress {
  recordedBytes: number
  uploadedBytes: number
}

/**
 * One recording file: open it on the server, upload its parts in order, and
 * close it.
 */
export class SegmentWriter {
  private segmentId: number | null = null
  private partSize = 0
  private pending: Blob[] = []
  private pendingBytes = 0
  private queue: { part: number; blob: Blob }[] = []
  private nextPart = 1
  private pumping: Promise<void> | null = null
  private ready: Promise<void>
  private finished: Promise<void> | null = null
  private fatal: Error | null = null

  recordedBytes = 0
  uploadedBytes = 0

  constructor(
    private readonly classId: string | number,
    private readonly mime: string,
    /** The previous file's close. The server must see it closed first. */
    previous: Promise<void> | null,
    private readonly onProgress: (p: SegmentProgress) => void,
    private readonly onFatal: (err: Error) => void,
  ) {
    this.ready = this.open(previous)
  }

  private async open(previous: Promise<void> | null): Promise<void> {
    await previous?.catch(() => undefined)

    for (let attempt = 0; ; attempt++) {
      const res = await dmApi.post<{
        success: boolean
        segment: { id: number; part_size: number }
      }>(`/live-classes/${this.classId}/recording/segments`, { mime_type: this.mime }, {
        redirectOnUnauthorized: false,
      })
      if (res.ok && res.data?.segment) {
        this.segmentId = res.data.segment.id
        this.partSize = res.data.segment.part_size
        this.cut()
        return
      }
      const err = new UploadError(res.status, res.error || "Could not start the recording")
      if (!err.transient) return this.fail(err)
      await sleep(Math.min(30_000, 1000 * 2 ** attempt))
    }
  }

  /** A chunk from MediaRecorder. */
  push(blob: Blob): void {
    if (!blob.size || this.fatal) return
    this.pending.push(blob)
    this.pendingBytes += blob.size
    this.recordedBytes += blob.size
    this.report()
    this.cut()
  }

  /** Move every whole part out of the pending buffer and into the queue. */
  private cut(final = false): void {
    if (!this.partSize) return
    while (this.pendingBytes >= this.partSize || (final && this.pendingBytes > 0)) {
      const all = new Blob(this.pending, { type: this.mime })
      const take = Math.min(this.partSize, all.size)
      this.queue.push({ part: this.nextPart++, blob: all.slice(0, take) })
      const rest = all.slice(take)
      this.pending = rest.size ? [rest] : []
      this.pendingBytes = rest.size
    }
    this.pump()
  }

  private pump(): void {
    if (this.pumping || !this.queue.length || this.fatal) return
    this.pumping = this.drain().finally(() => {
      this.pumping = null
      if (this.queue.length && !this.fatal) this.pump()
    })
  }

  private async drain(): Promise<void> {
    let attempt = 0
    while (this.queue.length && !this.fatal) {
      const { part, blob } = this.queue[0]
      try {
        await this.upload(part, blob)
        this.queue.shift()
        this.uploadedBytes += blob.size
        attempt = 0
        this.report()
      } catch (err) {
        const e = err instanceof UploadError ? err : new UploadError(0, String(err))
        if (!e.transient) return this.fail(e)
        await sleep(Math.min(30_000, 1000 * 2 ** attempt++))
      }
    }
  }

  private async upload(part: number, blob: Blob): Promise<void> {
    let res: Response
    try {
      res = await dmApi.raw(
        `/live-classes/${this.classId}/recording/segments/${this.segmentId}/parts/${part}`,
        { method: "PUT", body: blob, headers: { "Content-Type": "application/octet-stream" } },
      )
    } catch (err) {
      throw new UploadError(0, err instanceof Error ? err.message : "Network error")
    }
    if (!res.ok) throw await errorFrom(res)
  }

  /**
   * Upload the tail and close the file. Resolves once the server has the
   * whole recording, which can be a while after the class ends on a slow
   * uplink — the studio says so rather than letting the host close the tab.
   */
  finish(durationSeconds: number): Promise<void> {
    if (this.finished) return this.finished
    this.finished = (async () => {
      await this.ready
      if (this.fatal) throw this.fatal
      this.cut(true)
      while (this.pumping || (this.queue.length && !this.fatal)) {
        await (this.pumping ?? sleep(250))
      }
      if (this.fatal) throw this.fatal

      for (let attempt = 0; ; attempt++) {
        const res = await dmApi.post(
          `/live-classes/${this.classId}/recording/segments/${this.segmentId}/complete`,
          { duration_seconds: Math.round(durationSeconds) },
          { redirectOnUnauthorized: false },
        )
        if (res.ok) return
        const err = new UploadError(res.status, res.error || "Could not save the recording")
        if (!err.transient) throw err
        await sleep(Math.min(30_000, 1000 * 2 ** attempt))
      }
    })()
    return this.finished
  }

  private fail(err: Error): void {
    if (this.fatal) return
    this.fatal = err
    this.onFatal(err)
  }

  private report(): void {
    this.onProgress({ recordedBytes: this.recordedBytes, uploadedBytes: this.uploadedBytes })
  }
}
