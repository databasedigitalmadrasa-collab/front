"use client"

/**
 * Announcements — the host's one-way channel.
 *
 * Separate from chat on purpose: "we resume in 5 minutes" has to stay findable
 * after forty messages have scrolled past it.
 */

import { useState } from "react"
import { Bell, Loader2, Send, Trash2 } from "lucide-react"
import { clockTime, type RoomAnnouncement } from "@/lib/live-room"

const MAX_LENGTH = 500

export interface AnnouncementsPanelProps {
  announcements: RoomAnnouncement[]
  canManage: boolean
  onAdd?: (body: string) => Promise<string | null>
  onRemove?: (id: number) => Promise<string | null>
  className?: string
}

export function AnnouncementsPanel({
  announcements,
  canManage,
  onAdd,
  onRemove,
  className = "",
}: AnnouncementsPanelProps) {
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const broadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = draft.trim()
    if (!onAdd || !body || sending) return

    setSending(true)
    setError(null)
    const failure = await onAdd(body)
    setSending(false)

    if (failure) {
      setError(failure)
      return
    }
    setDraft("")
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {canManage && onAdd && (
        <form onSubmit={broadcast} className="space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, MAX_LENGTH))}
              placeholder="Announce something to everyone watching…"
              aria-label="Announcement"
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="submit"
              disabled={!draft.trim() || sending}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
            >
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Broadcast
            </button>
          </div>
          {error && <p className="text-[11px] text-rose-600">{error}</p>}
        </form>
      )}

      {announcements.length === 0 ? (
        <p className="rounded-xl bg-slate-50 py-8 text-center text-xs text-slate-400">
          {canManage ? "No announcements sent yet." : "No announcements from the teacher yet."}
        </p>
      ) : (
        <ul className="space-y-2">
          {announcements.map((a) => (
            <li
              key={a.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3"
            >
              <div className="flex min-w-0 items-start gap-2.5">
                <Bell className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                <div className="min-w-0">
                  <p className="break-words text-xs font-medium leading-relaxed text-slate-800">{a.body}</p>
                  <p className="mt-1 text-[10px] font-semibold text-slate-400">
                    {a.author_name ? `${a.author_name} · ` : ""}
                    {clockTime(a.created_at)}
                  </p>
                </div>
              </div>

              {canManage && onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(a.id)}
                  aria-label="Remove announcement"
                  className="flex-shrink-0 rounded-lg p-1 text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
