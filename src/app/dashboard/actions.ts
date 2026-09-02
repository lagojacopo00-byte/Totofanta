"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/require-user";
import { createTournament, getProfileRole } from "@/lib/queries";

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/play/login");
}

export async function createTournamentAction(formData: FormData) {
  const { supabase, user } = await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  // Unica competizione utilizzabile per ora: niente da far scegliere
  // all'organizzatore in creazione (vedi anche tryFinalizeRoundEverywhere
  // in src/lib/queries.ts, che già assume "Serie A" per il caricamento
  // automatico dei risultati reali).
  const competition = "Serie A";
  const defaultNumSlots = Math.max(
    1,
    Math.min(100, Number(formData.get("default_num_slots") ?? 1) || 1)
  );
  const slotValue = Math.max(0, Number(formData.get("slot_value") ?? 0) || 0);

  if (!name) {
    redirect("/dashboard/new?error=" + encodeURIComponent("Dai un nome al torneo"));
  }

  // Il checkbox "torneo di test" è mostrato solo ai creator, ma il
  // controllo va rifatto qui: un form è dati arbitrari dal client, non ci
  // si può fidare che chi non è creator non l'abbia inviato lo stesso.
  const requestedTest = formData.get("is_test") === "on";
  const role = requestedTest ? await getProfileRole(supabase, user.id) : "player";
  const isTest = requestedTest && role === "creator";
  const autoBackupMatchdays = formData.get("auto_backup_matchdays") === "on";

  const tournament = await createTournament(supabase, user.id, {
    name,
    competition,
    default_num_slots: defaultNumSlots,
    is_test: isTest,
    slot_value: slotValue,
    auto_backup_matchdays: autoBackupMatchdays,
  });
  // Chi crea un torneo ne è l'organizzatore/"admin di lega" (owner_id,
  // per quel torneo soltanto) — questo resta self-service per chiunque,
  // come sempre. "creator" è un ruolo diverso e non si ottiene più
  // creando un torneo: vedi docs/01_Visione_progetto.md.

  revalidatePath("/dashboard");
  redirect(`/dashboard/${tournament.id}`);
}
