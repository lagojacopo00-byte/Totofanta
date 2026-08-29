import { redirect } from "next/navigation";
import { createClient } from "./server";
import { claimPendingInvites } from "@/lib/queries";

/** Da chiamare in cima a ogni pagina/azione dell'area giocatore: rimanda
 * al login se non c'è una sessione valida, e aggancia eventuali inviti in
 * sospeso per la sua email prima di procedere. */
export async function requirePlayer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/play/login");
  }

  if (user.email) {
    await claimPendingInvites(supabase, user.id, user.email);
  }

  return { supabase, user };
}
