import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** True once real Supabase project details are configured. Pages can check this to show a clearer message than a generic fetch error. */
export const isSupabaseConfigured = Boolean(url && anonKey)

if (!isSupabaseConfigured) {
  // Fail loudly (in the console) rather than silently talking to nothing —
  // but NEVER throw here. `createClient` throws synchronously on an empty
  // URL, and this module is imported at the top of the app's module graph
  // (AuthProvider -> main.tsx), so a throw here previously crashed the
  // entire React app before it could render anything — a blank white page
  // with no way to tell the visitor (or you) why. Falling back to a
  // syntactically-valid placeholder URL means the app always renders; any
  // Supabase call will instead fail at the network level and be caught by
  // that page's own error state, exactly like a real outage would be.
  // eslint-disable-next-line no-console
  console.warn(
    '[Avernic UK] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set. ' +
      'The site will render, but anything that talks to Supabase (products, ' +
      'accounts, orders) will fail until these are set. Copy .env.example to ' +
      '.env locally, or set them in your host\'s environment variables for a ' +
      'deployed build.',
  )
}

/**
 * Browser Supabase client. Uses the PUBLIC anon key only — Row Level
 * Security policies (see supabase/migrations) are what actually restrict
 * what each signed-in user can read or write. The service-role key must
 * NEVER be used here; it lives only in Cloudflare Pages Functions env vars.
 */
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)
