"use client"

/**
 * Class materials.
 *
 * These used to be React state in the host studio: the teacher typed a link,
 * saw it appear, reloaded, and it was gone — and no student ever saw it at
 * all. They are rows now, and adding one broadcasts to everybody watching.
 */

import { useState } from "react"
import {
  ExternalLink,
  FileAudio,
  FileImage,
  FileText,
  FileType,
  Link2,
  Loader2,
  Plus,
  Trash2,
  Video,
} from "lucide-react"
import type { RoomMaterial } from "@/lib/live-room"

const ICONS: Record<string, { icon: typeof FileText; className: string }> = {
  pdf: { icon: FileText, className: "text-rose-600 bg-rose-50" },
  video: { icon: Video, className: "text-emerald-600 bg-emerald-50" },
  audio: { icon: FileAudio, className: "text-violet-600 bg-violet-50" },
  image: { icon: FileImage, className: "text-amber-600 bg-amber-50" },
  doc: { icon: FileType, className: "text-blue-600 bg-blue-50" },
  link: { icon: Link2, className: "text-slate-500 bg-slate-100" },
}

export interface MaterialsPanelProps {
  materials: RoomMaterial[]
  canManage: boolean
  onAdd?: (m: { title: string; url: string; size_label?: string }) => Promise<string | null>
  onRemove?: (id: number) => Promise<string | null>
  className?: string
}

export function MaterialsPanel({
  materials,
  canManage,
  onAdd,
  onRemove,
  className = "",
}: MaterialsPanelProps) {
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!onAdd || saving) return

    setSaving(true)
    setError(null)
    const failure = await onAdd({ title: title.trim(), url: url.trim() })
    setSaving(false)

    if (failure) {
      setError(failure)
      return
    }
    setTitle("")
    setUrl("")
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {canManage && onAdd && (
        <form onSubmit={add} className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title, e.g. Surah Al-Baqarah notes"
              aria-label="Material title"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              aria-label="Material link"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={!title.trim() || !url.trim() || saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Share with class
            </button>
            {error && <span className="text-[11px] text-rose-600">{error}</span>}
          </div>
        </form>
      )}

      {materials.length === 0 ? (
        <p className="rounded-xl bg-slate-50 py-8 text-center text-xs text-slate-400">
          {canManage
            ? "No materials shared yet. Add a link above and every student sees it instantly."
            : "The teacher has not shared any materials for this class yet."}
        </p>
      ) : (
        <ul className="space-y-2">
          {materials.map((m) => {
            const { icon: Icon, className: iconClass } = ICONS[m.file_type ?? "link"] ?? ICONS.link
            return (
              <li
                key={m.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${iconClass}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900">{m.title}</p>
                    <p className="truncate text-[11px] text-slate-400">
                      {m.size_label ? `${m.size_label} · ` : ""}
                      {hostOf(m.url)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-shrink-0 items-center gap-1">
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-blue-600 transition-colors hover:bg-blue-50"
                  >
                    Open
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  {canManage && onRemove && (
                    <button
                      type="button"
                      onClick={() => onRemove(m.id)}
                      aria-label={`Remove ${m.title}`}
                      className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/** Domain only — the full URL never fits and the host is the useful part. */
function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}
