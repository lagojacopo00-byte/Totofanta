import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePlayer } from "@/lib/supabase/require-player";
import * as queries from "@/lib/queries";
import { card, cardTight, eyebrow, pillAlive, pillOut } from "@/components/ui";
import { TeamBadge } from "@/components/team-badge";
import { GiornataPicker } from "./giornata-picker";
import type { HistorySlotEntry } from "@/lib/queries";

const pillPending =
  "inline-flex items-center rounded-full border border-line bg-surface-2 px-2.5 py-1 font-mono text-xs text-foreground-faint";

const outcomeLabel: Record<HistorySlotEntry["outcome"], string> = {
  win: "Vinta",
  draw: "Pareggio",
  loss: "Persa",
  missed_pick: "Nessuna scelta",
  exempt: "Esente",
};

function outcomePillClass(outcome: HistorySlotEntry["outcome"]): string {
  if (outcome === "win" || outcome === "exempt") return pillAlive;
  if (outcome === "loss" || outcome === "missed_pick") return pillOut;
  return pillPending;
}

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
  const groups = Array.from(byPlayer.entries()).map(([playerId, g]) => ({
    playerId,
    ...g,
  }));

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
            <div className="flex flex-col gap-4">
              {groups.map((g) => (
                <section key={g.playerId} className={`${card} flex flex-col gap-2`}>
                  <p className="font-display text-base font-bold">
                    {g.playerName}
                  </p>
                  <ul className="flex flex-col gap-2">
                    {g.slots.map((slot, i) => (
                      <li
                        key={`${g.playerId}-${slot.slotLabel}-${i}`}
                        className={`${cardTight} flex items-center justify-between gap-3`}
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <span className="flex-none rounded-full border border-line bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-foreground-faint">
                            {slot.slotLabel}
                          </span>
                          {slot.teamName ? (
                            <TeamBadge name={slot.teamName} size="sm" />
                          ) : null}
                          <span className="min-w-0 truncate text-xs text-foreground-soft">
                            {slot.teamName ?? "—"}
                          </span>
                        </div>
                        <span className={`flex-none ${outcomePillClass(slot.outcome)}`}>
                          {outcomeLabel[slot.outcome]}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
