"use client"

/**
 * Live chat.
 *
 * Scroll behaviour is the part worth reading. A chat that always jumps to the
 * bottom yanks the page out from under anyone reading back through it, and one
 * that never jumps leaves new messages unseen. This pins to the bottom only
 * while the reader is already there, and otherwise offers a button.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { ArrowDown, Loader2, MessageSquare, Send, Trash2 } from "lucide-react"
import { avatarTone, clockTime, initials, type RoomIdentity, type RoomMessage } from "@/lib/live-room"
import type { RoomConnection } from "@/hooks/use-live-room"
import { ConnectionBadge } from "./connection-badge"

const MAX_LENGTH = 1000
/** Pixels from the bottom still counted as "at the bottom". */
const STICK_THRESHOLD = 80

export interface ChatPanelProps {
  messages: RoomMessage[]
  you: RoomIdentity | null
  connection: RoomConnection
  /** False when the host has switched chat off, or the class has ended. */
  enabled: boolean
  disabledReason?: string
  onSend: (body: string) => Promise<string | null>
  onDelete?: (id: number) => Promise<string | null>
  className?: string
}

export function ChatPanel({
  messages,
  you,
  connection,
  enabled,
  disabledReason,
  onSend,
  onDelete,
  className = "",
}: ChatPanelProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stuck, setStuck] = useState(true)
  const [unread, setUnread] = useState(0)

  const isHost = you?.role === "host"

  const scrollToEnd = useCallback((behavior: ScrollBehavior = "smooth") => {
    const list = listRef.current
    if (!list) return
    list.scrollTo({ top: list.scrollHeight, behavior })
    setUnread(0)
  }, [])

  const onScroll = () => {
    const list = listRef.current
    if (!list) return
    const atBottom = list.scrollHeight - list.scrollTop - list.clientHeight < STICK_THRESHOLD
    setStuck(atBottom)
    if (atBottom) setUnread(0)
  }

  // useLayoutEffect so the jump happens in the same frame the message paints —
  // with useEffect the list visibly lurches.
  const previousCount = useRef(messages.length)
  useLayoutEffect(() => {
    const grew = messages.length > previousCount.current
    previousCount.current = messages.length
    if (!grew) return // a host deleting a message must not count as unread

    if (stuck) scrollToEnd(messages.length > 30 ? "auto" : "smooth")
    else setUnread((n) => n + 1)
    // Only the arrival of a message should move the viewport, never a re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length])

  useEffect(() => {
    scrollToEnd("auto")
  }, [scrollToEnd])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = draft.trim()
    if (!body || sending) return

    setSending(true)
    setError(null)
    const failure = await onSend(body)
    setSending(false)

    if (failure) {
      setError(failure)
      return
    }
    setDraft("")
    setStuck(true)
    scrollToEnd()
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends, Shift+Enter breaks the line — what every chat does, and on
    // a phone the on-screen keyboard's return key inserts a newline instead.
    if (e.key === "Enter" && !e.shiftKey && !isTouchKeyboard()) {
      e.preventDefault()
      void submit(e as unknown as React.FormEvent)
    }
  }

  return (
    <section className={`flex min-h-0 flex-col rounded-2xl border border-slate-200/80 bg-white shadow-xs ${className}`}>
      <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-bold tracking-tight text-slate-900">
          <MessageSquare className="h-4 w-4 text-blue-600" />
          Live Chat
        </h3>
        <ConnectionBadge connection={connection} />
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={listRef}
          onScroll={onScroll}
          className="h-full space-y-3 overflow-y-auto overscroll-contain px-4 py-3"
        >
          {messages.length === 0 ? (
            <p className="py-10 text-center text-xs text-slate-400">
              No messages yet. Say salaam to start the conversation.
            </p>
          ) : (
            messages.map((m) => (
              <ChatBubble
                key={m.id}
                message={m}
                mine={isMine(m, you)}
                canDelete={isHost && !!onDelete}
                onDelete={onDelete}
              />
            ))
          )}
        </div>

        {unread > 0 && (
          <button
            type="button"
            onClick={() => scrollToEnd()}
            className="absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white shadow-lg"
          >
            <ArrowDown className="h-3 w-3" />
            {unread} new {unread === 1 ? "message" : "messages"}
          </button>
        )}
      </div>

      <footer className="border-t border-slate-100 p-3">
        {enabled ? (
          <form onSubmit={submit} className="space-y-1.5">
            <div className="flex items-end gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, MAX_LENGTH))}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="Type a message…"
                aria-label="Chat message"
                className="max-h-28 min-h-[42px] flex-1 resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="submit"
                disabled={!draft.trim() || sending}
                aria-label="Send message"
                className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 px-0.5">
              <span className="text-[11px] text-rose-600">{error}</span>
              {draft.length > MAX_LENGTH - 100 && (
                <span className="text-[11px] font-medium text-slate-400">
                  {MAX_LENGTH - draft.length} left
                </span>
              )}
            </div>
          </form>
        ) : (
          <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-center text-xs font-medium text-slate-500">
            {disabledReason ?? "Chat is turned off for this class."}
          </p>
        )}
      </footer>
    </section>
  )
}

/* ── message ────────────────────────────────────────────────────────────── */

function ChatBubble({
  message,
  mine,
  canDelete,
  onDelete,
}: {
  message: RoomMessage
  mine: boolean
  canDelete: boolean
  onDelete?: (id: number) => Promise<string | null>
}) {
  const isHost = message.author_role === "host"

  return (
    <div className={`group flex gap-2.5 ${mine ? "flex-row-reverse" : ""}`}>
      <div
        className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${avatarTone(
          message.author_name,
        )}`}
        aria-hidden
      >
        {initials(message.author_name)}
      </div>

      <div className={`min-w-0 max-w-[85%] ${mine ? "items-end text-right" : ""}`}>
        <div className={`flex items-center gap-1.5 ${mine ? "justify-end" : ""}`}>
          <span className="truncate text-[11px] font-bold text-slate-700">
            {mine ? "You" : message.author_name}
          </span>
          {isHost && (
            <span className="rounded bg-blue-100 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-blue-700">
              Host
            </span>
          )}
          <span className="text-[10px] font-medium text-slate-400">{clockTime(message.created_at)}</span>
        </div>

        <div
          className={`mt-1 inline-block break-words rounded-2xl px-3 py-2 text-left text-xs leading-relaxed ${
            mine
              ? "rounded-tr-sm bg-blue-600 text-white"
              : isHost
                ? "rounded-tl-sm border border-blue-100 bg-blue-50 text-slate-800"
                : "rounded-tl-sm bg-slate-100 text-slate-800"
          }`}
        >
          {message.body}
        </div>
      </div>

      {canDelete && (
        <button
          type="button"
          onClick={() => onDelete?.(message.id)}
          aria-label="Remove message"
          className="mt-1 h-6 w-6 flex-shrink-0 rounded-lg text-slate-300 opacity-0 transition-opacity hover:bg-rose-50 hover:text-rose-600 focus:opacity-100 group-hover:opacity-100"
        >
          <Trash2 className="mx-auto h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

/* ── helpers ────────────────────────────────────────────────────────────── */

function isMine(message: RoomMessage, you: RoomIdentity | null): boolean {
  if (!you) return false
  if (you.userId && message.user_id) return you.userId === message.user_id
  // Guests have no user id; the display name is the only thing that travels
  // with the message, which is close enough for "align my own bubble right".
  return !message.user_id && message.author_name === you.name
}

/**
 * On a phone the return key should insert a newline, not send — a mis-send is
 * far more annoying than tapping an explicit button.
 */
function isTouchKeyboard(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches
}
