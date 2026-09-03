import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/require-user";
import * as queries from "@/lib/queries";
import { buttonGhost, cardTight, eyebrow, input, pillAlive, pillOut } from "@/components/ui";
import { TeamLabel } from "@/components/team-badge";
import { BackLink } from "@/components/back-link";
import { groupFixturesByDay } from "@/lib/match-window";
import { organizerClearPickAction, organizerSetPickAction } from "./actions";
import {
  MatchdayResultsForm,
  type OtherResultTeam,
  type ResultDayGroup,
} from "./matchday-results-form";

const outcomeLabel = { win: "Vinta", draw: "Pareggiata", loss: "Persa" } as const;

export default async function MatchdayPage(
  props: PageProps<"/dashboard/[id]/matchday/[matchdayId]">
) {
  const { id, matchdayId } = await props.params;
  const { supabase, user } = await requireUser();

  const tournament = await queries.getTournament(supabase, id);
  if (tournament.owner_id !== user.id) notFound();

  const matchday = await queries.getMatchday(supabase, matchdayId);
  if (matchday.tournament_id !== id) notFound();

  const [picks, players, availableTeams, excludedTeamNames] = await Promise.all([
    queries.getPicksForMatchday(supabase, matchday.id),
    queries.getPlayersWithSlots(supabase, id),
    queries.getAvailableTeams(supabase, id, tournament.competition),
    queries.getExcludedTeamNames(supabase, matchday.number),
  ]);

  const allSlotIds = players.flatMap((p) => p.slots.map((s) => s.id));
  const allHistory = await queries.getAllPicksForTournamentSlots(supabase, allSlotIds);

  const slotOwner = new Map<string, string>();
  for (const p of players) {
    for (const s of p.slots) slotOwner.set(s.id, `${p.display_name} · ${s.label}`);
  }

  const teamIds = Array.from(new Set(picks.map((p) => p.team_id)));
  const teams = await queries.getTeamsByIds(supabase, teamIds);
  const teamName = new Map(teams.map((t) => [t.id, t.name]));

  const pickersByTeam = new Map<string, string[]>();
  for (const p of picks) {
    const list = pickersByTeam.get(p.team_id) ?? [];
    list.push(slotOwner.get(p.slot_id) ?? "?");
    pickersByTeam.set(p.team_id, list);
  }

  const isOpen = matchday.status === "open";
  const results = isOpen ? [] : await queries.getMatchdayResults(supabase, matchday.id);
  const resultByTeam = new Map(results.map((r) => [r.team_id, r.outcome]));

  // Inserimento risultati partita per partita (non più squadra per
  // squadra): serve sapere quale coppia casa/trasferta corrisponde a
  // ciascuna squadra scelta questa giornata — vedi matchday-results-form.tsx.
  // Il match tra fixture (che riportano il NOME) e teamId avviene per
  // nome, come nel picker dei giocatori (team-picker.tsx).
  let resultDayGroups: ResultDayGroup[] = [];
  let otherResultTeams: OtherResultTeam[] = [];
  if (isOpen && teamIds.length > 0) {
    const fixtures = await queries.getFixturesForRound(supabase, matchday.number);
    const teamIdByName = new Map(availableTeams.map((t) => [t.name, t.id]));
    const pickedTeamIdSet = new Set(teamIds);

    const relevantFixtures = fixtures.filter((f) => {
      const homeId = teamIdByName.get(f.home_team);
      const awayId = teamIdByName.get(f.away_team);
      return (
        (homeId && pickedTeamIdSet.has(homeId)) || (awayId && pickedTeamIdSet.has(awayId))
      );
    });
    const matchedTeamIds = new Set(
      relevantFixtures.flatMap((f) => {
        const homeId = teamIdByName.get(f.home_team);
        const awayId = teamIdByName.get(f.away_team);
        return [homeId, awayId].filter((x): x is string => Boolean(x));
      })
    );

    resultDayGroups = groupFixturesByDay(relevantFixtures).map(({ group, fixtures: fs }) => ({
      group,
      fixtures: fs.map((f) => {
        const homeId = teamIdByName.get(f.home_team) ?? null;
        const awayId = teamIdByName.get(f.away_team) ?? null;
        return {
          id: f.id,
          homeTeamId: homeId,
          homeTeamName: f.home_team,
          awayTeamId: awayId,
          awayTeamName: f.away_team,
          homePickers: homeId ? (pickersByTeam.get(homeId) ?? []) : [],
          awayPickers: awayId ? (pickersByTeam.get(awayId) ?? []) : [],
          defaultResult: f.result,
          isExcluded: excludedTeamNames.has(f.home_team) || excludedTeamNames.has(f.away_team),
        };
      }),
    }));

    otherResultTeams = teamIds
      .filter((tid) => !matchedTeamIds.has(tid))
      .map((tid) => ({
        id: tid,
        name: teamName.get(tid) ?? tid,
        pickers: pickersByTeam.get(tid) ?? [],
      }));
  }

  // Righe per la gestione manuale delle scelte (solo giornata aperta): una
  // per ogni slot ancora vivo, con la scelta attuale (se c'è) e le squadre
  // ancora disponibili per quello slot — l'organizzatore può schierare,
  // cambiare o togliere la scelta di chiunque, senza il vincolo del
  // scadenza (calcio d'inizio della prima partita) che vale per i
  // giocatori.
  const managedRows = isOpen
    ? players.flatMap((p) =>
        p.slots
          .filter((s) => s.status === "alive")
          .map((s) => {
            const history = allHistory.filter((pk) => pk.slot_id === s.id);
            const currentPick = history.find((pk) => pk.matchday_id === matchday.id);
            const usedElsewhere = history
              .filter((pk) => pk.matchday_id !== matchday.id)
              .map((pk) => pk.team_id);
            const available = availableTeams.filter(
              (t) => !usedElsewhere.includes(t.id)
            );
            return { player: p, slot: s, currentPick, available };
          })
      )
    : [];

  return (
    <div className="flex flex-col gap-6">
      <BackLink href={`/dashboard/${id}`} label="Torneo" />
      <div>
        <p className={eyebrow}>{tournament.name}</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold">
          Giornata {matchday.number}
        </h1>
      </div>

      {isOpen ? (
        <section className="flex flex-col gap-3">
          <div>
            <p className={eyebrow}>Gestisci le scelte</p>
            <p className="mt-1 text-xs text-foreground-soft">
              Schiera, cambia o togli la scelta di ogni giocatore quando
              vuoi — anche oltre la scadenza (calcio d&apos;inizio della
              prima partita) che vale per loro.
            </p>
          </div>
          {managedRows.length === 0 ? (
            <p className="text-sm text-foreground-faint">
              Nessuno slot in gara al momento.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {managedRows.map(({ player, slot, currentPick, available }) => (
                <li
                  key={slot.id}
                  className={`${cardTight} flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between`}
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {player.display_name} · slot {slot.label}
                    </p>
                    <p className="mt-0.5 text-xs text-foreground-faint">
                      {currentPick ? (
                        <TeamLabel
                          name={teamName.get(currentPick.team_id) ?? "—"}
                          size="xs"
                        />
                      ) : (
                        "Nessuna scelta"
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <form
                      action={organizerSetPickAction.bind(
                        null,
                        id,
                        slot.id,
                        matchday.id
                      )}
                      className="flex items-center gap-1.5"
                    >
                      <select
                        className={`${input} w-auto py-1.5 text-xs`}
                        name="team_id"
                        defaultValue={currentPick?.team_id ?? ""}
                        required
                      >
                        <option value="" disabled>
                          Scegli squadra…
                        </option>
                        {available.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                      <button
                        className={`${buttonGhost} px-2.5 py-1.5 text-xs`}
                        type="submit"
                      >
                        Salva
                      </button>
                    </form>
                    {currentPick ? (
                      <form
                        action={organizerClearPickAction.bind(
                          null,
                          id,
                          slot.id,
                          matchday.id
                        )}
                      >
                        <button
                          className={`${buttonGhost} px-2.5 py-1.5 text-xs border-lose/40 text-lose hover:border-lose hover:text-lose`}
                          type="submit"
                        >
                          Rimuovi
                        </button>
                      </form>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {teamIds.length === 0 ? (
        <p className="text-sm text-foreground-soft">
          Nessuno ha ancora scelto una squadra per questa giornata.
        </p>
      ) : isOpen ? (
        <section className="flex flex-col gap-3">
          <div>
            <p className={eyebrow}>Carica risultati</p>
            <p className="mt-1 text-xs text-foreground-soft">
              Partita per partita, come nella scelta dei giocatori — se
              l&apos;esito è già noto da{" "}
              <strong className="text-foreground-soft">Anticipa risultati</strong>{" "}
              o dalla sincronizzazione automatica, è già selezionato.
            </p>
          </div>
          <MatchdayResultsForm
            tournamentId={id}
            matchdayId={matchday.id}
            dayGroups={resultDayGroups}
            otherTeams={otherResultTeams}
          />
        </section>
      ) : (
        <ul className="flex flex-col gap-2">
          {teamIds.map((teamId) => {
            const outcome = resultByTeam.get(teamId);
            return (
              <li
                key={teamId}
                className={`${cardTight} flex items-center justify-between gap-4`}
              >
                <div>
                  <p className="font-display font-bold">
                  <TeamLabel name={teamName.get(teamId) ?? teamId} size="md" />
                </p>
                  <p className="text-xs text-foreground-faint">
                    {pickersByTeam.get(teamId)?.join(", ")}
                  </p>
                </div>
                <span className={outcome === "win" ? pillAlive : pillOut}>
                  {outcome ? outcomeLabel[outcome] : "—"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
