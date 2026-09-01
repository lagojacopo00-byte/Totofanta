import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Client service-role: accesso pieno, bypassa Row Level Security.
// Solo lato server — mai importarlo in un Client Component né esporre la
// chiave service-role con un prefisso NEXT_PUBLIC_.
//
// Serve per l'unica cosa che un utente non può fare con la propria sessione
// normale: cancellare il proprio account (supabase-js non espone un
// "elimina il mio account" lato client, solo l'Admin API — vedi
// deleteAccountAction in src/app/play/(app)/profile/actions.ts, che
// verifica comunque prima l'identità con la sessione normale dell'utente).
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
