"use client"

/**
 * The viewer's live class — shared by the subscriber link and the guest link.
 *
 * Both audiences see exactly the same room; the only difference is which token
 * opened it, and the server decides what that makes them. Keeping one
 * component means the guest page can never quietly drift behind the student
 * page, which is how the two ended up with different players and different
 * error states before.
 *
 * LAYOUT
 * ------
 * Desktop is two columns: stage plus content on the left, a persistent chat /
 * Q&A / people rail on the right. Below `lg` the rail becomes a tab bar under
 * the video, because a stacked rail on a phone means scrolling past the whole
 * chat to reach the class agenda.
 *
 * There is deliberately no "raise hand". A raised hand is a request with no
 * record — the host either notices it in the moment or the student is ignored.
 * Q&A does the same job and leaves the question, and its answer, on the page.
 */

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  Bell,
  BookOpen,
  CalendarDays,
  Clock,
  Info,
  Loader2,
  Lock,
  LogOut,
  MessageSquare,
  Paperclip,
  Radio,
  Users,
} from "lucide-react"
import { useLiveRoom } from "@/hooks/use-live-room"
import type { Principal } from "@/lib/dm-api"
import { ChatPanel } from "./chat-panel"
import { QaPanel } from "./qa-panel"
import { ParticipantsPanel } from "./participants-panel"
import { MaterialsPanel } from "./materials-panel"
import { AnnouncementsPanel } from "./announcements-panel"
import { StreamStage } from "./stream-stage"
import { ConnectionBadge } from "./connection-badge"

type RailTab = "chat" | "qa" | "people"
type ContentTab = "about" | "materials" | "announcements"

export interface LiveClassRoomProps {
  token: string
  guestName?: string
  guestKey?: string
  principal?: Principal
  /** Where "leave class" goes. */
  exitHref: string
  exitLabel?: string
}

export function LiveClassRoom({
  token,
  guestName,
  guestKey,
  principal = "auto",
  exitHref,
  exitLabel = "Leave class",
}: LiveClassRoomProps) {
  const room = useLiveRoom({ token, guestName, guestKey, principal })
  const [rail, setRail] = useState<RailTab>("chat")
  const [content, setContent] = useState<ContentTab>("about")

  const {
    liveClass,
    you,
    chat,
    questions,
    presence,
    participantCount,
    materials,
    announcements,
    connection,
    loading,
    error,
    errorStatus,
  } = room

  const ended = liveClass?.status === "ended" || liveClass?.status === "cancelled"
  const chatOpen = !!liveClass?.chat_enabled && !ended
  const qaOpen = !!liveClass?.qa_enabled && !ended

  const unansweredCount = useMemo(() => questions.filter((q) => !q.answered).length, [questions])

  // A newly arriving announcement is easy to miss inside a tab; surface a dot
  // until the reader has actually opened the tab once since it arrived.
  const [seenAnnouncements, setSeenAnnouncements] = useState(0)
  useEffect(() => {
    if (content === "announcements") setSeenAnnouncements(announcements.length)
  }, [content, announcements.length])
  const unseenAnnouncements = Math.max(0, announcements.length - seenAnnouncements)

  if (loading) {
    return (
      <CenteredCard>
        <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm font-semibold text-slate-600">Joining the class…</p>
      </CenteredCard>
    )
  }

  if (error || !liveClass) {
    return <RoomError error={error} status={errorStatus} exitHref={exitHref} />
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border ${
                liveClass.status === "live"
                  ? "border-rose-200 bg-rose-50 text-rose-600"
                  : "border-slate-200 bg-slate-50 text-slate-500"
              }`}
            >
              <Radio className={`h-4.5 w-4.5 ${liveClass.status === "live" ? "animate-pulse" : ""}`} />
            </span>

            <div className="min-w-0">
              <h1 className="truncate text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                {liveClass.title}
              </h1>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {formatSchedule(liveClass.scheduled_at)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {liveClass.duration_minutes ?? 60} min
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {participantCount} watching
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2 self-end md:self-auto flex-wrap">
            <ConnectionBadge connection={connection} className="hidden sm:inline-flex" />
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-[10px] sm:text-xs font-semibold text-white shadow-2xs">
              <span>Powered by <span className="text-blue-400 font-extrabold">Blaze</span> By WEM STUDIOS</span>
            </div>
            <Link
              href={exitHref}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            >
              <LogOut className="h-3.5 w-3.5" />
              {exitLabel}
            </Link>
          </div>
        </div>
      </header>

      {/*
        Three grid items, not two, so the phone order can be video → chat →
        class content. Nesting the tabs under the video would push the chat
        below everything, which is the wrong thing to make a student scroll
        past during a live lesson.
      */}
      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-4 sm:px-6 sm:py-6 lg:grid-cols-12 lg:gap-6">
        {/* ── Stage ──────────────────────────────────────────────────────── */}
        <div className="order-1 space-y-4 lg:col-span-8">
          <StreamStage
            liveClass={liveClass}
            participantCount={participantCount}
            overlays={room.liveOverlays}
          />

          {announcements.length > 0 && liveClass.status === "live" && (
            <LatestAnnouncement text={announcements[0].body} />
          )}
        </div>

        {/* ── Rail: chat / Q&A / people ──────────────────────────────────── */}
        <div className="order-2 lg:col-span-4 lg:row-span-2">
          <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:h-[calc(100vh-7.5rem)]">
            <div className="grid grid-cols-3 gap-1 rounded-xl border border-slate-200/80 bg-white p-1 shadow-xs">
              <RailButton
                active={rail === "chat"}
                onClick={() => setRail("chat")}
                icon={<MessageSquare className="h-3.5 w-3.5" />}
                label="Chat"
              />
              <RailButton
                active={rail === "qa"}
                onClick={() => setRail("qa")}
                icon={<BookOpen className="h-3.5 w-3.5" />}
                label="Q&A"
                badge={unansweredCount || undefined}
              />
              <RailButton
                active={rail === "people"}
                onClick={() => setRail("people")}
                icon={<Users className="h-3.5 w-3.5" />}
                label="People"
                badge={presence.length || undefined}
              />
            </div>

            {rail === "chat" && (
              <ChatPanel
                className="h-[58vh] min-h-[320px] lg:h-auto lg:min-h-0 lg:flex-1"
                messages={chat}
                you={you}
                connection={connection}
                enabled={chatOpen}
                disabledReason={ended ? "This class has ended." : "The teacher has turned chat off."}
                onSend={(body) => room.send("chat", body)}
              />
            )}

            {rail === "qa" && (
              <QaPanel
                className="h-[58vh] min-h-[320px] lg:h-auto lg:min-h-0 lg:flex-1"
                questions={questions}
                you={you}
                enabled={qaOpen}
                disabledReason={ended ? "This class has ended." : "The teacher has turned Q&A off."}
                onAsk={(body) => room.send("question", body)}
              />
            )}

            {rail === "people" && (
              <ParticipantsPanel
                className="h-[58vh] min-h-[320px] lg:h-auto lg:min-h-0 lg:flex-1"
                presence={presence}
                you={you}
                collapseAfter={0}
              />
            )}
          </div>
        </div>

        {/* ── Class content ──────────────────────────────────────────────── */}
        <div className="order-3 lg:col-span-8">
          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
            <div className="flex overflow-x-auto border-b border-slate-100 bg-slate-50/60 px-2">
              <TabButton
                active={content === "about"}
                onClick={() => setContent("about")}
                icon={<Info className="h-4 w-4" />}
                label="About"
              />
              <TabButton
                active={content === "materials"}
                onClick={() => setContent("materials")}
                icon={<Paperclip className="h-4 w-4" />}
                label="Materials"
                count={materials.length}
              />
              <TabButton
                active={content === "announcements"}
                onClick={() => setContent("announcements")}
                icon={<Bell className="h-4 w-4" />}
                label="Announcements"
                count={announcements.length}
                dot={unseenAnnouncements > 0}
              />
            </div>

            <div className="p-4 sm:p-5">
              {content === "about" && <AboutClass liveClass={liveClass} />}
              {content === "materials" && <MaterialsPanel materials={materials} canManage={false} />}
              {content === "announcements" && (
                <AnnouncementsPanel announcements={announcements} canManage={false} />
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

/* ── pieces ─────────────────────────────────────────────────────────────── */

function AboutClass({ liveClass }: { liveClass: NonNullable<ReturnType<typeof useLiveRoom>["liveClass"]> }) {
  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Fact label="Status" value={liveClass.status} className="capitalize" />
        <Fact label="Scheduled" value={formatSchedule(liveClass.scheduled_at)} />
        <Fact label="Duration" value={`${liveClass.duration_minutes ?? 60} minutes`} />
        <Fact
          label="Recording"
          value={liveClass.recording_enabled ? "Being recorded" : "Not recorded"}
        />
      </dl>

      {liveClass.description ? (
        <p className="rounded-xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-700">
          {liveClass.description}
        </p>
      ) : (
        <p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-400">
          No description was added for this class.
        </p>
      )}
    </div>
  )
}

function Fact({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className="rounded-xl border border-slate-200/70 bg-slate-50 p-3">
      <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className={`mt-1 text-xs font-bold text-slate-900 ${className}`}>{value}</dd>
    </div>
  )
}

function LatestAnnouncement({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-2xl border border-blue-100 bg-blue-50/80 px-4 py-3">
      <Bell className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
      <p className="text-xs font-medium leading-relaxed text-blue-900">{text}</p>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
  dot,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  count?: number
  dot?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`relative flex items-center gap-2 whitespace-nowrap border-b-2 px-3.5 py-3 text-xs font-bold transition-colors sm:px-4 ${
        active ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-900"
      }`}
    >
      {icon}
      {label}
      {count !== undefined && count > 0 && (
        <span className="rounded-full bg-slate-200 px-1.5 text-[10px] text-slate-700">{count}</span>
      )}
      {dot && <span className="absolute right-1.5 top-2 h-1.5 w-1.5 rounded-full bg-rose-500" />}
    </button>
  )
}

function RailButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  badge?: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-bold transition-colors ${
        active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {icon}
      {label}
      {badge !== undefined && (
        <span
          className={`rounded-full px-1.5 text-[10px] ${
            active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  )
}

function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-sm">
        {children}
      </div>
    </div>
  )
}

function RoomError({
  error,
  status,
  exitHref,
}: {
  error: string | null
  status: number
  exitHref: string
}) {
  const needsPlan = status === 403
  const needsLogin = status === 401

  return (
    <CenteredCard>
      <div
        className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border ${
          needsPlan
            ? "border-amber-200 bg-amber-50 text-amber-600"
            : "border-rose-200 bg-rose-50 text-rose-600"
        }`}
      >
        {needsPlan || needsLogin ? <Lock className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
      </div>

      <h2 className="text-lg font-bold text-slate-900">
        {needsPlan ? "Subscription required" : needsLogin ? "Sign in to continue" : "Class unavailable"}
      </h2>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">
        {error || "This live session is not available right now."}
      </p>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        {needsPlan && (
          <Link
            href="/plans"
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-blue-700"
          >
            View subscription plans
          </Link>
        )}
        {needsLogin && (
          <Link
            href="/login"
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-blue-700"
          >
            Sign in
          </Link>
        )}
        <Link
          href={exitHref}
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50"
        >
          Go back
        </Link>
      </div>
    </CenteredCard>
  )
}

/* ── formatting ─────────────────────────────────────────────────────────── */

function formatSchedule(iso: string): string {
  if (!iso) return ""
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}
