import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// --- Route Configurations ---
const ROUTES = {
  ADMIN: {
    LOGIN: "/admin-login",
    ROOT: "/admin",
    PROTECTED_PREFIXES: ["/admin"],
  },
  USER: {
    LOGIN: "/login",
    DASHBOARD_PREFIXES: ["/dashboard"],
    AFFILIATE_PREFIXES: ["/affiliate"],
  },
  PUBLIC: {
    HOME: "/",
  }
}

// Routes that don't need auth even if they start with a protected prefix (exceptions)
const PUBLIC_EXCEPTIONS = [
  "/admin-login",
  "/login",
  "/forgot-password",
  "/reset-password"
];

const isDevelopment = process.env.NODE_ENV === "development"

export function middleware(request: NextRequest) {
  // if (isDevelopment) return NextResponse.next()

  const { pathname } = request.nextUrl

  // Ignore public exceptions immediately
  if (PUBLIC_EXCEPTIONS.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
    return NextResponse.next()
  }

  // --- 1. Admin Auth Check ---
  const isAdminRoute = ROUTES.ADMIN.PROTECTED_PREFIXES.some(prefix =>
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  )

  if (isAdminRoute) {
    const token = request.cookies.get("admin_token")?.value
    if (!token) {
      const loginUrl = new URL(ROUTES.ADMIN.LOGIN, request.url)
      // Optional: Add `?next=` param here
      return NextResponse.redirect(loginUrl)
    }
    // Basic existence check passed. Validation happens on API/Server side.
  }

  // --- 2. User (Student) Auth Check ---
  const isDashboardRoute = ROUTES.USER.DASHBOARD_PREFIXES.some(prefix =>
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  )

  if (isDashboardRoute) {
    const token = request.cookies.get("user_token")?.value
    const userStr = request.cookies.get("user_data")?.value

    if (!token || !userStr) {
      const loginUrl = new URL(ROUTES.USER.LOGIN, request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }

    try {
      const user = JSON.parse(userStr)
      if (user.is_student !== 1) {
        const unauthorizedUrl = new URL(ROUTES.USER.LOGIN, request.url)
        unauthorizedUrl.searchParams.set("error", "dashboard_access_denied")
        return NextResponse.redirect(unauthorizedUrl)
      }
    } catch (e) {
      // Malformed cookie data
      const loginUrl = new URL(ROUTES.USER.LOGIN, request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  // --- 3. User (Affiliate) Auth Check ---
  const isAffiliateRoute = ROUTES.USER.AFFILIATE_PREFIXES.some(prefix =>
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  )

  if (isAffiliateRoute) {
    const token = request.cookies.get("user_token")?.value
    const userStr = request.cookies.get("user_data")?.value

    if (!token || !userStr) {
      const loginUrl = new URL(ROUTES.USER.LOGIN, request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }

    try {
      const user = JSON.parse(userStr)
      if (user.is_affiliate !== 1) {
        const unauthorizedUrl = new URL(ROUTES.USER.LOGIN, request.url)
        unauthorizedUrl.searchParams.set("error", "affiliate_access_denied")
        return NextResponse.redirect(unauthorizedUrl)
      }
    } catch (e) {
      const loginUrl = new URL(ROUTES.USER.LOGIN, request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/affiliate/:path*"
  ],
}
