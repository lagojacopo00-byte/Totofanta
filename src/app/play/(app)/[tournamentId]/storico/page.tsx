import { notFound } from "next/navigation";
import { requirePlayer } from "@/lib/supabase/require-player";
import * as queries from "@/lib/queries";
import { assignRanks } from "@/lib/game-logic";
import { eyebrow } from "@/components/ui";
import { BackLink } from "@/components/back-link";
import { StoricoList, type RankedHistoryPlayer } from "@/components/storico-list";

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
  const slotHistory = await queries.getTournamentSlotHistory(supabase, tournament.id);

  // Classifica per slot vivi decrescente, pari merito compresi — stessa
  // regola della classifica sul torneo (vedi assignRanks in
  // game-logic.ts), qui applicata allo storico invece che a
  // getTournamentStandings: stessa informazione (slot vivi per
  // giocatore), fonte diversa perché questa pagina carica solo lo
  // storico, non anche gli standing.
  const sorted = [...slotHistory.players].sort((a, b) => {
    const aliveA = a.slots.filter((s) => s.eliminatedMatchday === null).length;
    const aliveB = b.slots.filter((s) => s.eliminatedMatchday === null).length;
    return aliveB - aliveA;
  });
  const ranked: RankedHistoryPlayer[] = assignRanks(sorted, (p) =>
    p.slots.filter((s) => s.eliminatedMatchday === null).length
  ).map((p) => ({ ...p, isMe: p.playerId === player.id }));

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <BackLink href={`/play/${tournament.id}`} label="Torneo" />

      <div className="min-w-0">
        <p className={eyebrow}>{tournament.name}</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold">Storico</h1>
      </div>

      {slotHistory.matchdayNumbers.length > 0 && ranked.length > 0 ? (
        <StoricoList matchdayNumbers={slotHistory.matchdayNumbers} players={ranked} />
      ) : (
        <p className="text-sm text-foreground-faint">
          Ancora nessuna giornata chiusa: lo storico si popola da qui in
          poi.
        </p>
      )}
    </div>
  );
}
