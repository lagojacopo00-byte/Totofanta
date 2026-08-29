import { redirect } from "next/navigation";
import { createClient } from "./server";

/** Da chiamare in cima a ogni pagina/azione dell'area organizzatore:
 * rimanda al login se non c'è una sessione valida. */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
}
