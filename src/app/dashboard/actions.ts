"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/require-user";
import { createTournament, getProfileRole, promoteToCreator } from "@/lib/queries";

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createTournamentAction(formData: FormData) {
  const { supabase, user } = await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  const competition = String(formData.get("competition") ?? "").trim() || "Serie A";
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

  const tournament = await createTournament(supabase, user.id, {
    name,
    competition,
    default_num_slots: defaultNumSlots,
    is_test: isTest,
    slot_value: slotValue,
  });
  // Creare un torneo è ciò che rende "creator" un account a livello di
  // piattaforma (ruolo globale, distinto dall'essere organizzatore di
  // questo singolo torneo): vedi docs/01_Visione_progetto.md.
  await promoteToCreator(supabase, user.id);

  revalidatePath("/dashboard");
  redirect(`/dashboard/${tournament.id}`);
}
