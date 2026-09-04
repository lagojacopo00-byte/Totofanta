"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/require-user";
import * as queries from "@/lib/queries";

/** Il creator compila nome pubblico/nome/cognome per conto di un altro
 * account — utile per chi non lo farebbe mai da solo (vedi page.tsx).
 * Ruolo verificato qui, non solo lato UI: getAllProfiles/
 * adminUpdateProfileName in queries.ts bypassano la RLS di `profiles`
 * col client admin, quindi il controllo "sei creator" è tutto qui. */
export async function adminUpdateProfileNameAction(
  targetUserId: string,
  formData: FormData
) {
  const { supabase, user } = await requireUser();
  const role = await queries.getProfileRole(supabase, user.id);
  if (role !== "creator") {
    throw new Error("Solo il creator può modificare gli account");
  }

  const displayName = String(formData.get("display_name") ?? "").trim();
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();

  await queries.adminUpdateProfileName(targetUserId, { displayName, firstName, lastName });
  revalidatePath("/dashboard/accounts");
  revalidatePath("/play", "layout");
}

/** Cancella per sempre l'account di un altro utente — riservato al
 * creator. Non utilizzabile su se stessi da qui: per il proprio account
 * resta il flusso dedicato in /play/profile (deleteAccountAction), con
 * la sua UI/conferma. */
export async function adminDeleteUserAction(targetUserId: string) {
  const { supabase, user } = await requireUser();
  const role = await queries.getProfileRole(supabase, user.id);
  if (role !== "creator") {
    throw new Error("Solo il creator può eliminare account altrui");
  }
  if (targetUserId === user.id) {
    throw new Error("Non puoi eliminare il tuo stesso account da qui");
  }

  await queries.adminDeleteUser(targetUserId);
  revalidatePath("/dashboard/accounts");
}
