import { supabase } from '@/lib/supabaseClient'

/**
 * Fetch wrapper for /api/admin/* routes: attaches the current Supabase
 * access token as a Bearer credential. The server independently verifies
 * this token AND checks admin_users before doing anything (see
 * functions/_lib/auth.ts) — this header is convenience, not the security
 * boundary.
 */
export async function adminFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })
}

export async function adminFetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await adminFetch(input, init)
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error ?? 'Something went wrong.')
  return data as T
}
