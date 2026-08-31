"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/require-user";
import * as queries from "@/lib/queries";

async function ownedTournament(tournamentId: string) {
  const { supabase, user } = await requireUser();
  const tournament = await queries.getTournament(supabase, tournamentId);
  if (tournament.owner_id !== user.id) {
    throw new Error("Non sei l'organizzatore di questo torneo");
  }
  return { supabase, tournament };
}

export async function addPlayerAction(tournamentId: string, formData: FormData) {
  const { supabase, tournament } = await ownedTournament(tournamentId);
  const displayName = String(formData.get("display_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const numSlots = Math.max(
    1,
    Math.min(100, Number(formData.get("num_slots") ?? tournament.default_num_slots) || 1)
  );
  if (!displayName || !email) return;

  await queries.addPlayer(supabase, tournament, { displayName, email, numSlots });
  revalidatePath(`/dashboard/${tournamentId}`);
}

/** Cambia quanti slot ha un giocatore GIÀ invitato. Consentito solo mentre
 * il torneo non è ancora iniziato (nessuna giornata è mai stata aperta):
 * dopo, il numero di slot di ognuno resta fisso per non rimescolare le
 * carte a metà partita. */
export async function editPlayerSlotsAction(
  tournamentId: string,
  playerId: string,
  formData: FormData
) {
  const { supabase, tournament } = await ownedTournament(tournamentId);
  if (tournament.status !== "draft") {
    throw new Error(
      "Il numero di slot si può cambiare solo prima che il torneo inizi"
    );
  }

  const numSlots = Math.max(1, Math.min(100, Number(formData.get("num_slots") ?? 0) || 0));
  if (numSlots < 1) return;

  await queries.updatePlayerNumSlots(supabase, playerId, numSlots);
  revalidatePath(`/dashboard/${tournamentId}`);
}

/** Toglie del tutto un giocatore dal torneo. Consentito solo mentre il
 * torneo è ancora "draft", per lo stesso motivo di editPlayerSlotsAction:
 * dopo che una giornata è stata aperta, i pick già fatti dipendono da
 * quel giocatore e non vogliamo rimescolare le carte a metà partita. */
export async function removePlayerAction(tournamentId: string, playerId: string) {
  const { supabase, tournament } = await ownedTournament(tournamentId);
  if (tournament.status !== "draft") {
    throw new Error("Un giocatore si può rimuovere solo prima che il torneo inizi");
  }

  await queries.removePlayer(supabase, playerId);
  revalidatePath(`/dashboard/${tournamentId}`);
}

export async function startTournamentAction(tournamentId: string) {
  const { supabase, tournament } = await ownedTournament(tournamentId);
  await queries.createNextMatchday(supabase, tournament);
  revalidatePath(`/dashboard/${tournamentId}`);
}

/** Aggiunge una squadra su misura per questo torneo — serve soprattutto
 * quando la competizione non è la Serie A precaricata, ma è utile anche
 * per completare un elenco che risulta incompleto. */
export async function addTeamAction(tournamentId: string, formData: FormData) {
  const { supabase, tournament } = await ownedTournament(tournamentId);
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  await queries.addTeamToTournament(supabase, tournamentId, tournament.competition, name);
  revalidatePath(`/dashboard/${tournamentId}`);
}

/** Toglie una squadra aggiunta a mano (mai una di quelle di riferimento
 * condivise, che non compaiono nemmeno tra quelle rimovibili). */
export async function removeTeamAction(tournamentId: string, teamId: string) {
  const { supabase } = await ownedTournament(tournamentId);
  await queries.removeTeamFromTournament(supabase, tournamentId, teamId);
  revalidatePath(`/dashboard/${tournamentId}`);
}

/** Verifica, oltre a essere l'organizzatore, che il torneo sia
 * effettivamente "di test": le funzioni di test (giocatori finti,
 * simulazione) non vanno mai usate su un torneo vero, quindi lo
 * ricontrolliamo qui invece di fidarci solo del fatto che la UI le
 * nasconde per i tornei normali. */
async function ownedTestTournament(tournamentId: string) {
  const owned = await ownedTournament(tournamentId);
  if (!owned.tournament.is_test) {
    throw new Error("Questa funzione è disponibile solo per i tornei di test");
  }
  return owned;
}

/** Aggiunge N giocatori finti a un torneo di test, per popolarlo in
 * blocco senza invitare persone vere. */
export async function addTestPlayersAction(
  tournamentId: string,
  formData: FormData
) {
  const { supabase, tournament } = await ownedTestTournament(tournamentId);
  const count = Math.max(1, Math.min(50, Number(formData.get("count") ?? 0) || 0));
  if (count < 1) return;

  await queries.addTestPlayers(supabase, tournament, count);
  revalidatePath(`/dashboard/${tournamentId}`);
}

/** Simula un'intera giornata di un torneo di test (scelte e risultati
 * casuali), per bilanciare slot/durata senza aspettare il calendario
 * reale — vedi queries.simulateMatchday. */
export async function simulateMatchdayAction(tournamentId: string) {
  const { supabase, tournament } = await ownedTestTournament(tournamentId);
  if (tournament.status === "finished") return;

  await queries.simulateMatchday(supabase, tournament);
  revalidatePath(`/dashboard/${tournamentId}`);
}
