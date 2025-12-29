"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  loginUser as loginUserApi,
  logoutUser as logoutUserApi,
  getUserAuth,
  checkUserAccess,
  saveUserAuth,
  type UserAuthState,
  type User,
} from "@/lib/user-auth"
import apiClient from "@/lib/api-client"

export function useUserAuth() {
  const router = useRouter()
  const [authState, setAuthState] = useState<UserAuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
  })
  const [isLoading, setIsLoading] = useState(true)

  // Initialize auth state and fetch fresh data
  useEffect(() => {
    const initAuth = async () => {
      const auth = getUserAuth()
      setAuthState(auth)
      setIsLoading(false)

      if (auth.isAuthenticated && auth.token) {
        try {
          // Fetch fresh user data
          // Expect backend to return { success: true, user: User, affiliate?: ..., wallet?: ..., stats?: ... }
          // We cast the response type to include these fields.
          const response = await apiClient.get<any>("/users/me", auth.token)
          if (response.success && response.data?.user) {
            const fetchedUser = response.data.user

            // Merge extra fields if they exist
            if (response.data.affiliate) fetchedUser.affiliate = response.data.affiliate
            if (response.data.wallet) fetchedUser.wallet = response.data.wallet
            if (response.data.stats) fetchedUser.affiliate_stats = response.data.stats

            // Update state
            setAuthState(prev => ({ ...prev, user: fetchedUser }))
            // Update storage
            saveUserAuth(auth.token, fetchedUser)
          }
        } catch (e) {
          console.error("Failed to refresh user data", e)
        }
      }
    }

    initAuth()
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true)
      const result = await loginUserApi(email, password)

      if (result.success && result.user && result.token) {
        setAuthState({
          user: result.user,
          token: result.token,
          isAuthenticated: true,
        })

        // Determine redirect based on role
        if (result.user.is_student === 1) {
          router.push("/dashboard")
        } else if (result.user.is_affiliate === 1) {
          router.push("/affiliate")
        } else {
          router.push("/")
        }
      }

      setIsLoading(false)
      return result
    },
    [router],
  )

  const logout = useCallback(() => {
    logoutUserApi()
    setAuthState({ user: null, token: null, isAuthenticated: false })
    router.push("/login")
  }, [router])

  const refresh = useCallback(() => {
    const auth = getUserAuth()
    setAuthState(auth)
  }, [])

  return {
    user: authState.user,
    token: authState.token,
    isAuthenticated: authState.isAuthenticated,
    isLoading,
    login,
    logout,
    refresh,
    isStudent: authState.user?.is_student === 1,
    isAffiliate: authState.user?.is_affiliate === 1,
  }
}

// Hook for protecting user routes
export function useRequireUserAuth(role?: "student" | "affiliate") {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    const access = checkUserAccess()

    if (!access.isAuthenticated) {
      router.push("/login")
      return
    }

    if (role === "student" && !access.canAccessDashboard) {
      router.push("/login?error=access_denied")
      return
    }

    if (role === "affiliate" && !access.canAccessAffiliate) {
      router.push("/login?error=access_denied")
      return
    }

    setIsAuthorized(true)
    setIsChecking(false)
  }, [router, role])

  return { isChecking, isAuthorized }
}
