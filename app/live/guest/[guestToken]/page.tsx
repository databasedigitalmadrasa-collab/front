"use client"

/**
 * `/live/guest/<guest_token>` — the open link, for people without an account.
 *
 * One extra step over the subscriber route: a guest has no identity, so they
 * name themselves once and that name is what appears in chat, in Q&A and in
 * the participant list. It is remembered locally so a reload does not ask
 * again, and paired with a browser-local key so a reload rejoins as the same
 * person rather than inflating the head count.
 *
 * After that it is the same room component the subscriber link renders — the
 * server decides what a guest may do, not this page.
 */

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Radio, UserCheck } from "lucide-react"
import { LiveClassRoom } from "@/components/live/live-class-room"
import { guestKey, recallGuestName, rememberGuestName } from "@/lib/live-room"

export default function GuestLiveClassPage() {
  const { guestToken } = useParams<{ guestToken: string }>()

  const [name, setName] = useState("")
  const [joinedAs, setJoinedAs] = useState<string | null>(null)
  const [key, setKey] = useState("")

  // localStorage is not available during the server render, so both the key
  // and the remembered name are read after mount.
  useEffect(() => {
    setKey(guestKey())
    const remembered = recallGuestName()
    if (remembered) {
      setName(remembered)
      setJoinedAs(remembered)
    }
  }, [])

  if (joinedAs && key) {
    return (
      <LiveClassRoom
        token={guestToken}
        guestName={joinedAs}
        guestKey={key}
        principal="none"
        exitHref="/"
        exitLabel="Leave"
      />
    )
  }

  const join = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    rememberGuestName(trimmed)
    setJoinedAs(trimmed)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-7 shadow-sm sm:p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600">
            <Radio className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900">Join the live class</h1>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
            Tell us what to call you. Your name appears in the chat, in Q&amp;A and in the participant
            list.
          </p>
        </div>

        <form onSubmit={join} className="mt-6 space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-slate-700">Your name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 60))}
              placeholder="e.g. Mohammed Ayan"
              autoFocus
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </label>

          <button
            type="submit"
            disabled={!name.trim() || !key}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
          >
            <UserCheck className="h-4 w-4" />
            Join class
          </button>
        </form>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-slate-400">
          Joining as a guest. Sign in with your Digital Madarsa account to have this class counted
          towards your attendance.
        </p>
      </div>
    </div>
  )
}
