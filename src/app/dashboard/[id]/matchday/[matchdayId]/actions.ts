"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/require-user";
import * as queries from "@/lib/queries";
import type { Outcome } from "@/lib/game-logic";

export async function submitResultsAction(
  tournamentId: string,
  matchdayId: string,
  formData: FormData
) {
  const { supabase, user } = await requireUser();

  const tournament = await queries.getTournament(supabase, tournamentId);
  if (tournament.owner_id !== user.id) {
    throw new Error("Non sei l'organizzatore di questo torneo");
  }

  const matchday = await queries.getMatchday(supabase, matchdayId);
  if (matchday.tournament_id !== tournamentId || matchday.status !== "open") {
    throw new Error("Questa giornata non è aperta");
  }

  const outcomesByTeam: Record<string, Outcome> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("outcome_") && typeof value === "string" && value) {
      outcomesByTeam[key.replace("outcome_", "")] = value as Outcome;
    }
  }

  await queries.submitMatchdayResults(supabase, tournament, matchday, outcomesByTeam);
  revalidatePath(`/dashboard/${tournamentId}`);
  redirect(`/dashboard/${tournamentId}`);
}
