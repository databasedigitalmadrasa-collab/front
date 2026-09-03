"use client"

/**
 * Q&A.
 *
 * Deliberately not a second chat. A question is a small record with a
 * lifecycle — asked, optionally pinned, answered — and the answer lives *on*
 * the question rather than as another line further down, so a student who
 * looks away for ten minutes still finds the answer attached to what it
 * answers. That is also why this replaces "raise hand": a hand goes down and
 * leaves nothing behind, a question stays answerable after the class ends.
 */

import { useMemo, useState } from "react"
import {
  CheckCircle2,
  HelpCircle,
  Loader2,
  Pin,
  PinOff,
  Send,
  Trash2,
} from "lucide-react"
import { avatarTone, clockTime, initials, type RoomIdentity, type RoomMessage } from "@/lib/live-room"

const MAX_LENGTH = 1000

type Filter = "all" | "open" | "answered"

export interface QaPanelProps {
  questions: RoomMessage[]
  you: RoomIdentity | null
  enabled: boolean
  disabledReason?: string
  onAsk: (body: string) => Promise<string | null>
  onAnswer?: (id: number, answer: string) => Promise<string | null>
  onPin?: (id: number, pinned: boolean) => Promise<string | null>
  onDelete?: (id: number) => Promise<string | null>
  className?: string
}

export function QaPanel({
  questions,
  you,
  enabled,
  disabledReason,
  onAsk,
  onAnswer,
  onPin,
  onDelete,
  className = "",
}: QaPanelProps) {
  const isHost = you?.role === "host"
  const [filter, setFilter] = useState<Filter>("all")
  const [draft, setDraft] = useState("")
  const [asking, setAsking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const counts = useMemo(
    () => ({
      all: questions.length,
      open: questions.filter((q) => !q.answered).length,
      answered: questions.filter((q) => q.answered).length,
    }),
    [questions],
  )

  const visible = useMemo(() => {
    if (filter === "open") return questions.filter((q) => !q.answered)
    if (filter === "answered") return questions.filter((q) => q.answered)
    return questions
  }, [questions, filter])

  const ask = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = draft.trim()
    if (!body || asking) return

    setAsking(true)
    setError(null)
    const failure = await onAsk(body)
    setAsking(false)

    if (failure) {
      setError(failure)
      return
    }
    setDraft("")
    setFilter("all")
  }

  return (
    <section className={`flex min-h-0 flex-col rounded-2xl border border-slate-200/80 bg-white shadow-xs ${className}`}>
      <header className="space-y-3 border-b border-slate-100 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-bold tracking-tight text-slate-900">
            <HelpCircle className="h-4 w-4 text-indigo-600" />
            Questions &amp; Answers
          </h3>
          {counts.open > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
              {counts.open} awaiting answer
            </span>
          )}
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {(
            [
              { id: "all", label: "All" },
              { id: "open", label: "Unanswered" },
              { id: "answered", label: "Answered" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              aria-pressed={filter === tab.id}
              className={`whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors ${
                filter === tab.id
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label} ({counts[tab.id]})
            </button>
          ))}
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-3">
        {visible.length === 0 ? (
          <p className="py-10 text-center text-xs text-slate-400">
            {filter === "answered"
              ? "No questions have been answered yet."
              : filter === "open"
                ? "Every question has been answered."
                : "No questions yet. Ask the first one."}
          </p>
        ) : (
          visible.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              isHost={isHost}
              onAnswer={onAnswer}
              onPin={onPin}
              onDelete={onDelete}
            />
          ))
        )}
      </div>

      <footer className="border-t border-slate-100 p-3">
        {enabled ? (
          <form onSubmit={ask} className="space-y-1.5">
            <div className="flex items-end gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, MAX_LENGTH))}
                rows={1}
                placeholder={isHost ? "Post a question for the class…" : "Ask the teacher a question…"}
                aria-label="Your question"
                className="max-h-28 min-h-[42px] flex-1 resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                type="submit"
                disabled={!draft.trim() || asking}
                aria-label="Submit question"
                className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {asking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            {error && <p className="px-0.5 text-[11px] text-rose-600">{error}</p>}
          </form>
        ) : (
          <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-center text-xs font-medium text-slate-500">
            {disabledReason ?? "Q&A is turned off for this class."}
          </p>
        )}
      </footer>
    </section>
  )
}

/* ── one question ───────────────────────────────────────────────────────── */

function QuestionCard({
  question,
  isHost,
  onAnswer,
  onPin,
  onDelete,
}: {
  question: RoomMessage
  isHost: boolean
  onAnswer?: (id: number, answer: string) => Promise<string | null>
  onPin?: (id: number, pinned: boolean) => Promise<string | null>
  onDelete?: (id: number) => Promise<string | null>
}) {
  const [replying, setReplying] = useState(false)
  const [answer, setAnswer] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const answered = !!question.answered
  const pinned = !!question.pinned

  const submitAnswer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!onAnswer || saving) return

    setSaving(true)
    setError(null)
    const failure = await onAnswer(question.id, answer.trim())
    setSaving(false)

    if (failure) {
      setError(failure)
      return
    }
    setReplying(false)
    setAnswer("")
  }

  return (
    <article
      className={`rounded-xl border p-3 transition-colors ${
        pinned
          ? "border-amber-200 bg-amber-50/60"
          : answered
            ? "border-emerald-100 bg-emerald-50/40"
            : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${avatarTone(
            question.author_name,
          )}`}
          aria-hidden
        >
          {initials(question.author_name)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-[11px] font-bold text-slate-700">{question.author_name}</span>
            <span className="text-[10px] font-medium text-slate-400">{clockTime(question.created_at)}</span>
            {pinned && (
              <span className="inline-flex items-center gap-1 rounded bg-amber-200/70 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-amber-800">
                <Pin className="h-2.5 w-2.5" />
                Pinned
              </span>
            )}
            <span
              className={`rounded px-1.5 py-px text-[9px] font-bold uppercase tracking-wide ${
                answered ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
              }`}
            >
              {answered ? "Answered" : "Awaiting answer"}
            </span>
          </div>

          <p className="mt-1.5 break-words text-xs font-medium leading-relaxed text-slate-800">
            {question.body}
          </p>

          {answered && (
            <div className="mt-2.5 rounded-lg border border-emerald-100 bg-white p-2.5">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                <CheckCircle2 className="h-3 w-3" />
                {question.answered_by || "Host"} answered
              </p>
              <p className="mt-1 break-words text-xs leading-relaxed text-slate-700">
                {question.answer_body || "Answered live during the class."}
              </p>
            </div>
          )}

          {isHost && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              {onAnswer && (
                <button
                  type="button"
                  onClick={() => setReplying((r) => !r)}
                  className="rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white transition-colors hover:bg-indigo-700"
                >
                  {answered ? "Edit answer" : "Answer"}
                </button>
              )}
              {onPin && (
                <button
                  type="button"
                  onClick={() => onPin(question.id, !pinned)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                >
                  {pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                  {pinned ? "Unpin" : "Pin"}
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(question.id)}
                  aria-label="Remove question"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 className="h-3 w-3" />
                  Remove
                </button>
              )}
            </div>
          )}

          {isHost && replying && onAnswer && (
            <form onSubmit={submitAnswer} className="mt-2 space-y-1.5">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value.slice(0, MAX_LENGTH))}
                rows={2}
                autoFocus
                placeholder="Type the answer, or leave blank to mark it answered live…"
                className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                  Post answer
                </button>
                <button
                  type="button"
                  onClick={() => setReplying(false)}
                  className="rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
                {error && <span className="text-[11px] text-rose-600">{error}</span>}
              </div>
            </form>
          )}
        </div>
      </div>
    </article>
  )
}
