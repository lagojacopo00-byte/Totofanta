import { notFound } from "next/navigation";
import { requirePlayer } from "@/lib/supabase/require-player";
import * as queries from "@/lib/queries";
import { button, card, cardTight, eyebrow, pillAlive, pillOut } from "@/components/ui";
import { submitPickAction } from "./actions";

const outcomeLabel = { win: "Vinta", draw: "Pareggio", loss: "Persa" } as const;

export default async function PlayerTournamentPage(
  props: PageProps<"/play/[tournamentId]">
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
  const slots = [...player.slots].sort((a, b) => a.label.localeCompare(b.label));

  const [matchdays, allPicks, availableTeams, standings] = await Promise.all([
    queries.getMatchdays(supabase, tournament.id),
    queries.getAllPicksForTournamentSlots(supabase, slots.map((s) => s.id)),
    queries.getAvailableTeams(supabase, tournament.id, tournament.competition),
    queries.getTournamentStandings(supabase, tournament.id),
  ]);

  const openMatchday = matchdays.find((m) => m.status === "open");
  const results = await queries.getResultsForMatchdays(
    supabase,
    matchdays.map((m) => m.id)
  );

  // Accoppiamenti reali di Serie A per la giornata aperta (giornata N del
  // torneo = giornata reale N), per mostrare l'avversario nel menu di
  // scelta — vedi src/app/dashboard/fixtures.
  const openFixtures = openMatchday
    ? await queries.getFixturesForRound(supabase, openMatchday.number)
    : [];
  const opponentLabel = new Map<string, string>();
  for (const f of openFixtures) {
    opponentLabel.set(f.home_team, `vs ${f.away_team} (casa)`);
    opponentLabel.set(f.away_team, `vs ${f.home_team} (trasferta)`);
  }
  const resultKey = (matchdayId: string, teamId: string) => `${matchdayId}:${teamId}`;
  const resultByKey = new Map(
    results.map((r) => [resultKey(r.matchday_id, r.team_id), r.outcome])
  );
  const teamById = new Map(availableTeams.map((t) => [t.id, t.name]));
  const matchdayByNumber = new Map(matchdays.map((m) => [m.id, m.number]));

  let winnerNames: string[] = [];
  if (tournament.status === "finished" && tournament.winners.length > 0) {
    const allPlayers = await queries.getPlayersWithSlots(supabase, tournament.id);
    winnerNames = allPlayers
      .filter((p) => tournament.winners.includes(p.id))
      .map((p) => p.display_name);
  }
  const isWinner = tournament.winners.includes(player.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className={eyebrow}>{tournament.competition}</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold">
          {tournament.name}
        </h1>
      </div>

      {tournament.status === "finished" ? (
        <div className={`${card} ${isWinner ? "border-accent/50" : ""}`}>
          <p className={eyebrow}>Torneo concluso</p>
          <p className="mt-2 font-display text-lg font-bold">
            {isWinner
              ? winnerNames.length > 1
                ? "Avete vinto ex aequo!"
                : "Hai vinto tu!"
              : winnerNames.length > 0
                ? `Ha vinto ${winnerNames.join(", ")}`
                : "Il torneo è concluso."}
          </p>
        </div>
      ) : tournament.status === "draft" ? (
        <p className="text-sm text-foreground-soft">
          Il torneo non è ancora iniziato: l&apos;organizzatore aprirà la
          prima giornata a breve.
        </p>
      ) : null}

      {standings.length > 1 ? (
        <section className={cardTight}>
          <p className={eyebrow}>Classifica</p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {standings
              .slice()
              .sort((a, b) => {
                const aliveA = a.slots.filter((s) => s.status === "alive").length;
                const aliveB = b.slots.filter((s) => s.status === "alive").length;
                return aliveB - aliveA;
              })
              .map((s) => {
                const alive = s.slots.filter((sl) => sl.status === "alive").length;
                const isMe = s.id === player.id;
                return (
                  <li
                    key={s.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span
                      className={
                        isMe
                          ? "font-display font-bold text-foreground"
                          : "text-foreground-soft"
                      }
                    >
                      {s.display_name}
                      {isMe ? " (tu)" : ""}
                    </span>
                    <span className={alive > 0 ? pillAlive : pillOut}>
                      {alive}/{s.slots.length} vivi
                    </span>
                  </li>
                );
              })}
          </ul>
        </section>
      ) : null}

      <section className="flex flex-col gap-4">
        {slots.map((slot) => {
          const slotPicks = allPicks
            .filter((p) => p.slot_id === slot.id)
            .sort(
              (a, b) =>
                (matchdayByNumber.get(a.matchday_id) ?? 0) -
                (matchdayByNumber.get(b.matchday_id) ?? 0)
            );
          const usedTeamIds = slotPicks.map((p) => p.team_id);
          const pickForOpenMatchday = openMatchday
            ? slotPicks.find((p) => p.matchday_id === openMatchday.id)
            : undefined;
          const available = availableTeams.filter(
            (t) => !usedTeamIds.includes(t.id)
          );

          return (
            <div key={slot.id} className={card}>
              <div className="flex items-center justify-between">
                <p className="font-display text-lg font-bold">
                  Slot {slot.label}
                </p>
                <span className={slot.status === "alive" ? pillAlive : pillOut}>
                  {slot.status === "alive"
                    ? "In gara"
                    : `Eliminato · G${slot.eliminated_matchday}`}
                </span>
              </div>

              {slot.status === "alive" && openMatchday ? (
                pickForOpenMatchday ? (
                  <p className="mt-3 text-sm text-foreground-soft">
                    Giornata {openMatchday.number}: hai scelto{" "}
                    <strong className="text-foreground">
                      {teamById.get(pickForOpenMatchday.team_id) ?? "—"}
                    </strong>
                    . In attesa del risultato.
                  </p>
                ) : (
                  <form
                    action={submitPickAction.bind(
                      null,
                      tournament.id,
                      slot.id,
                      openMatchday.id
                    )}
                    className="mt-3 flex gap-2"
                  >
                    <select
                      name="team_id"
                      required
                      defaultValue=""
                      className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="" disabled>
                        Scegli una squadra per la giornata {openMatchday.number}
                      </option>
                      {available.map((t) => (
                        <option key={t.id} value={t.id}>
                          {opponentLabel.has(t.name)
                            ? `${t.name} — ${opponentLabel.get(t.name)}`
                            : t.name}
                        </option>
                      ))}
                    </select>
                    <button className={button} type="submit">
                      Scegli
                    </button>
                  </form>
                )
              ) : slot.status === "alive" ? (
                <p className="mt-3 text-sm text-foreground-faint">
                  Nessuna giornata aperta al momento.
                </p>
              ) : null}

              {slotPicks.length > 0 ? (
                <ul className="mt-4 flex flex-col gap-1.5 border-t border-line pt-3">
                  {slotPicks.map((p) => {
                    const number = matchdayByNumber.get(p.matchday_id);
                    const outcome = resultByKey.get(
                      resultKey(p.matchday_id, p.team_id)
                    );
                    return (
                      <li
                        key={p.id}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-foreground-faint">
                          G{number} &middot; {teamById.get(p.team_id) ?? "—"}
                        </span>
                        <span
                          className={
                            outcome === "win"
                              ? "text-accent"
                              : outcome
                                ? "text-lose"
                                : "text-foreground-faint"
                          }
                        >
                          {outcome ? outcomeLabel[outcome] : "in corso"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          );
        })}
      </section>
    </div>
  );
}
