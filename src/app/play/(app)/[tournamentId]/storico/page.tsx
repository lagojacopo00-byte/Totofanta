import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePlayer } from "@/lib/supabase/require-player";
import * as queries from "@/lib/queries";
import { eyebrow } from "@/components/ui";
import { PlayerPicker } from "./player-picker";
import { PlayerSlotHistoryTable } from "./player-slot-history-table";

/**
 * Storico del torneo per il giocatore: per il giocatore selezionato (di
 * default se stesso), tutti i suoi slot su una riga con una colonna per
 * ogni giornata già chiusa — stessa logica del foglio Excel "Storico"
 * (vedi getTournamentSlotHistory in src/lib/queries.ts), qui in app.
 * Prima versione (2026-09-03) era organizzata per giornata invece che
 * per giocatore; cambiata il 2026-09-04 su richiesta esplicita
 * dell'utente per rispecchiare il nuovo formato dell'export Excel.
 */
export default async function StoricoPage(
  props: PageProps<"/play/[tournamentId]/storico">
) {
  const { tournamentId } = await props.params;
  const { supabase, user } = await requirePlayer();

  let player;
  try {
    player = await queries.getPlayerForTournament(supabase, tournamentId, user.id);
  } catch {
    notFound();
  }
  if (!player) notFound();

  const tournament = player.tournaments;
  const history = await queries.getTournamentSlotHistory(supabase, tournament.id);

  const params = await props.searchParams;
  const requested = typeof params.giocatore === "string" ? params.giocatore : null;
  const selectedPlayerId =
    requested && history.players.some((p) => p.playerId === requested)
      ? requested
      : player.id;

  // Il giocatore stesso sempre in cima al menu ("(tu)"), poi gli altri
  // nell'ordine restituito da getTournamentSlotHistory (created_at
  // crescente) — richiesto dall'utente: si apre di default sul proprio
  // storico, gli altri sono un click di distanza se servono.
  const pickerPlayers = [
    ...history.players.filter((p) => p.playerId === player.id),
    ...history.players.filter((p) => p.playerId !== player.id),
  ].map((p) => ({
    id: p.playerId,
    label: p.playerId === player.id ? `${p.displayName} (tu)` : p.displayName,
  }));

  const selected = history.players.find((p) => p.playerId === selectedPlayerId);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/play/${tournamentId}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground-faint transition-colors hover:text-accent"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M15 5 8 12l7 7"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {tournament.name}
      </Link>

      <div>
        <p className={eyebrow}>{tournament.name}</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold">Storico</h1>
      </div>

      {history.matchdayNumbers.length === 0 ? (
        <p className="text-sm text-foreground-soft">
          Nessuna giornata ancora chiusa: lo storico si popola quando
          l&apos;organizzatore carica il primo risultato.
        </p>
      ) : (
        <>
          <PlayerPicker
            tournamentId={tournamentId}
            players={pickerPlayers}
            selectedPlayerId={selectedPlayerId}
          />

          {selected && selected.slots.length > 0 ? (
            <PlayerSlotHistoryTable
              matchdayNumbers={history.matchdayNumbers}
              slots={selected.slots}
            />
          ) : (
            <p className="text-sm text-foreground-soft">
              Questo giocatore non ha slot in questo torneo.
            </p>
          )}
        </>
      )}
    </div>
  );
}
