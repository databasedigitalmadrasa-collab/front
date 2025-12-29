# Digital Madarsa - Routes & Pages Documentation

## Overview

Digital Madarsa is a comprehensive learning management platform that helps students transform into global freelancers in 90 days. The platform includes three main user portals: Student Dashboard, Affiliate Dashboard, and Admin Dashboard.

---

## Route Structure

### Public Routes

| Route | File | Description |
|-------|------|-------------|
| `/` | `app/page.tsx` | Landing page showcasing the program, skills offered, testimonials, and enrollment CTA |
| `/login` | `app/login/page.tsx` | Student login page with email/password authentication |
| `/forgot-password` | `app/forgot-password/page.tsx` | Password recovery page for students |
| `/enroll` | `app/enroll/page.tsx` | Enrollment/registration page for new students |
| `/admin-login` | `app/admin-login/page.tsx` | Admin and staff login page (separate from student login) |

---

## Student Dashboard Routes

**Base Path:** `/dashboard`  
**Layout:** `app/dashboard/layout.tsx` - Includes sidebar navigation and topbar with user profile

| Route | File | Description |
|-------|------|-------------|
| `/dashboard` | `app/dashboard/page.tsx` | Main dashboard showing progress, active courses, and quick stats |
| `/dashboard/skills` | `app/dashboard/skills/page.tsx` | List of all available courses/skills |
| `/dashboard/skills/[courseId]` | `app/dashboard/skills/[courseId]/page.tsx` | Individual course page with lessons, videos, and content |
| `/dashboard/certificates` | `app/dashboard/certificates/page.tsx` | View and download earned certificates |
| `/dashboard/billing` | `app/dashboard/billing/page.tsx` | Subscription plans, payment history, and billing management |
| `/dashboard/settings` | `app/dashboard/settings/page.tsx` | User profile settings and preferences |
| `/dashboard/support` | `app/dashboard/support/page.tsx` | Help center and support ticket submission |

### Loading States

- `app/dashboard/loading.tsx` - Dashboard main page loading state
- `app/dashboard/skills/loading.tsx` - Skills page loading state
- `app/dashboard/billing/loading.tsx` - Billing page loading state
- `app/dashboard/support/loading.tsx` - Support page loading state

---

## Affiliate Dashboard Routes

**Base Path:** `/affiliate`  
**Layout:** `app/affiliate/layout.tsx` - Includes affiliate-specific sidebar navigation

| Route | File | Description |
|-------|------|-------------|
| `/affiliate` | `app/affiliate/page.tsx` | Affiliate dashboard overview with earnings summary and referral stats |
| `/affiliate/referrals` | `app/affiliate/referrals/page.tsx` | Manage referral links and track referred users |
| `/affiliate/earnings` | `app/affiliate/earnings/page.tsx` | Detailed earnings breakdown and commission history |
| `/affiliate/wallet` | `app/affiliate/wallet/page.tsx` | Wallet balance, withdrawal requests, and payment methods |
| `/affiliate/leaderboard` | `app/affiliate/leaderboard/page.tsx` | View top performing affiliates and rankings |
| `/affiliate/my-skills` | `app/affiliate/my-skills/page.tsx` | Affiliates' own enrolled courses and learning progress |
| `/affiliate/settings` | `app/affiliate/settings/page.tsx` | Affiliate profile and banking information settings |
| `/affiliate/support` | `app/affiliate/support/page.tsx` | Affiliate support and help resources |

---

## Admin Dashboard Routes

**Base Path:** `/admin`  
**Layout:** `app/admin/layout.tsx` - Includes admin sidebar with comprehensive management options

| Route | File | Description |
|-------|------|-------------|
| `/admin` | `app/admin/page.tsx` | Admin dashboard with platform analytics and overview |
| `/admin/users` | `app/admin/users/page.tsx` | Manage all registered students |
| `/admin/courses` | `app/admin/courses/page.tsx` | View all courses and manage course library |
| `/admin/courses/new` | `app/admin/courses/new/page.tsx` | Create new course with lessons and content |
| `/admin/courses/[courseId]/edit` | `app/admin/courses/[courseId]/edit/page.tsx` | Edit existing course details and content |
| `/admin/mentors` | `app/admin/mentors/page.tsx` | View and manage mentors/instructors |
| `/admin/mentors/[id]` | `app/admin/mentors/[id]/page.tsx` | Individual mentor profile and course assignments |
| `/admin/subscriptions` | `app/admin/subscriptions/page.tsx` | Manage active subscriptions and subscription tiers |
| `/admin/plans` | `app/admin/plans/page.tsx` | View and edit subscription plans |
| `/admin/plans/create` | `app/admin/plans/create/page.tsx` | Create new subscription plan |
| `/admin/referrals` | `app/admin/referrals/page.tsx` | Monitor referral program performance |
| `/admin/payouts` | `app/admin/payouts/page.tsx` | Process affiliate payouts and withdrawal requests |
| `/admin/certificates` | `app/admin/certificates/page.tsx` | Manage certificate templates and issued certificates |
| `/admin/certificates/editor/[id]` | `app/admin/certificates/editor/[id]/page.tsx` | Visual certificate template editor |
| `/admin/media` | `app/admin/media/page.tsx` | Media library for course images, videos, and assets |
| `/admin/support-requests` | `app/admin/support-requests/page.tsx` | View and respond to support tickets |
| `/admin/logs` | `app/admin/logs/page.tsx` | System activity logs and audit trail |
| `/admin/admins` | `app/admin/admins/page.tsx` | Manage admin users and permissions |
| `/admin/settings` | `app/admin/settings/page.tsx` | Platform-wide settings and configuration |

---

## Key Features by Portal

### Student Portal Features
- Course enrollment and learning progress tracking
- Video lessons with content protection
- Certificate generation upon completion
- Subscription management and billing
- Support ticket system

### Affiliate Portal Features
- Unique referral link generation
- Real-time earnings tracking
- Commission calculator
- Leaderboard with gamification
- Wallet and payout management
- Personal learning access

### Admin Portal Features
- User management (students, affiliates, mentors)
- Course and content management
- Certificate template designer
- Subscription plan configuration
- Financial management (payouts, transactions)
- Referral program oversight
- Support ticket management
- System logs and analytics
- Media library management

---

## Technology Stack

- **Framework:** Next.js 16 with App Router
- **Styling:** Tailwind CSS v4 with custom design tokens
- **Typography:** Plus Jakarta Sans (headings), Inter (body)
- **UI Components:** shadcn/ui components library
- **State Management:** React hooks and Server Components
- **Authentication:** Session-based with separate portals

---

## Design System

### Color Palette
- **Primary Brand:** `#0066ff` (Digital Madarsa blue)
- **Warm Glow:** `#fff7e0` (Accent highlights)
- **Light Background:** `#f7f3ef` (Neutral light)
- **Dark Text:** `#150101` (Primary text)
- **Muted Text:** `#4b4b4b` (Secondary text)

### Typography
- **Headings:** Plus Jakarta Sans (400-800 weights)
- **Body:** Inter (400-600 weights)
- **Line Height:** 1.4-1.6 for optimal readability

### Layout Patterns
- Grid background with subtle blue lines
- Glass-morphism cards for elevated content
- Responsive sidebar navigation
- Mobile-first design approach

---

## Content Protection

The platform includes comprehensive content protection:
- Disabled text selection on course content
- Prevented right-click context menu on videos
- Watermarking support for video content
- Download prevention for course materials

---

## Getting Started

1. Visit the landing page at `/`
2. Students can enroll at `/enroll` or login at `/login`
3. Affiliates access their portal after enrollment at `/affiliate`
4. Admins and staff login at `/admin-login`

---

## Support

For technical assistance or questions, users can submit support tickets through:
- Students: `/dashboard/support`
- Affiliates: `/affiliate/support`
- Direct admin contact through the support request system

---

**Last Updated:** January 2025  
**Version:** 1.0.0
