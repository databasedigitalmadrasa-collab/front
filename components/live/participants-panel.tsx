"use client"

/**
 * Who is in the room right now.
 *
 * Fed by the room socket's presence roster rather than by the attendance
 * table, so it reflects open connections and not "everyone who ever clicked
 * the link". Two tabs from one person collapse to one entry server-side.
 */

import { useMemo, useState } from "react"
import { Search, Users } from "lucide-react"
import { avatarTone, initials, type PresenceEntry, type RoomIdentity } from "@/lib/live-room"

export interface ParticipantsPanelProps {
  presence: PresenceEntry[]
  you: RoomIdentity | null
  /** Show the search field. Off in tight spaces, e.g. the student sidebar. */
  searchable?: boolean
  /** Rows shown before "Show all". Zero means no limit. */
  collapseAfter?: number
  className?: string
}

export function ParticipantsPanel({
  presence,
  you,
  searchable = true,
  collapseAfter = 8,
  className = "",
}: ParticipantsPanelProps) {
  const [term, setTerm] = useState("")
  const [expanded, setExpanded] = useState(false)

  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase()
    return q ? presence.filter((p) => p.name.toLowerCase().includes(q)) : presence
  }, [presence, term])

  const limit = collapseAfter > 0 && !expanded && !term ? collapseAfter : filtered.length
  const shown = filtered.slice(0, limit)
  const hidden = filtered.length - shown.length

  return (
    <section className={`flex min-h-0 flex-col rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-bold tracking-tight text-slate-900">
          <Users className="h-4 w-4 text-blue-600" />
          In this class
        </h3>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
          {presence.length}
        </span>
      </div>

      {searchable && presence.length > 5 && (
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search participants…"
            aria-label="Search participants"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      )}

      <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain">
        {shown.length === 0 ? (
          <li className="py-6 text-center text-xs text-slate-400">
            {presence.length === 0 ? "Nobody has joined yet." : "No matching participants."}
          </li>
        ) : (
          shown.map((p) => {
            const isYou = you?.cid === p.cid || (!!you?.userId && you.userId === p.userId)
            return (
              <li
                key={p.cid}
                className="flex items-center justify-between gap-2 rounded-xl px-1.5 py-1.5 transition-colors hover:bg-slate-50"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <div
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${avatarTone(
                      p.name,
                    )}`}
                    aria-hidden
                  >
                    {initials(p.name)}
                  </div>
                  <span className="truncate text-xs font-semibold text-slate-800">
                    {p.name}
                    {isYou && <span className="ml-1 font-medium text-slate-400">(You)</span>}
                  </span>
                  {p.role === "host" && (
                    <span className="flex-shrink-0 rounded bg-blue-100 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-blue-700">
                      Host
                    </span>
                  )}
                  {p.role === "guest" && (
                    <span className="flex-shrink-0 rounded bg-slate-100 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-slate-500">
                      Guest
                    </span>
                  )}
                </div>
                <span
                  className="h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500"
                  title="Connected"
                  aria-label="Connected"
                />
              </li>
            )
          })
        )}
      </ul>

      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
        >
          Show all {filtered.length}
        </button>
      )}
      {expanded && collapseAfter > 0 && filtered.length > collapseAfter && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="mt-3 w-full rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          Show less
        </button>
      )}
    </section>
  )
}
