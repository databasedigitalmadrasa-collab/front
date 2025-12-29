// Authentication utilities for admin authentication
import { apiClient } from "./api-client"

export interface AdminUser {
  id: number
  name: string
  email: string
  role: string
}

export interface LoginResponse {
  success: boolean
  token: string
  admin: AdminUser
}

export interface AuthState {
  admin: AdminUser | null
  token: string | null
  isAuthenticated: boolean
}

const AUTH_TOKEN_KEY = "admin_token"
const AUTH_USER_KEY = "admin_user"

// Cookie utilities
function setCookie(name: string, value: string, days = 7) {
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`
}

function getCookie(name: string): string | null {
  const nameEQ = name + "="
  const ca = document.cookie.split(";")
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === " ") c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
  }
  return null
}

function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
}

// Save auth data to localStorage and cookies
export function saveAuth(token: string, admin: AdminUser): void {
  try {
    // Save to localStorage
    localStorage.setItem(AUTH_TOKEN_KEY, token)
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(admin))

    // Save to cookies
    setCookie(AUTH_TOKEN_KEY, token, 7)
    setCookie(AUTH_USER_KEY, JSON.stringify(admin), 7)

    console.log("[v0] Auth data saved successfully")
  } catch (error) {
    console.error("[v0] Error saving auth data:", error)
  }
}

// Get auth data from localStorage or cookies
export function getAuth(): AuthState {
  try {
    // Try localStorage first
    let token = localStorage.getItem(AUTH_TOKEN_KEY)
    let userStr = localStorage.getItem(AUTH_USER_KEY)

    // Fallback to cookies if localStorage is empty
    if (!token) {
      token = getCookie(AUTH_TOKEN_KEY)
    }
    if (!userStr) {
      userStr = getCookie(AUTH_USER_KEY)
    }

    if (token && userStr) {
      const admin = JSON.parse(userStr) as AdminUser
      return {
        admin,
        token,
        isAuthenticated: true,
      }
    }
  } catch (error) {
    console.error("[v0] Error reading auth data:", error)
  }

  return {
    admin: null,
    token: null,
    isAuthenticated: false,
  }
}

// Clear auth data from localStorage and cookies
export function clearAuth(): void {
  try {
    // Clear localStorage
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_USER_KEY)

    // Clear cookies
    deleteCookie(AUTH_TOKEN_KEY)
    deleteCookie(AUTH_USER_KEY)

    console.log("[v0] Auth data cleared successfully")
  } catch (error) {
    console.error("[v0] Error clearing auth data:", error)
  }
}

// Login admin user
export async function loginAdmin(
  email: string,
  password: string,
): Promise<{
  success: boolean
  error?: string
  admin?: AdminUser
  token?: string
}> {
  try {
    const response = await apiClient.post<LoginResponse>("/admins/login", {
      email,
      password,
    })

    if (response.success && response.data) {
      const { token, admin } = response.data

      // Save auth data
      saveAuth(token, admin)

      return {
        success: true,
        admin,
        token,
      }
    }

    return {
      success: false,
      error: response.message || "Login failed. Please try again.",
    }
  } catch (error) {
    console.error("[v0] Login error:", error)
    return {
      success: false,
      error: "Network error. Please check your connection.",
    }
  }
}

// Logout admin user
export function logoutAdmin(): void {
  clearAuth()
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  const { isAuthenticated } = getAuth()
  return isAuthenticated
}

// Get current admin user
export function getCurrentAdmin(): AdminUser | null {
  const { admin } = getAuth()
  return admin
}

// Get auth token
export function getAuthToken(): string | null {
  const { token } = getAuth()
  return token
}

export const getAdminToken = getAuthToken
