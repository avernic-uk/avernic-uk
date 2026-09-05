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

/**
 * Uploads one file to an /api/admin/* route.
 *
 * Deliberately separate from adminFetch: that one sets
 * `Content-Type: application/json`, and a multipart upload must NOT carry a
 * hand-written content type — the browser has to set it itself so it can
 * append the multipart boundary. Setting it manually produces a body the
 * server cannot parse, with a confusing "no file provided" error.
 */
export async function adminUpload<T>(input: string, file: File): Promise<T> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  const body = new FormData()
  body.append('file', file)

  const res = await fetch(input, {
    method: 'POST',
    body,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  const payload = await res.json().catch(() => null)
  if (!res.ok) throw new Error(payload?.error ?? 'The upload failed.')
  return payload as T
}

export async function adminFetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await adminFetch(input, init)
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error ?? 'Something went wrong.')
  return data as T
}
