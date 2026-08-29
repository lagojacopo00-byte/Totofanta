import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Client to use inside Server Components / Server Actions (respects the
// logged-in organizer's session and Row Level Security policies).
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component that can't set cookies.
            // Safe to ignore when middleware refreshes the session.
          }
        },
      },
    }
  )
}
