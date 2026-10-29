"use client"

/**
 * Co-host and guest-host links.
 *
 * One link per person, not one link for everyone. A guest host link carries
 * the right to put a camera on the broadcast, so it has to be revocable on its
 * own — sharing the class's guest token and granting stage rights to whoever
 * holds it would mean the only way to remove one co-host is to invalidate the
 * link every student in the class is using.
 *
 * The seat count is by person rather than by request: the same browser
 * reloading, or reconnecting after a dropped train connection, does not burn a
 * seat. That is what makes `max_uses = 1` a usable setting rather than a trap.
 */

import { useCallback, useEffect, useState } from "react"
import {
  Check,
  Copy,
  Link2,
  Loader2,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react"
import {
  stageInviteApi,
  stageInviteUrl,
  type NewStageInvite,
  type StageInvite,
} from "@/lib/live-stage"

export interface CohostLinksProps {
  classId: number | string
  className?: string
}

export function CohostLinks({ classId, className = "" }: CohostLinksProps) {
  const [invites, setInvites] = useState<StageInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState<number | null>(null)

  const load = useCallback(async () => {
    const res = await stageInviteApi.list(classId)
    setLoading(false)
    if (!res.ok || !res.data) {
      setError(res.error || "Could not load the co-host links.")
      return
    }
    setError(null)
    setInvites(res.data.items ?? [])
  }, [classId])

  useEffect(() => {
    void load()
  }, [load])

  const create = async (invite: NewStageInvite) => {
    setBusy(true)
    const res = await stageInviteApi.create(classId, invite)
    setBusy(false)
    if (!res.ok) {
      setError(res.error || "Could not create the link.")
      return false
    }
    setError(null)
    setCreating(false)
    await load()
    return true
  }

  const patch = async (invite: StageInvite, changes: Partial<NewStageInvite & { revoked: boolean }>) => {
    setBusy(true)
    const res = await stageInviteApi.update(classId, invite.id, changes)
    setBusy(false)
    if (!res.ok) {
      setError(res.error || "Could not update the link.")
      return
    }
    setError(null)
    await load()
  }

  const remove = async (invite: StageInvite) => {
    setBusy(true)
    const res = await stageInviteApi.remove(classId, invite.id)
    setBusy(false)
    if (!res.ok) {
      setError(res.error || "Could not delete the link.")
      return
    }
    await load()
  }

  const copy = async (invite: StageInvite) => {
    const url = stageInviteUrl(invite.token)
    try {
      await navigator.clipboard.writeText(url)
      setCopied(invite.id)
      setTimeout(() => setCopied((id) => (id === invite.id ? null : id)), 1800)
    } catch {
      // Clipboard access is denied in some embedded contexts; the input below
      // is selectable so the link is still obtainable.
      setError("Copying was blocked. Select the link and copy it manually.")
    }
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-xs font-bold text-slate-900">Co-host links</h4>
          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
            Anyone opening one of these joins the stage with their own camera and appears in your
            source list.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-slate-800"
        >
          <Plus className="h-3.5 w-3.5" />
          New link
        </button>
      </div>

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-800">
          {error}
        </p>
      )}

      {creating && <CreateForm busy={busy} onCancel={() => setCreating(false)} onCreate={create} />}

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        </div>
      ) : !invites.length ? (
        <p className="rounded-xl bg-slate-50 px-3 py-5 text-center text-[11px] text-slate-400">
          No co-host links yet.
        </p>
      ) : (
        invites.map((invite) => (
          <InviteRow
            key={invite.id}
            invite={invite}
            busy={busy}
            copied={copied === invite.id}
            onCopy={() => void copy(invite)}
            onRevoke={() => void patch(invite, { revoked: !invite.revoked })}
            onDelete={() => void remove(invite)}
          />
        ))
      )}
    </div>
  )
}

/* ── one link ───────────────────────────────────────────────────────────── */

function InviteRow({
  invite,
  busy,
  copied,
  onCopy,
  onRevoke,
  onDelete,
}: {
  invite: StageInvite
  busy: boolean
  copied: boolean
  onCopy: () => void
  onRevoke: () => void
  onDelete: () => void
}) {
  const url = stageInviteUrl(invite.token)
  const seatsLeft = invite.max_uses > 0 ? invite.max_uses - invite.used_count : null

  return (
    <div
      className={`space-y-2 rounded-xl border p-2.5 ${
        invite.revoked ? "border-slate-200 bg-slate-50 opacity-70" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${
            invite.revoked ? "bg-slate-200 text-slate-400" : "bg-indigo-100 text-indigo-600"
          }`}
        >
          <UserPlus className="h-3.5 w-3.5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-bold text-slate-800">
            {invite.label}
            {invite.revoked && <span className="ml-1.5 text-rose-600">· revoked</span>}
          </p>
          <p className="flex flex-wrap items-center gap-x-2 text-[10px] text-slate-500">
            <span>{invite.role === "guest" ? "Guest — camera only" : "Co-host"}</span>
            {!!invite.can_moderate && (
              <span className="inline-flex items-center gap-0.5 text-emerald-700">
                <ShieldCheck className="h-2.5 w-2.5" />
                moderates
              </span>
            )}
            <span className="inline-flex items-center gap-0.5">
              <Users className="h-2.5 w-2.5" />
              {invite.used_count} used
              {seatsLeft !== null && `, ${Math.max(0, seatsLeft)} left`}
            </span>
          </p>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={onRevoke}
          title={invite.revoked ? "Restore this link" : "Revoke this link"}
          className="flex-shrink-0 rounded-lg bg-slate-100 p-1.5 text-slate-500 transition-colors hover:bg-slate-200 disabled:opacity-40"
        >
          {invite.revoked ? <RotateCcw className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onDelete}
          title="Delete this link"
          className="flex-shrink-0 rounded-lg bg-slate-100 p-1.5 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <Link2 className="h-3 w-3 flex-shrink-0 text-slate-400" />
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="min-w-0 flex-1 truncate rounded-lg bg-slate-50 px-2 py-1.5 font-mono text-[10px] text-slate-600"
        />
        <button
          type="button"
          onClick={onCopy}
          className="flex-shrink-0 rounded-lg bg-slate-900 px-2 py-1.5 text-[10px] font-bold text-white transition-colors hover:bg-slate-800"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </button>
      </div>
    </div>
  )
}

/* ── create ─────────────────────────────────────────────────────────────── */

function CreateForm({
  busy,
  onCancel,
  onCreate,
}: {
  busy: boolean
  onCancel: () => void
  onCreate: (invite: NewStageInvite) => Promise<boolean>
}) {
  const [label, setLabel] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [role, setRole] = useState<"cohost" | "guest">("cohost")
  const [canModerate, setCanModerate] = useState(false)
  const [nameLocked, setNameLocked] = useState(false)
  const [maxUses, setMaxUses] = useState("1")

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim()) return
    const ok = await onCreate({
      label: label.trim(),
      role,
      can_moderate: canModerate,
      display_name: displayName.trim() || null,
      name_locked: nameLocked && !!displayName.trim(),
      max_uses: Number(maxUses) || 0,
    })
    if (ok) {
      setLabel("")
      setDisplayName("")
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
      <label className="block">
        <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
          Who is this link for?
        </span>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Qari Sahab — Friday panel"
          required
          autoFocus
          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] focus:border-blue-500 focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
          Name shown on screen (optional)
        </span>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Ustadh Ahmed"
          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] focus:border-blue-500 focus:outline-none"
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Rights
          </span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "cohost" | "guest")}
            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px]"
          >
            <option value="cohost">Co-host</option>
            <option value="guest">Guest — camera only</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
            People allowed
          </span>
          <input
            type="number"
            min={0}
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px]"
          />
          <span className="mt-0.5 block text-[10px] text-slate-400">0 for unlimited</span>
        </label>
      </div>

      <Toggle
        checked={canModerate}
        onChange={setCanModerate}
        label="Can moderate"
        hint="Answer questions, pin, delete, post materials"
      />
      <Toggle
        checked={nameLocked}
        onChange={setNameLocked}
        disabled={!displayName.trim()}
        label="Lock the name"
        hint="They cannot rename themselves before joining"
      />

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={busy || !label.trim()}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-[11px] font-bold text-white transition-colors hover:bg-slate-800 disabled:opacity-40"
        >
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Create link
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-600 transition-colors hover:bg-white"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
  disabled,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  hint: string
  disabled?: boolean
}) {
  return (
    <label className={`flex items-start gap-2 ${disabled ? "opacity-50" : ""}`}>
      <input
        type="checkbox"
        checked={checked && !disabled}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 accent-slate-900"
      />
      <span className="min-w-0">
        <span className="block text-[11px] font-bold text-slate-700">{label}</span>
        <span className="block text-[10px] leading-relaxed text-slate-500">{hint}</span>
      </span>
    </label>
  )
}
