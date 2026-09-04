"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

/** Se questa email è già un giocatore di questo torneo (es. un invito
 * ancora orfano — "In attesa che si registri" nella UI — lasciato da un
 * account cancellato dal creator: la cancellazione toglie l'account, non
 * la riga giocatore, apposta, così chi si registra di nuovo con la
 * stessa email si riaggancia da solo), non serve re-invitarlo: basta che
 * apra di nuovo Totofanta con quell'email. Senza questo controllo,
 * `queries.addPlayer` fallirebbe con un errore Postgres di chiave
 * duplicata (unique (tournament_id, email)) poco chiaro per
 * l'organizzatore — qui invece si spiega perché non serve reinvitare. */
export async function addPlayerAction(tournamentId: string, formData: FormData) {
  const { supabase, tournament } = await ownedTournament(tournamentId);
  const displayName = String(formData.get("display_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const numSlots = Math.max(
    1,
    Math.min(100, Number(formData.get("num_slots") ?? tournament.default_num_slots) || 1)
  );
  if (!displayName || !email) return;

  const existing = await queries.getPlayerByEmail(supabase, tournamentId, email);
  if (existing) {
    redirect(
      `/dashboard/${tournamentId}?playerError=` +
        encodeURIComponent(
          existing.user_id
            ? `${email} è già un giocatore di questo torneo, non serve invitarlo di nuovo.`
            : `${email} è già stato invitato: non serve reinvitarlo, basta che si registri (o acceda) su Totofanta con questa stessa email per essere agganciato in automatico.`
        )
    );
  }

  await queries.addPlayer(supabase, tournament, { displayName, email, numSlots });
  revalidatePath(`/dashboard/${tournamentId}`);
}

/** Cambia quanti slot ha un giocatore GIÀ invitato — in qualunque momento
 * del torneo, non solo prima che inizi: potere esplicito dell'admin del
 * torneo per correggere slot mal configurati anche a giornate già aperte.
 * Riducendo il numero, updatePlayerNumSlots toglie per prima gli slot già
 * eliminati per non intaccare storico ancora vivo quando basta pulire
 * quello perso. */
export async function editPlayerSlotsAction(
  tournamentId: string,
  playerId: string,
  formData: FormData
) {
  const { supabase } = await ownedTournament(tournamentId);

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

/** Cambia il valore del premio per slot dopo la creazione del torneo. */
export async function updateSlotValueAction(tournamentId: string, formData: FormData) {
  const { supabase } = await ownedTournament(tournamentId);
  const slotValue = Math.max(0, Number(formData.get("slot_value") ?? 0) || 0);
  await queries.updateTournamentSlotValue(supabase, tournamentId, slotValue);
  revalidatePath(`/dashboard/${tournamentId}`);
}

/** Cancella del tutto il torneo (giocatori, scelte, risultati inclusi):
 * irreversibile, quindi la UI chiede conferma prima di inviare il form
 * che chiama questa action. */
export async function deleteTournamentAction(tournamentId: string) {
  const { supabase } = await ownedTournament(tournamentId);
  await queries.deleteTournament(supabase, tournamentId);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

/** Annulla l'ultima giornata completata: rete di sicurezza per un
 * risultato inserito per sbaglio. Cancella anche la giornata successiva
 * se nel frattempo era già stata aperta (con le eventuali scelte già
 * fatte dai giocatori) — la UI deve aver già avvisato di questo rischio
 * prima di arrivare qui, vedi UndoLastMatchdayButton. */
export async function undoLastMatchdayAction(tournamentId: string) {
  const { supabase, tournament } = await ownedTournament(tournamentId);
  await queries.undoLastMatchday(supabase, tournament);
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
