"use server";

import { revalidatePath } from "next/cache";
import { requirePlayer } from "@/lib/supabase/require-player";
import * as queries from "@/lib/queries";
import { computePickDeadline, isPickingWindowOpen } from "@/lib/pick-window";

export interface PickAssignment {
  slotId: string;
  teamId: string;
}

/**
 * Riceve l'intera assegnazione slot -> squadra scelta nella schermata di
 * scelta (vedi team-picker.tsx) per la giornata aperta, e la applica in
 * blocco: crea/aggiorna i pick nuovi o cambiati, e toglie quelli di uno
 * slot che prima aveva una scelta e ora non è più nell'elenco ricevuto
 * (l'utente l'ha tolta col bottone rosso prima di confermare). Uno slot
 * assente da `assignments` semplicemente non riceve nessuna scelta (resta
 * "da confermare", non è un errore: potrebbe restare così fino a mancata
 * scelta).
 *
 * Il client Supabase qui è quello della sessione autenticata del
 * giocatore: Row Level Security garantisce da sola che possa scrivere
 * solo sui PROPRI slot, ma ricontrolliamo comunque le regole di gioco
 * (giornata aperta, squadra non già usata, squadra disponibile/non
 * esclusa) perché sono regole applicative, non vincoli che il database
 * conosce.
 */
export async function submitPicksAction(
  tournamentId: string,
  matchdayId: string,
  assignments: PickAssignment[]
) {
  const { supabase, user } = await requirePlayer();
  const player = await queries.getPlayerForTournament(supabase, tournamentId, user.id);

  const matchday = await queries.getMatchday(supabase, matchdayId);
  if (matchday.tournament_id !== tournamentId || matchday.status !== "open") {
    throw new Error("Questa giornata non è più aperta alle scelte.");
  }

  const aliveSlotIds = new Set(
    player.slots.filter((s) => s.status === "alive").map((s) => s.id)
  );

  const [availableTeams, excludedTeamNames, existingPicks, roundFixtures] = await Promise.all([
    queries.getAvailableTeams(supabase, tournamentId, player.tournaments.competition),
    queries.getExcludedTeamNames(supabase, matchday.number),
    queries.getAllPicksForTournamentSlots(supabase, Array.from(aliveSlotIds)),
    queries.getFixturesForRound(supabase, matchday.number),
  ]);
  const availableTeamById = new Map(availableTeams.map((t) => [t.id, t]));

  // Scadenza dinamica: il primo calcio d'inizio non escluso di QUESTA
  // giornata (vedi src/lib/pick-window.ts), non più un giorno fisso.
  const pickDeadline = computePickDeadline(roundFixtures, excludedTeamNames);
  if (!isPickingWindowOpen(pickDeadline)) {
    throw new Error(
      "Le scelte per questa giornata sono chiuse: è già iniziata la prima partita. Aspetta i risultati."
    );
  }

  // Storico di ogni slot ESCLUSA la giornata aperta: quella la stiamo
  // eventualmente sostituendo, non conta come "già usata" contro se stessa.
  const historyBySlot = new Map<string, Set<string>>();
  const currentPickBySlot = new Map<string, string>();
  for (const pick of existingPicks) {
    if (pick.matchday_id === matchdayId) {
      currentPickBySlot.set(pick.slot_id, pick.team_id);
      continue;
    }
    if (!historyBySlot.has(pick.slot_id)) historyBySlot.set(pick.slot_id, new Set());
    historyBySlot.get(pick.slot_id)!.add(pick.team_id);
  }

  const desiredBySlot = new Map(assignments.map((a) => [a.slotId, a.teamId]));

  for (const [slotId, teamId] of desiredBySlot) {
    if (!aliveSlotIds.has(slotId)) {
      throw new Error("Uno degli slot indicati non è valido.");
    }
    const team = availableTeamById.get(teamId);
    if (!team) {
      throw new Error("Una delle squadre indicate non è disponibile in questo torneo.");
    }
    if (excludedTeamNames.has(team.name)) {
      throw new Error(`${team.name} non è disponibile per questa giornata.`);
    }
    if (historyBySlot.get(slotId)?.has(teamId)) {
      throw new Error(`Hai già usato ${team.name} su uno degli slot indicati.`);
    }
  }

  await Promise.all(
    Array.from(aliveSlotIds).map(async (slotId) => {
      const desired = desiredBySlot.get(slotId) ?? null;
      const current = currentPickBySlot.get(slotId) ?? null;
      if (desired === current) return;
      if (desired) {
        await queries.submitPick(supabase, slotId, matchdayId, desired);
      } else {
        await queries.deletePick(supabase, slotId, matchdayId);
      }
    })
  );

  revalidatePath(`/play/${tournamentId}`);
}
