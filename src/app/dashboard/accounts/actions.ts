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
