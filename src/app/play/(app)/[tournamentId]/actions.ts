"use server";

import { revalidatePath } from "next/cache";
import { requirePlayer } from "@/lib/supabase/require-player";
import * as queries from "@/lib/queries";
import { isPickingWindowOpen } from "@/lib/pick-window";

/**
 * Riceve la scelta di un giocatore. Il client Supabase qui è quello della
 * sessione autenticata del giocatore: Row Level Security garantisce da
 * sola che possa scrivere solo sui PROPRI slot, ma ricontrolliamo comunque
 * le regole di gioco (giornata aperta, squadra non già usata) perché sono
 * regole applicative, non vincoli che il database conosce.
 */
export async function submitPickAction(
  tournamentId: string,
  slotId: string,
  matchdayId: string,
  formData: FormData
) {
  if (!isPickingWindowOpen()) {
    throw new Error(
      "Le scelte per questa giornata sono chiuse: si schiera solo da lunedì a giovedì. Aspetta i risultati di lunedì."
    );
  }

  const { supabase, user } = await requirePlayer();
  const teamId = String(formData.get("team_id") ?? "");
  if (!teamId) return;

  const player = await queries.getPlayerForTournament(supabase, tournamentId, user.id);

  const slot = player.slots.find((s) => s.id === slotId);
  if (!slot || slot.status !== "alive") {
    throw new Error("Questo slot non è valido o è già stato eliminato.");
  }

  const matchday = await queries.getMatchday(supabase, matchdayId);
  if (matchday.tournament_id !== tournamentId || matchday.status !== "open") {
    throw new Error("Questa giornata non è più aperta alle scelte.");
  }

  const history = await queries.getPicksForSlot(supabase, slotId);
  if (history.some((p) => p.team_id === teamId)) {
    throw new Error("Hai già usato questa squadra su questo slot.");
  }

  await queries.submitPick(supabase, slotId, matchdayId, teamId);
  revalidatePath(`/play/${tournamentId}`);
}
