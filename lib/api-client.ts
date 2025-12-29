// API Client for Digital Madarsa
import { getAdminToken, clearAuth as clearAdminAuth } from "./auth"
import { getUserToken, clearUserAuth } from "./user-auth"

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL || "https://srv.digitalmadrasa.co.in"}/api/v1`

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

class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private getAutoToken(): string | null {
    if (typeof window === "undefined") return null;

    // Determine context based on URL
    const pathname = window.location.pathname;

    if (pathname.startsWith("/admin")) {
      return getAdminToken();
    } else {
      return getUserToken();
    }
  }

  private handleUnauthorized() {
    if (typeof window === "undefined") return;

    const pathname = window.location.pathname;

    if (pathname.startsWith("/admin")) {
      clearAdminAuth();
      window.location.href = "/admin-login?error=session_expired";
    } else {
      clearUserAuth();
      window.location.href = "/login?error=session_expired";
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`

    // Auto-inject token if not provided in headers
    let headers = {
      "Content-Type": "application/json",
      ...options.headers,
    } as Record<string, string>;

    if (!headers["Authorization"] && !headers["authorization"]) {
      const token = this.getAutoToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    const config: RequestInit = {
      ...options,
      headers,
    }

    try {
      const response = await fetch(url, config)

      if (response.status === 401) {
        this.handleUnauthorized();
        return {
          success: false,
          message: "Session expired. Please login again.",
        };
      }

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          message: data.message || "An error occurred",
          errors: data.errors,
        }
      }

      return {
        success: true,
        data,
        message: data.message,
      }
    } catch (error) {
      console.error("API Request Error:", error)
      return {
        success: false,
        message: "Network error. Please try again.",
      }
    }
  }

  async get<T>(endpoint: string, token?: string): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    return this.request<T>(endpoint, {
      method: "GET",
      headers,
    })
  }

  async post<T>(endpoint: string, data?: unknown, token?: string): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
      headers,
    })
  }

  async put<T>(endpoint: string, data?: unknown, token?: string): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
      headers,
    })
  }

  async delete<T>(endpoint: string, token?: string): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    return this.request<T>(endpoint, {
      method: "DELETE",
      headers,
    })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)

export default apiClient
