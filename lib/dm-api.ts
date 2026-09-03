/**
 * dm-api connection layer — the single source of truth for where the backend
 * lives and how the portal talks to it.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Before it, the portal reached the backend five different ways:
 *
 *   1. `const API_BASE_URL = "https://srv.digitalmadrasa.co.in/api/v1"` — a
 *      module constant, copied into ~12 files.
 *   2. `process.env.NEXT_PUBLIC_API_BASE_URL || "https://srv.digitalmadrasa.co.in"`
 *      — 5 files.
 *   3. `lib/api-client.ts`, which is style 2 plus automatic token injection.
 *   4. `process.env.NEXT_PUBLIC_API_URL || …` — a DIFFERENT env var that is
 *      defined nowhere, so it always fell through to the hardcoded host.
 *   5. `https://dm-backend.copybykhan.workers.dev` — the previous worker,
 *      hardcoded on the landing page.
 *
 * Only style 2 and 3 follow `.env.local`. Pointing the portal at dm-api by
 * editing an env var therefore moved about a third of the traffic and silently
 * left the rest on the old backend — the kind of half-cutover that looks like
 * it works until an endpoint diverges. Every call site now resolves its base
 * URL here, so the cutover is one variable.
 *
 * USAGE
 * -----
 *   import { dmApi, apiUrl } from "@/lib/dm-api"
 *
 *   const plans = await dmApi.get<PlansResponse>("/subscription-plans")   // typed, auth-aware
 *   const res   = await fetch(apiUrl("/courses"))                          // raw fetch, same base
 *
 * `dmApi` attaches the right bearer token automatically — see `resolveToken`.
 * That matters more than it used to: dm-backend accepted `auth: false` on
 * routes that dm-api now guards with `requireAdmin()`, so a call that used to
 * work anonymously will 401 unless the token goes with it.
 */

/* ── base URL ───────────────────────────────────────────────────────────── */

/**
 * Backend origin, no trailing slash and no `/api/v1`.
 *
 * `NEXT_PUBLIC_` is required: these calls run in the browser, and Next only
 * inlines variables with that prefix into client bundles. The value is baked in
 * at build time, so changing it means a rebuild, not just a restart.
 *
 * The fallback is the CURRENT production backend, deliberately — an
 * unconfigured build keeps working rather than failing closed against a host
 * that may not be serving yet.
 */
export const API_ORIGIN = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://srv.digitalmadrasa.co.in"
).replace(/\/+$/, "")

/** Versioned API root, e.g. `https://api.example.com/api/v1`. */
export const API_BASE_URL = `${API_ORIGIN}/api/v1`

/**
 * Absolute URL for a path relative to `/api/v1`.
 *
 * Use this for raw `fetch` — file uploads, streaming, and anywhere the response
 * is not JSON, since `dmApi` parses JSON. Leading slash optional.
 */
export function apiUrl(path: string): string {
  return `${API_BASE_URL}/${String(path).replace(/^\/+/, "")}`
}

/** Absolute URL against the backend ORIGIN, for paths outside `/api/v1`. */
export function originUrl(path: string): string {
  return `${API_ORIGIN}/${String(path).replace(/^\/+/, "")}`
}

/* ── tokens ─────────────────────────────────────────────────────────────── */

export type Principal = "admin" | "user" | "auto" | "none"

function readStorage(key: string): string | null {
  if (typeof window === "undefined") return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    // Safari in private mode throws on localStorage access rather than
    // returning null. An unreadable store means "not logged in here".
    return null
  }
}

export function getAdminToken(): string | null {
  return readStorage("admin_token")
}

export function getUserToken(): string | null {
  return readStorage("user_token")
}

/**
 * Which token to send.
 *
 * `auto` keeps the behaviour `lib/api-client.ts` already had — pick by URL
 * prefix, admin under `/admin`, learner everywhere else. That is right for
 * pages but wrong for shared components, so callers that know which principal
 * they are can say so explicitly instead.
 */
export function resolveToken(principal: Principal = "auto"): string | null {
  if (principal === "none") return null
  if (principal === "admin") return getAdminToken()
  if (principal === "user") return getUserToken()

  if (typeof window === "undefined") return null
  return window.location.pathname.startsWith("/admin") ? getAdminToken() : getUserToken()
}

/* ── responses ──────────────────────────────────────────────────────────── */

/**
 * dm-api's frozen envelope: `{ success: true, ... }` or
 * `{ success: false, error }`. The payload key varies by endpoint — `items` for
 * collections, `data` for single rows, `user` / `admin` for principals — so the
 * generic is the whole body rather than an unwrapped field.
 */
export interface DmApiEnvelope {
  success: boolean
  error?: string
  message?: string
  [key: string]: unknown
}

export interface DmApiResult<T> {
  ok: boolean
  status: number
  /** Parsed body when the response carried JSON, else null. */
  data: T | null
  /** Human-readable failure reason. Null on success. */
  error: string | null
  /** dm-api's machine-readable code, e.g. `SESSION_EXPIRED`. */
  code: string | null
}

export class DmApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code: string | null = null,
  ) {
    super(message)
    this.name = "DmApiError"
  }
}

export interface RequestOptions {
  principal?: Principal
  /** Explicit bearer token, overriding `principal`. */
  token?: string | null
  headers?: Record<string, string>
  signal?: AbortSignal
  cache?: RequestCache
  /**
   * On 401, clear local auth and bounce to the right login screen.
   * Default true in the browser. Turn it off for background polling, which
   * should not yank a user out of a page they are working in.
   */
  redirectOnUnauthorized?: boolean
  /** Throw `DmApiError` instead of returning `{ ok: false }`. */
  throwOnError?: boolean
}

/**
 * Session expiry, handled once.
 *
 * dm-api distinguishes "log in again" from "forbidden": it returns 401 with
 * `code: "SESSION_EXPIRED"` when a learner's single-active-session token has
 * been rotated by a login elsewhere, and 403 when the principal is simply not
 * allowed. Only the former should log anybody out — treating 403 as expiry
 * would boot a learner who merely touched an admin route.
 */
function handleUnauthorized(): void {
  if (typeof window === "undefined") return

  const isAdmin = window.location.pathname.startsWith("/admin")
  try {
    for (const key of isAdmin
      ? ["admin_token", "admin_user"]
      : ["user_token", "user_data"]) {
      window.localStorage.removeItem(key)
      document.cookie = `${key}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
    }
  } catch {
    // Nothing to clear; the redirect below is still the right move.
  }

  window.location.href = isAdmin
    ? "/admin-login?error=session_expired"
    : "/login?error=session_expired"
}

async function request<T = DmApiEnvelope>(
  method: string,
  path: string,
  bodyValue: unknown,
  options: RequestOptions = {},
): Promise<DmApiResult<T>> {
  const {
    principal = "auto",
    token,
    headers: extraHeaders = {},
    signal,
    cache,
    redirectOnUnauthorized = true,
    throwOnError = false,
  } = options

  const headers: Record<string, string> = { ...extraHeaders }

  // Only set Content-Type when there is a body. A GET with a JSON content type
  // makes some proxies preflight unnecessarily.
  if (bodyValue !== undefined && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json"
  }

  if (!headers.Authorization && !headers.authorization) {
    const bearer = token !== undefined ? token : resolveToken(principal)
    if (bearer) headers.Authorization = `Bearer ${bearer}`
  }

  let response: Response
  try {
    response = await fetch(apiUrl(path), {
      method,
      headers,
      body: bodyValue === undefined ? undefined : JSON.stringify(bodyValue),
      signal,
      ...(cache ? { cache } : {}),
    })
  } catch (err) {
    // Network-level failure: no status, no body. Distinguish it from a 4xx so
    // callers can offer "retry" rather than "your input was wrong".
    const message =
      (err as Error)?.name === "AbortError"
        ? "Request cancelled"
        : "Network error. Please check your connection and try again."
    if (throwOnError) throw new DmApiError(0, message)
    return { ok: false, status: 0, data: null, error: message, code: null }
  }

  let parsed: (DmApiEnvelope & Record<string, unknown>) | null = null
  const contentType = response.headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    try {
      parsed = (await response.json()) as DmApiEnvelope
    } catch {
      parsed = null
    }
  }

  const code = typeof parsed?.code === "string" ? parsed.code : null

  if (response.status === 401) {
    if (redirectOnUnauthorized) handleUnauthorized()
    const message = (parsed?.error as string) || "Session expired. Please log in again."
    if (throwOnError) throw new DmApiError(401, message, code)
    return { ok: false, status: 401, data: null, error: message, code }
  }

  // dm-api answers `{ success: false, error }` with a 4xx/5xx status, so both
  // halves are checked: a 200 carrying `success: false` is still a failure.
  if (!response.ok || parsed?.success === false) {
    const message =
      (parsed?.error as string) ||
      (parsed?.message as string) ||
      `Request failed (${response.status})`
    if (throwOnError) throw new DmApiError(response.status, message, code)
    return { ok: false, status: response.status, data: parsed as T | null, error: message, code }
  }

  return { ok: true, status: response.status, data: parsed as T | null, error: null, code }
}

/**
 * The client. Every method returns `{ ok, data, error, status }` rather than
 * throwing, because most call sites in this app render an error state instead
 * of unwinding. Pass `throwOnError: true` where a throw is more convenient.
 */
export const dmApi = {
  get: <T = DmApiEnvelope>(path: string, options?: RequestOptions) =>
    request<T>("GET", path, undefined, options),
  post: <T = DmApiEnvelope>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, body, options),
  put: <T = DmApiEnvelope>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, body, options),
  patch: <T = DmApiEnvelope>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, body, options),
  delete: <T = DmApiEnvelope>(path: string, options?: RequestOptions) =>
    request<T>("DELETE", path, undefined, options),

  /**
   * Escape hatch for non-JSON traffic — R2 uploads, file downloads, streams.
   * Resolves the base URL and the bearer token the same way, then hands back
   * the raw `Response` untouched.
   */
  raw: (path: string, init: RequestInit = {}, options: RequestOptions = {}) => {
    const headers = new Headers(init.headers)
    if (!headers.has("Authorization")) {
      const bearer =
        options.token !== undefined ? options.token : resolveToken(options.principal ?? "auto")
      if (bearer) headers.set("Authorization", `Bearer ${bearer}`)
    }
    return fetch(apiUrl(path), { ...init, headers })
  },
}

export default dmApi
