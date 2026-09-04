import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useIsAdmin } from '@/lib/auth/useIsAdmin'

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const { isAdmin, loading: adminLoading } = useIsAdmin()

  if (authLoading || adminLoading) {
    return <div className="container-page py-24 text-center text-sm text-ink-500">Loading…</div>
  }
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return <>{children}</>
}
