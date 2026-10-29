// API Client for Digital Madarsa
//
// This is now a thin compatibility shim over `lib/dm-api.ts`. Its public shape
// is unchanged — `{ success, data, message, errors }`, where `data` is the whole
// parsed response body — because ~116 call sites read `result.data.items`,
// `result.data.user` and friends, and rewriting all of them is a separate job
// from pointing the portal at dm-api.
//
// What moved underneath:
//   • the base URL now comes from `lib/dm-api.ts`, so `NEXT_PUBLIC_API_BASE_URL`
//     actually governs every request instead of the third or so that used to
//     follow it;
//   • 401 handling, token selection and JSON parsing are shared with every
//     other caller rather than reimplemented here.
//
// New code should import `dmApi` from `lib/dm-api` directly: it reports the
// HTTP status and dm-api's error code, which this shape cannot express.
import { dmApi, type Principal } from "./dm-api"

export interface ApiError {
  success: false
  message: string
  errors?: Record<string, string[]>
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string[]>
}

/** Explicit token → use it; otherwise fall back to path-based selection. */
function principalFor(token?: string): { principal: Principal; token?: string | null } {
  return token ? { principal: "none", token } : { principal: "auto" }
}

class ApiClient {
  async get<T>(endpoint: string, token?: string): Promise<ApiResponse<T>> {
    return unwrap<T>(await dmApi.get<T>(endpoint, principalFor(token)))
  }

  async post<T>(endpoint: string, data?: unknown, token?: string): Promise<ApiResponse<T>> {
    return unwrap<T>(await dmApi.post<T>(endpoint, data, principalFor(token)))
  }

  async put<T>(endpoint: string, data?: unknown, token?: string): Promise<ApiResponse<T>> {
    return unwrap<T>(await dmApi.put<T>(endpoint, data, principalFor(token)))
  }

  async delete<T>(endpoint: string, token?: string): Promise<ApiResponse<T>> {
    return unwrap<T>(await dmApi.delete<T>(endpoint, principalFor(token)))
  }
}

function unwrap<T>(result: {
  ok: boolean
  data: T | null
  error: string | null
}): ApiResponse<T> {
  if (!result.ok) {
    return { success: false, message: result.error || "An error occurred" }
  }
  return {
    success: true,
    data: (result.data ?? undefined) as T | undefined,
    message: (result.data as { message?: string } | null)?.message,
  }
}

export const apiClient = new ApiClient()

export default apiClient
