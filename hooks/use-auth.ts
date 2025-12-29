"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  loginAdmin as loginAdminApi,
  logoutAdmin as logoutAdminApi,
  getAuth,
  isAuthenticated as checkAuth,
  type AuthState,
} from "@/lib/auth"

export function useAuth() {
  const router = useRouter()
  const [authState, setAuthState] = useState<AuthState>({
    admin: null,
    token: null,
    isAuthenticated: false,
  })
  const [isLoading, setIsLoading] = useState(true)

  // Initialize auth state from storage
  useEffect(() => {
    const auth = getAuth()
    setAuthState(auth)
    setIsLoading(false)
    console.log("[v0] Auth state initialized:", auth.isAuthenticated ? "authenticated" : "not authenticated")
  }, [])

  // Login function
  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true)
      const result = await loginAdminApi(email, password)

      if (result.success && result.admin && result.token) {
        setAuthState({
          admin: result.admin,
          token: result.token,
          isAuthenticated: true,
        })
        console.log("[v0] Login successful, redirecting to admin dashboard")
        router.push("/admin")
      }

      setIsLoading(false)
      return result
    },
    [router],
  )

  // Logout function
  const logout = useCallback(() => {
    logoutAdminApi()
    setAuthState({
      admin: null,
      token: null,
      isAuthenticated: false,
    })
    console.log("[v0] Logout successful, redirecting to login")
    router.push("/admin-login")
  }, [router])

  // Refresh auth state
  const refresh = useCallback(() => {
    const auth = getAuth()
    setAuthState(auth)
  }, [])

  return {
    admin: authState.admin,
    token: authState.token,
    isAuthenticated: authState.isAuthenticated,
    isLoading,
    login,
    logout,
    refresh,
  }
}

// Hook for protecting admin routes
export function useRequireAuth() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const auth = checkAuth()
    console.log("[v0] Checking auth for protected route:", auth ? "authorized" : "unauthorized")

    if (!auth) {
      console.log("[v0] Redirecting to login page")
      router.push("/admin-login")
    } else {
      setIsChecking(false)
    }
  }, [router])

  return { isChecking }
}
