import { notFound } from "next/navigation";
import { requirePlayer } from "@/lib/supabase/require-player";
import * as queries from "@/lib/queries";
import { button, card, cardTight, eyebrow, pillAlive, pillOut } from "@/components/ui";
import { TeamBadge, TeamLabel } from "@/components/team-badge";
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

  // Statistiche del torneo, per la panoramica in alto: quanti giocatori in
  // totale e quanti slot sono ancora vivi sul totale complessivo.
  const totalPlayers = standings.length;
  const totalSlots = standings.reduce((sum, s) => sum + s.slots.length, 0);
  const aliveSlots = standings.reduce(
    (sum, s) => sum + s.slots.filter((sl) => sl.status === "alive").length,
    0
  );

  // Tutte le squadre già giocate da questo giocatore (su qualunque suo
  // slot), per il piccolo "album" delle squadre bruciate finora.
  const playedTeamNames = Array.from(
    new Set(
      allPicks
        .map((p) => teamById.get(p.team_id))
        .filter((name): name is string => Boolean(name))
    )
  ).sort((a, b) => a.localeCompare(b));

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

      <div className="grid grid-cols-3 gap-2.5">
        <div className={`${cardTight} text-center`}>
          <p className="font-mono text-2xl font-bold text-foreground">
            {totalPlayers}
          </p>
          <p className="mt-0.5 text-[11px] text-foreground-faint">
            {totalPlayers === 1 ? "giocatore" : "giocatori"}
          </p>
        </div>
        <div className={`${cardTight} text-center`}>
          <p className="font-mono text-2xl font-bold text-accent">
            {aliveSlots}
          </p>
          <p className="mt-0.5 text-[11px] text-foreground-faint">
            slot in gara
          </p>
        </div>
        <div className={`${cardTight} text-center`}>
          <p className="font-mono text-2xl font-bold text-foreground">
            {totalSlots}
          </p>
          <p className="mt-0.5 text-[11px] text-foreground-faint">
            slot totali
          </p>
        </div>
      </div>

      {playedTeamNames.length > 0 ? (
        <section className={cardTight}>
          <p className={eyebrow}>Le squadre che hai già giocato</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {playedTeamNames.map((name) => (
              <TeamBadge key={name} name={name} size="md" />
            ))}
          </div>
        </section>
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
                  <p className="mt-3 flex flex-wrap items-center gap-1.5 text-sm text-foreground-soft">
                    <span>Giornata {openMatchday.number}: hai scelto</span>
                    <TeamLabel
                      name={teamById.get(pickForOpenMatchday.team_id) ?? "—"}
                    />
                    <span>. In attesa del risultato.</span>
                  </p>
                ) : (
                  <form
                    action={submitPickAction.bind(
                      null,
                      tournament.id,
                      slot.id,
                      openMatchday.id
                    )}
                    className="mt-3 flex flex-col gap-3"
                  >
                    <p className="text-xs text-foreground-faint">
                      Scegli una squadra per la giornata {openMatchday.number}
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {available.map((t) => (
                        <label
                          key={t.id}
                          className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-surface-2 px-2.5 py-2 text-xs transition-colors has-[:checked]:border-accent has-[:checked]:bg-win-bg"
                        >
                          <input
                            type="radio"
                            name="team_id"
                            value={t.id}
                            required
                            className="sr-only"
                          />
                          <TeamBadge name={t.name} size="sm" />
                          <span className="flex min-w-0 flex-col">
                            <span className="truncate font-semibold text-foreground">
                              {t.name}
                            </span>
                            {opponentLabel.has(t.name) ? (
                              <span className="truncate text-[10px] text-foreground-faint">
                                {opponentLabel.get(t.name)}
                              </span>
                            ) : null}
                          </span>
                        </label>
                      ))}
                    </div>
                    <button className={`${button} self-start`} type="submit">
                      Conferma scelta
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
                        className="flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="flex items-center gap-1.5 text-foreground-faint">
                          <span>G{number}</span>
                          <TeamLabel
                            name={teamById.get(p.team_id) ?? "—"}
                            size="xs"
                          />
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
