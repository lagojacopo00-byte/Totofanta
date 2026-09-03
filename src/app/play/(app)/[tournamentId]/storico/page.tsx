import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePlayer } from "@/lib/supabase/require-player";
import * as queries from "@/lib/queries";
import { eyebrow } from "@/components/ui";
import { GiornataPicker } from "./giornata-picker";
import { PlayerHistoryList, type PlayerHistoryGroup } from "./player-history-list";
import type { HistorySlotEntry } from "@/lib/queries";

/**
 * Storico del torneo per il giocatore: giornata per giornata, chi ha
 * schierato cosa e con che esito — tutti i giocatori, non solo il
 * proprio (a differenza di MatchdayRecap nella pagina principale, che è
 * solo "le mie scelte" della giornata aperta). Richiesta esplicita
 * dell'utente il 2026-09-03. Solo le giornate già chiuse (con un
 * risultato applicato) compaiono nel menu: quella aperta non ha ancora
 * nulla da ripercorrere, e c'è già la pagina principale per quella.
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
  const matchdays = await queries.getMatchdays(supabase, tournament.id);
  const closedNumbers = matchdays
    .filter((m) => m.status === "completed")
    .map((m) => m.number)
    .sort((a, b) => b - a);

  const params = await props.searchParams;
  const requested =
    typeof params.giornata === "string" ? Number(params.giornata) : NaN;
  const selected = closedNumbers.includes(requested) ? requested : closedNumbers[0];

  const entries =
    selected !== undefined
      ? await queries.getMatchdayHistory(supabase, tournament.id, selected)
      : [];

  const byPlayer = new Map<string, { playerName: string; slots: HistorySlotEntry[] }>();
  for (const entry of entries) {
    const group = byPlayer.get(entry.playerId) ?? {
      playerName: entry.playerName,
      slots: [],
    };
    group.slots.push(entry);
    byPlayer.set(entry.playerId, group);
  }
  // Squadre uguali vicine, dentro allo stesso giocatore (richiesto
  // dall'utente): ordinate per nome squadra invece che per numero slot.
  // "￿" (fuori dall'alfabeto) tiene in fondo chi non ha scelto nulla,
  // invece di mescolarli in mezzo alle squadre vere.
  const groups: PlayerHistoryGroup[] = Array.from(byPlayer.entries()).map(
    ([playerId, g]) => ({
      playerId,
      ...g,
      slots: g.slots.slice().sort((a, b) => {
        const teamCompare = (a.teamName ?? "￿").localeCompare(
          b.teamName ?? "￿"
        );
        if (teamCompare !== 0) return teamCompare;
        return Number(a.slotLabel) - Number(b.slotLabel);
      }),
    })
  );

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

      {closedNumbers.length === 0 ? (
        <p className="text-sm text-foreground-soft">
          Nessuna giornata ancora chiusa: lo storico si popola quando
          l&apos;organizzatore carica il primo risultato.
        </p>
      ) : (
        <>
          <GiornataPicker
            tournamentId={tournamentId}
            numbers={closedNumbers}
            selected={selected}
          />

          {groups.length === 0 ? (
            <p className="text-sm text-foreground-soft">
              Nessuno slot era ancora in gara in questa giornata.
            </p>
          ) : (
            <PlayerHistoryList groups={groups} />
          )}
        </>
      )}
    </div>
  );
}
