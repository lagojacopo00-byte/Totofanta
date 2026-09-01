import { notFound } from "next/navigation";
import { requirePlayer } from "@/lib/supabase/require-player";
import * as queries from "@/lib/queries";
import { button, card, cardTight, eyebrow, pillAlive, pillOut } from "@/components/ui";
import { TeamBadge, TeamLabel } from "@/components/team-badge";
import { PickCountdown } from "@/components/pick-countdown";
import { isPickingWindowOpen } from "@/lib/pick-window";
import { groupFixturesByDay, type MatchDayGroup } from "@/lib/match-window";
import { submitPickAction } from "./actions";

const outcomeLabel = { win: "Vinta", draw: "Pareggio", loss: "Persa" } as const;

const dayGroupLabel: Record<MatchDayGroup, string> = {
  venerdì: "Venerdì",
  sabato: "Sabato",
  domenica: "Domenica",
  lunedì: "Lunedì",
  altro: "Data da confermare",
};

const kickoffTimeFormat = new Intl.DateTimeFormat("it-IT", {
  hour: "2-digit",
  minute: "2-digit",
});

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
  // Gli slot sono numerati ("1", "2", ...) per i tornei nuovi, ma quelli
  // creati prima possono ancora avere etichette a lettere: l'ordinamento
  // numerico ha priorità quando entrambe le etichette sono numeri, con un
  // confronto testuale come ripiego per non spezzare i casi misti.
  const slots = [...player.slots].sort((a, b) => {
    const numA = Number(a.label);
    const numB = Number(b.label);
    if (!Number.isNaN(numA) && !Number.isNaN(numB)) return numA - numB;
    return a.label.localeCompare(b.label);
  });

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
  // torneo = giornata reale N) — vedi src/app/dashboard/fixtures.
  const [openFixtures, excludedTeamNames] = openMatchday
    ? await Promise.all([
        queries.getFixturesForRound(supabase, openMatchday.number),
        queries.getExcludedTeamNames(supabase, openMatchday.number),
      ])
    : [[], new Set<string>()];
  // Partite della giornata aperta raggruppate per giorno, per la
  // schermata di scelta come lista partite (vedi src/lib/match-window.ts).
  // Le squadre disponibili ma senza una partita in calendario questa
  // giornata (es. competizioni personalizzate senza calendario) restano
  // scelte in fondo, fuori dai gruppi.
  const fixtureDayGroups = groupFixturesByDay(openFixtures);
  const teamNamesInFixtures = new Set(
    openFixtures.flatMap((f) => [f.home_team, f.away_team])
  );
  const teamByName = new Map(availableTeams.map((t) => [t.name, t]));
  const resultKey = (matchdayId: string, teamId: string) => `${matchdayId}:${teamId}`;
  const resultByKey = new Map(
    results.map((r) => [resultKey(r.matchday_id, r.team_id), r.outcome])
  );
  const teamById = new Map(availableTeams.map((t) => [t.id, t.name]));
  const matchdayByNumber = new Map(matchdays.map((m) => [m.id, m.number]));

  // Classifica ordinata per slot vivi (decrescente), con posizione in
  // classifica calcolata gestendo i pari merito: chi ha lo stesso numero
  // di slot vivi condivide la stessa posizione.
  const rankedStandings = standings
    .map((s) => ({
      ...s,
      alive: s.slots.filter((sl) => sl.status === "alive").length,
    }))
    .sort((a, b) => b.alive - a.alive);
  const withRank = rankedStandings.reduce<
    ((typeof rankedStandings)[number] & { rank: number })[]
  >((acc, s, idx) => {
    const previous = acc[idx - 1];
    const rank = previous && previous.alive === s.alive ? previous.rank : idx + 1;
    acc.push({ ...s, rank });
    return acc;
  }, []);

  // Statistiche del torneo, per la panoramica: quanti giocatori in totale
  // e quanti slot sono ancora vivi sul totale complessivo.
  const totalPlayers = standings.length;
  const totalSlots = standings.reduce((sum, s) => sum + s.slots.length, 0);
  const aliveSlots = standings.reduce(
    (sum, s) => sum + s.slots.filter((sl) => sl.status === "alive").length,
    0
  );

  const me = withRank.find((s) => s.id === player.id);
  const myRank = me?.rank ?? 1;
  const myAliveSlots = slots.filter((s) => s.status === "alive").length;
  const tiedWithMe = withRank.filter((s) => s.rank === myRank).length - 1;

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
  const pickingOpen = isPickingWindowOpen();

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="min-w-0">
        <p className={eyebrow}>{tournament.competition}</p>
        <h1 className="mt-1 break-words font-display text-2xl font-extrabold">
          {tournament.name}
        </h1>
        {tournament.status === "active" ? (
          <div className="mt-1.5">
            <PickCountdown />
          </div>
        ) : null}
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

      {/* La tua posizione: il primo numero che deve saltare all'occhio
          entrando nel torneo. */}
      <section className={`${card} border-accent/30`}>
        <p className={eyebrow}>La tua posizione</p>
        <div className="mt-2 flex items-end justify-between gap-4">
          <p className="font-display text-4xl font-extrabold leading-none text-foreground">
            {myRank}
            <span className="ml-1 text-base font-bold text-foreground-faint">
              /{totalPlayers}
            </span>
          </p>
          <span className={myAliveSlots > 0 ? pillAlive : pillOut}>
            {myAliveSlots}/{slots.length} tuoi slot vivi
          </span>
        </div>
        {totalPlayers > 1 ? (
          <p className="mt-2 text-xs text-foreground-faint">
            {tiedWithMe > 0
              ? `A pari merito con altri ${tiedWithMe} ${tiedWithMe === 1 ? "giocatore" : "giocatori"}.`
              : myRank === 1
                ? "Sei al comando."
                : "Continua così per risalire la classifica."}
          </p>
        ) : null}
      </section>

      {/* Slot e scelta squadra: quello per cui si torna sull'app ogni
          settimana, subito visibile appena si entra. */}
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
          const otherTeams = availableTeams.filter(
            (t) => !teamNamesInFixtures.has(t.name) && !usedTeamIds.includes(t.id)
          );

          // Un'opzione di scelta (una squadra): oscurata e non cliccabile
          // se già usata su questo slot, se la sua partita è esclusa/fuori
          // dalla finestra ven-sab-dom-lun, o se non fa parte delle
          // squadre disponibili per questo torneo.
          const renderTeamOption = (teamName: string) => {
            const team = teamByName.get(teamName);
            const isExcluded = excludedTeamNames.has(teamName);
            const isUsed = team ? usedTeamIds.includes(team.id) : false;
            const disabled = !team || isExcluded || isUsed;
            const reason = !team
              ? "non in questo torneo"
              : isExcluded
                ? "non disponibile"
                : isUsed
                  ? "già scelta"
                  : null;
            return (
              <label
                key={teamName}
                className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs transition-colors ${
                  disabled
                    ? "cursor-not-allowed border-line bg-surface-2/50 opacity-50"
                    : "cursor-pointer border-line bg-surface-2 has-[:checked]:border-accent has-[:checked]:bg-win-bg"
                }`}
              >
                <input
                  type="radio"
                  name="team_id"
                  value={team?.id ?? ""}
                  required
                  disabled={disabled}
                  className="sr-only"
                />
                <TeamBadge name={teamName} size="sm" />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-semibold text-foreground">
                    {teamName}
                  </span>
                  {reason ? (
                    <span className="truncate text-[10px] text-foreground-faint">
                      {reason}
                    </span>
                  ) : null}
                </span>
              </label>
            );
          };

          return (
            <div key={slot.id} className={`${card} min-w-0`}>
              <div className="flex items-center justify-between gap-2">
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
                ) : !pickingOpen ? (
                  <p className="mt-3 text-sm text-foreground-faint">
                    Le scelte per questa giornata sono chiuse: si schiera
                    solo da lunedì a giovedì. Aspetta i risultati di
                    lunedì.
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
                    <div className="flex flex-col gap-3">
                      {fixtureDayGroups.map(({ group, fixtures }) => (
                        <div key={group} className="flex flex-col gap-1.5">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-foreground-faint">
                            {dayGroupLabel[group]}
                          </p>
                          <div className="flex flex-col gap-2">
                            {fixtures.map((f) => (
                              <div key={f.id} className="flex flex-col gap-1">
                                {f.kickoff_at ? (
                                  <p className="text-[10px] text-foreground-faint">
                                    {kickoffTimeFormat.format(new Date(f.kickoff_at))}
                                  </p>
                                ) : null}
                                <div className="grid grid-cols-2 gap-1.5">
                                  {renderTeamOption(f.home_team)}
                                  {renderTeamOption(f.away_team)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      {otherTeams.length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-foreground-faint">
                            Altre squadre disponibili
                          </p>
                          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                            {otherTeams.map((t) => renderTeamOption(t.name))}
                          </div>
                        </div>
                      ) : null}
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

      {withRank.length > 1 ? (
        <section className={cardTight}>
          <p className={eyebrow}>Classifica</p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {withRank.map((s) => {
              const isMe = s.id === player.id;
              return (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="font-mono text-xs text-foreground-faint">
                      {s.rank}°
                    </span>
                    <span
                      className={
                        isMe
                          ? "truncate font-display font-bold text-foreground"
                          : "truncate text-foreground-soft"
                      }
                    >
                      {s.display_name}
                      {isMe ? " (tu)" : ""}
                    </span>
                  </span>
                  <span className={s.alive > 0 ? pillAlive : pillOut}>
                    {s.alive}/{s.slots.length} vivi
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
