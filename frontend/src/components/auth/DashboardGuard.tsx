'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Loader2 } from 'lucide-react'

interface DashboardGuardProps {
  children: React.ReactNode
}

/**
 * Client-side guard for dashboard pages.
 * Works in tandem with middleware.ts (server-side).
 * Handles cases where middleware cookie check misses (e.g. token just expired).
 * Also handles role-based routing (superadmin redirects).
 */
export default function DashboardGuard({ children }: DashboardGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login')
      return
    }

    // Handle role-based routing
    if (user && !isLoading) {
      const isSuperAdmin = user.role === 'super_admin' // Super Admin role

      // If superadmin tries to access dashboard root or admin page, redirect to superadmin page
      if (isSuperAdmin && (pathname === '/dashboard' || pathname === '/dashboard/admin')) {
        router.replace('/dashboard/superadmin')
        return
      }

      // If superadmin tries to access non-superadmin pages, allow (they have full access)
      // If non-superadmin tries to access superadmin page, this should be blocked at UI level
      // (sidebar won't show it) and permission-wise
    }
  }, [isAuthenticated, isLoading, user, pathname, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-ink-400 animate-spin" />
          <p className="text-xs text-ink-300">Memuat...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
