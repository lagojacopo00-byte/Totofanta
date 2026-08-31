"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/require-user";
import { createTournament, promoteToCreator } from "@/lib/queries";

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

  if (!name) {
    redirect("/dashboard/new?error=" + encodeURIComponent("Dai un nome al torneo"));
  }

  const tournament = await createTournament(supabase, user.id, {
    name,
    competition,
    default_num_slots: defaultNumSlots,
  });
  // Creare un torneo è ciò che rende "creator" un account a livello di
  // piattaforma (ruolo globale, distinto dall'essere organizzatore di
  // questo singolo torneo): vedi docs/01_Visione_progetto.md.
  await promoteToCreator(supabase, user.id);

  revalidatePath("/dashboard");
  redirect(`/dashboard/${tournament.id}`);
}
