import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Service-role client: full access, bypasses Row Level Security.
// Server-only — never import this from a Client Component or expose the
// service role key with a NEXT_PUBLIC_ prefix.
//
// We use this for the player-facing flows (picking a team, viewing a
// tournament) because players authenticate with a personal join link/token
// rather than a Supabase Auth session. Every function that uses this client
// MUST verify the token/ownership itself before reading or writing data.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
