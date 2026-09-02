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

/**
 * Verifica che l'utente sia l'organizzatore del torneo, che la giornata
 * appartenga a quel torneo e sia ancora aperta, e che lo slot indicato sia
 * davvero uno slot di un giocatore di quel torneo — condiviso dalle due
 * azioni sotto, che lasciano all'organizzatore piena libertà di gestire le
 * scelte di ogni giocatore, senza il vincolo della scadenza dinamica che
 * vale per loro (vedi src/lib/pick-window.ts, usato solo lato giocatore).
 */
async function ownedOpenMatchdaySlot(
  tournamentId: string,
  matchdayId: string,
  slotId: string
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

  const players = await queries.getPlayersWithSlots(supabase, tournamentId);
  const slot = players.flatMap((p) => p.slots).find((s) => s.id === slotId);
  if (!slot) {
    throw new Error("Slot non valido per questo torneo");
  }
  if (slot.status !== "alive") {
    throw new Error("Questo slot è già stato eliminato");
  }

  return { supabase, matchday };
}

/** L'organizzatore sceglie (o cambia) la squadra su uno slot per la
 * giornata aperta, per conto di un giocatore — utile per chi non ha
 * ancora l'account, o come override in qualunque momento. */
export async function organizerSetPickAction(
  tournamentId: string,
  slotId: string,
  matchdayId: string,
  formData: FormData
) {
  const { supabase, matchday } = await ownedOpenMatchdaySlot(
    tournamentId,
    matchdayId,
    slotId
  );

  const teamId = String(formData.get("team_id") ?? "");
  if (!teamId) return;

  const history = await queries.getPicksForSlot(supabase, slotId);
  const usedElsewhere = history.some(
    (p) => p.team_id === teamId && p.matchday_id !== matchday.id
  );
  if (usedElsewhere) {
    throw new Error(
      "Questa squadra è già stata usata su questo slot in un'altra giornata."
    );
  }

  await queries.submitPick(supabase, slotId, matchday.id, teamId);
  revalidatePath(`/dashboard/${tournamentId}/matchday/${matchdayId}`);
}

/** L'organizzatore toglie la scelta fatta su uno slot per la giornata
 * aperta, lasciando che si possa scegliere di nuovo (o restare senza
 * scelta). */
export async function organizerClearPickAction(
  tournamentId: string,
  slotId: string,
  matchdayId: string
) {
  const { supabase, matchday } = await ownedOpenMatchdaySlot(
    tournamentId,
    matchdayId,
    slotId
  );

  await queries.deletePick(supabase, slotId, matchday.id);
  revalidatePath(`/dashboard/${tournamentId}/matchday/${matchdayId}`);
}
