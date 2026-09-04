import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Env } from './types'

/**
 * Service-role Supabase client for server-side use ONLY (Cloudflare Pages
 * Functions). This key bypasses Row Level Security entirely, which is
 * exactly why it must never reach the browser bundle — it is read only from
 * `env` inside functions/, never from import.meta.env / VITE_* variables.
 */
export function getSupabaseAdmin(env: Env): SupabaseClient {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase is not configured on the server (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing).')
  }
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
