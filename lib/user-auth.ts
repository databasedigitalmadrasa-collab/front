// User authentication utilities
import { apiClient } from "./api-client"

export interface User {
  id: number
  full_name: string
  email: string
  contact: string
  country: string | null
  state: string | null
  profile_pic_url: string | null
  is_student: number
  is_affiliate: number
  is_subscribed: number
  subscription_id: number | null
  plan_id: number | null
  platform_id: number | null
  is_seen_intro: number
  // Affiliate extension
  affiliate?: {
    id: number
    referral_code: string
    referral_link: string
  } | null
  wallet?: any
  affiliate_stats?: any
}

export interface UserLoginResponse {
  success: boolean
  token: string
  user: User
}

export interface UserAuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

const USER_TOKEN_KEY = "user_token"
const USER_DATA_KEY = "user_data"

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

// Save user auth data
export function saveUserAuth(token: string, user: User): void {
  try {
    localStorage.setItem(USER_TOKEN_KEY, token)
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(user))
    setCookie(USER_TOKEN_KEY, token, 7)
    setCookie(USER_DATA_KEY, JSON.stringify(user), 7)
  } catch (error) {
    console.error("Error saving user auth:", error)
  }
}

// Get user auth data
export function getUserAuth(): UserAuthState {
  try {
    let token = localStorage.getItem(USER_TOKEN_KEY)
    let userStr = localStorage.getItem(USER_DATA_KEY)

    if (!token) token = getCookie(USER_TOKEN_KEY)
    if (!userStr) userStr = getCookie(USER_DATA_KEY)

    if (token && userStr) {
      const user = JSON.parse(userStr) as User
      return { user, token, isAuthenticated: true }
    }
  } catch (error) {
    console.error("Error reading user auth:", error)
  }

  return { user: null, token: null, isAuthenticated: false }
}

// Clear user auth data
export function clearUserAuth(): void {
  try {
    localStorage.removeItem(USER_TOKEN_KEY)
    localStorage.removeItem(USER_DATA_KEY)
    deleteCookie(USER_TOKEN_KEY)
    deleteCookie(USER_DATA_KEY)
  } catch (error) {
    console.error("Error clearing user auth:", error)
  }
}

// Login user
export async function loginUser(
  email: string,
  password: string,
): Promise<{
  success: boolean
  error?: string
  user?: User
  token?: string
}> {
  try {
    const response = await apiClient.post<UserLoginResponse>("/users/login", {
      email,
      password,
    })

    if (response.success && response.data) {
      const { token, user } = response.data
      saveUserAuth(token, user)
      return { success: true, user, token }
    }

    return {
      success: false,
      error: response.message || "Login failed. Please try again.",
    }
  } catch (error) {
    console.error("Login error:", error)
    return {
      success: false,
      error: "Network error. Please check your connection.",
    }
  }
}

// Logout user
export function logoutUser(): void {
  clearUserAuth()
}

// Check authentication and role
export function checkUserAccess(): {
  isAuthenticated: boolean
  canAccessDashboard: boolean
  canAccessAffiliate: boolean
  user: User | null
} {
  const { user, isAuthenticated } = getUserAuth()

  return {
    isAuthenticated,
    canAccessDashboard: isAuthenticated && user?.is_student === 1,
    canAccessAffiliate: isAuthenticated && user?.is_affiliate === 1,
    user,
  }
}

// Get current user
export function getCurrentUser(): User | null {
  const { user } = getUserAuth()
  return user
}

export function getUser(): User | null {
  return getCurrentUser()
}

// Get user token
export function getUserToken(): string | null {
  const { token } = getUserAuth()
  return token
}
