import { getSupabaseAdmin } from './supabaseAdmin'
import { ApiError } from './respond'
import type { Env } from './types'

function getBearerToken(request: Request): string | null {
  const header = request.headers.get('Authorization') ?? ''
  const [scheme, token] = header.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null
  return token
}

interface AuthResult {
  userId: string | null
  /** TEMPORARY: raw Supabase error detail for the 401 investigation. Never
   * populated on success; remove this field (and its use below) once fixed. */
  debugError?: string
}

/** Verifies the caller's Supabase access token and returns their user id, or null if unauthenticated. */
async function getAuthedUser(request: Request, env: Env): Promise<AuthResult> {
  const token = getBearerToken(request)
  if (!token) return { userId: null, debugError: 'no bearer token on request' }
  const admin = getSupabaseAdmin(env)
  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user) {
    // eslint-disable-next-line no-console
    console.error('[auth] admin.auth.getUser failed:', error?.message, error?.status, error?.name)
    return {
      userId: null,
      debugError: `getUser failed: ${error?.name ?? 'unknown'} (status ${error?.status ?? 'n/a'}): ${error?.message ?? 'no message'}`,
    }
  }
  return { userId: data.user.id }
}

/** Back-compat wrapper for existing callers (e.g. checkout) that only need the user id. */
export async function getAuthedUserId(request: Request, env: Env): Promise<string | null> {
  const { userId } = await getAuthedUser(request, env)
  return userId
}

/**
 * Requires the caller to be signed in AND present in admin_users.
 * This is the server-side authorisation boundary for every /api/admin/*
 * route — it is enforced here regardless of what the frontend shows or
 * hides, per the "never rely on hiding frontend routes" requirement.
 */
export async function requireAdmin(request: Request, env: Env): Promise<string> {
  const { userId, debugError } = await getAuthedUser(request, env)
  if (!userId) {
    // TEMPORARY: includes raw diagnostic detail in the message while we
    // track down the 401 issue. Revert to plain 'Sign in required.' once
    // resolved — this is safe short-term since the site has no real users
    // yet, but should not ship long-term.
    throw new ApiError(401, `Sign in required. [debug: ${debugError}]`)
  }

  const admin = getSupabaseAdmin(env)
  const { data, error } = await admin.from('admin_users').select('id').eq('id', userId).maybeSingle()
  if (error) throw new ApiError(500, `Could not verify admin access. [debug: ${error.message}]`)
  if (!data) throw new ApiError(403, 'Admin access required.')
  return userId
}
