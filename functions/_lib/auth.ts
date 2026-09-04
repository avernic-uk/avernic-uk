import { getSupabaseAdmin } from './supabaseAdmin'
import { ApiError } from './respond'
import type { Env } from './types'

function getBearerToken(request: Request): string | null {
  const header = request.headers.get('Authorization') ?? ''
  const [scheme, token] = header.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null
  return token
}

/** Verifies the caller's Supabase access token and returns their user id, or null if unauthenticated. */
export async function getAuthedUserId(request: Request, env: Env): Promise<string | null> {
  const token = getBearerToken(request)
  if (!token) return null
  const admin = getSupabaseAdmin(env)
  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user) return null
  return data.user.id
}

/**
 * Requires the caller to be signed in AND present in admin_users.
 * This is the server-side authorisation boundary for every /api/admin/*
 * route — it is enforced here regardless of what the frontend shows or
 * hides, per the "never rely on hiding frontend routes" requirement.
 */
export async function requireAdmin(request: Request, env: Env): Promise<string> {
  const userId = await getAuthedUserId(request, env)
  if (!userId) throw new ApiError(401, 'Sign in required.')

  const admin = getSupabaseAdmin(env)
  const { data, error } = await admin.from('admin_users').select('id').eq('id', userId).maybeSingle()
  if (error) throw new ApiError(500, 'Could not verify admin access.')
  if (!data) throw new ApiError(403, 'Admin access required.')
  return userId
}
