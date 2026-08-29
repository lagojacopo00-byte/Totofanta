import { redirect } from "next/navigation";
import { createClient } from "./server";
import { claimPendingInvites } from "@/lib/queries";

/** Da chiamare in cima a ogni pagina/azione dell'area giocatore: rimanda
 * al login se non c'è una sessione valida, e aggancia eventuali inviti in
 * sospeso per la sua email prima di procedere. Passa `nextPath` (il
 * percorso della pagina chiamante) quando, dopo il login/registrazione,
 * l'utente deve tornare esattamente lì invece che sulla lista tornei —
 * serve per esempio alla pagina di invito (`/play/join/[id]`). */
export async function requirePlayer(nextPath?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const suffix = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/play/login${suffix}`);
  }

  if (user.email) {
    await claimPendingInvites(supabase, user.id, user.email);
  }

  return { supabase, user };
}
