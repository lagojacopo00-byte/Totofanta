import { redirect } from "next/navigation";
import { createClient } from "./server";

/** Da chiamare in cima a ogni pagina/azione dell'area organizzatore:
 * rimanda al login se non c'è una sessione valida. Stesso login
 * dell'area giocatore (/play/login) — un solo accesso per l'intera app,
 * non due porte separate: chi organizza può anche giocare con lo stesso
 * account, e viceversa passa in "modalità admin" dall'app già loggato. */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/play/login");
  }

  return { supabase, user };
}
