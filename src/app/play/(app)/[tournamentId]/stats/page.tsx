import { notFound } from "next/navigation";
import { requirePlayer } from "@/lib/supabase/require-player";
import * as queries from "@/lib/queries";
import { cardTight, eyebrow } from "@/components/ui";
import { BackLink } from "@/components/back-link";

export default async function TournamentStatsPage(
  props: PageProps<"/play/[tournamentId]/stats">
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
  const standings = await queries.getTournamentStandings(supabase, tournament.id);
  const totalPlayers = standings.length;
  const totalSlots = standings.reduce((sum, s) => sum + s.slots.length, 0);
  const aliveSlots = standings.reduce(
    (sum, s) => sum + s.slots.filter((sl) => sl.status === "alive").length,
    0
  );

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <BackLink href={`/play/${tournament.id}`} label="Torneo" />

      <div className="min-w-0">
        <p className={eyebrow}>{tournament.name}</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold">Stats</h1>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div className={`${cardTight} text-center`}>
          <p className="font-mono text-2xl font-bold text-foreground">{totalPlayers}</p>
          <p className="mt-0.5 text-[11px] text-foreground-faint">
            {totalPlayers === 1 ? "giocatore" : "giocatori"}
          </p>
        </div>
        <div className={`${cardTight} text-center`}>
          <p className="font-mono text-2xl font-bold text-accent">{aliveSlots}</p>
          <p className="mt-0.5 text-[11px] text-foreground-faint">slot in gara</p>
        </div>
        <div className={`${cardTight} text-center`}>
          <p className="font-mono text-2xl font-bold text-foreground">{totalSlots}</p>
          <p className="mt-0.5 text-[11px] text-foreground-faint">slot totali</p>
        </div>
      </div>
    </div>
  );
}
