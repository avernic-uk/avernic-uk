import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from './AuthProvider'

/**
 * Client-side admin check, used ONLY to decide what to render (e.g. show/hide
 * the admin nav link, redirect away from /admin). This is never the actual
 * authorisation boundary — every admin API route in functions/api/admin/*
 * re-checks admin_users server-side against the authenticated session before
 * doing anything, because a hidden frontend route is not access control.
 */
export function useIsAdmin(): { isAdmin: boolean; loading: boolean } {
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setIsAdmin(false)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    supabase
      .rpc('is_admin')
      .then(({ data, error }) => {
        if (cancelled) return
        setIsAdmin(!error && data === true)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user, authLoading])

  return { isAdmin, loading }
}
