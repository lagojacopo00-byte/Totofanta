import { notFound } from "next/navigation";
import { requirePlayer } from "@/lib/supabase/require-player";
import * as queries from "@/lib/queries";
import { card, eyebrow, pillAlive } from "@/components/ui";
import { TrophyIcon } from "@/components/rule-icons";
import { computePickDeadline, isPickingWindowOpen } from "@/lib/pick-window";
import { groupFixturesByDay } from "@/lib/match-window";
import { computeFinalPrizeShares, computeTeamOutcomes } from "@/lib/game-logic";
import { TeamPicker, type PickerDayGroup, type PickerSlot } from "./team-picker";
import { MatchdayRecap, type RecapSlot } from "./matchday-recap";
import { AutoRefresh } from "@/components/auto-refresh";

const prizeFormat = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

// Stessa valuta ma senza decimali: per la sezione "Premio" mentre il
// torneo è in corso (montepremi, quota attuale, prezzo a slot), dove
// l'utente ha chiesto cifre tonde — non per la ripartizione finale a
// torneo concluso, che resta con i centesimi (prizeFormat sopra).
const prizeFormatWhole = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 11v5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="7.7" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

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

  // Accoppiamenti reali di Serie A per la giornata aperta (giornata N del
  // torneo = giornata reale N) — vedi src/app/dashboard/fixtures.
  const [openFixtures, excludedTeamNames] = openMatchday
    ? await Promise.all([
        queries.getFixturesForRound(supabase, openMatchday.number),
        queries.getExcludedTeamNames(supabase, openMatchday.number),
      ])
    : [[], new Set<string>()];
  const fixtureDayGroups = groupFixturesByDay(openFixtures);
  const teamNamesInFixtures = new Set(
    openFixtures.flatMap((f) => [f.home_team, f.away_team])
  );
  const teamById = new Map(availableTeams.map((t) => [t.id, t.name]));

  // Ripartizione del montepremi a fine torneo: la quota di OGNI vincitore
  // (non solo la mia), per il riepilogo "chi ha vinto quanto" nella card
  // Game over e nella classifica sotto — vedi computeFinalPrizeShares in
  // game-logic.ts per i dettagli, incluso il caso ex aequo "zero
  // superstiti". In una vittoria singola c'è una sola entry con share 1.
  let winnerNames: string[] = [];
  let prizeBreakdown: { playerId: string; name: string; share: number }[] = [];
  if (tournament.status === "finished" && tournament.winners.length > 0) {
    const allPlayers = await queries.getPlayersWithSlots(supabase, tournament.id);
    const nameById = new Map(allPlayers.map((p) => [p.id, p.display_name]));
    winnerNames = allPlayers
      .filter((p) => tournament.winners.includes(p.id))
      .map((p) => p.display_name);

    prizeBreakdown = computeFinalPrizeShares(
      standings.map((s) => ({
        id: s.id,
        slots: s.slots.map((sl) => ({
          status: sl.status,
          eliminatedMatchday: sl.eliminated_matchday,
        })),
      })),
      tournament.winners,
      tournament.decisive_matchday
    )
      .map(({ playerId, share }) => ({
        playerId,
        name: nameById.get(playerId) ?? "?",
        share,
      }))
      .sort((a, b) => b.share - a.share);
  }
  const isWinner = tournament.winners.includes(player.id);
  const myPrizeShare = prizeBreakdown.find((s) => s.playerId === player.id)?.share ?? null;

  // Statistiche del torneo (quanti slot sono ancora vivi sul totale
  // complessivo): solo quanto serve al calcolo del Premio qui sotto — il
  // resto (giocatori, slot totali, classifica) è nella pagina Stats/
  // Storico, non più qui (richiesto dall'utente il 2026-09-24: la
  // schermata del torneo deve avere solo Premio e picker).
  const totalSlots = standings.reduce((sum, s) => sum + s.slots.length, 0);
  const aliveSlots = standings.reduce(
    (sum, s) => sum + s.slots.filter((sl) => sl.status === "alive").length,
    0
  );

  const myAliveSlots = slots.filter((s) => s.status === "alive").length;
  const myAliveSlotsList = slots.filter((s) => s.status === "alive");

  // Scadenza per schierare = orario del primo calcio d'inizio non escluso
  // di QUESTA giornata (non più un giorno fisso di calendario) — vedi
  // src/lib/pick-window.ts.
  const pickDeadline = computePickDeadline(openFixtures, excludedTeamNames);
  const pickingOpen = isPickingWindowOpen(pickDeadline);

  // Per il picker unico: le squadre che OGNI slot può ancora scegliere per
  // la giornata aperta (tutte le disponibili nel torneo, tranne quelle
  // escluse questa giornata e quelle già usate su QUESTO slot in ALTRE
  // giornate — la scelta già fatta per la giornata aperta, se c'è, non
  // conta come "già usata" contro se stessa: si può ancora cambiare).
  const pickerSlots: PickerSlot[] = openMatchday
    ? myAliveSlotsList.map((slot) => {
        const usedElsewhere = new Set(
          allPicks
            .filter((p) => p.slot_id === slot.id && p.matchday_id !== openMatchday.id)
            .map((p) => p.team_id)
        );
        const eligibleTeamIds = availableTeams
          .filter((t) => !excludedTeamNames.has(t.name) && !usedElsewhere.has(t.id))
          .map((t) => t.id);
        const current = allPicks.find(
          (p) => p.slot_id === slot.id && p.matchday_id === openMatchday.id
        );
        return {
          id: slot.id,
          label: slot.label,
          eligibleTeamIds,
          currentTeamId: current?.team_id ?? null,
        };
      })
    : [];

  const pickerDayGroups: PickerDayGroup[] = fixtureDayGroups.map(({ group, fixtures }) => ({
    group,
    fixtures: fixtures.map((f) => ({
      id: f.id,
      homeTeam: f.home_team,
      awayTeam: f.away_team,
      kickoffAt: f.kickoff_at,
      result: f.result,
    })),
  }));
  const otherTeams = availableTeams.filter((t) => !teamNamesInFixtures.has(t.name));
  const teamOptions = availableTeams.map((t) => ({ id: t.id, name: t.name }));

  // Riepilogo giornata: uno slot schierato = una riga, anche se due slot
  // hanno scelto la stessa squadra (deciso con l'utente: entrambi vanno
  // mostrati separatamente con il proprio stato). Progressivo: una
  // partita ancora in corso resta "In corso" finché non arriva il
  // risultato — vedi computeTeamOutcomes in game-logic.ts, che a
  // differenza di computeRoundOutcomes non aspetta la giornata intera.
  const teamOutcomeByName = computeTeamOutcomes(openFixtures);
  const recapSlots: RecapSlot[] = openMatchday
    ? myAliveSlotsList
        .map((slot): RecapSlot | null => {
          const pick = allPicks.find(
            (p) => p.slot_id === slot.id && p.matchday_id === openMatchday.id
          );
          if (!pick) return null;
          const teamName = teamById.get(pick.team_id);
          if (!teamName) return null;
          const fixture = openFixtures.find(
            (f) => f.home_team === teamName || f.away_team === teamName
          );
          if (!fixture) return null;

          const isExempt = excludedTeamNames.has(teamName);
          const outcome = teamOutcomeByName.get(teamName);
          const status: RecapSlot["status"] = isExempt
            ? "exempt"
            : !outcome
              ? "pending"
              : outcome === "win"
                ? "alive"
                : "eliminated";

          return {
            id: slot.id,
            label: slot.label,
            homeTeam: fixture.home_team,
            awayTeam: fixture.away_team,
            pickedTeam: teamName,
            kickoffAt: fixture.kickoff_at,
            result: fixture.result,
            status,
          };
        })
        .filter((s): s is RecapSlot => s !== null)
    : [];

  // Per la barra fissa del picker a scelte chiuse (readOnly): stessa
  // classificazione del riepilogo sopra (vittoria = alive/exempt,
  // pareggio/persa = eliminated, da decidere = pending), qui solo
  // contata invece che elencata.
  const outcomeCounts = recapSlots.reduce(
    (acc, s) => {
      if (s.status === "alive" || s.status === "exempt") acc.win += 1;
      else if (s.status === "eliminated") acc.lost += 1;
      else acc.pending += 1;
      return acc;
    },
    { win: 0, lost: 0, pending: 0 }
  );

  return (
    <div className="flex min-w-0 flex-col gap-6">
      {tournament.status === "active" && openMatchday ? (
        <AutoRefresh intervalMs={60_000} />
      ) : null}

      <div className="min-w-0">
        <p className={eyebrow}>{tournament.competition}</p>
        <h1 className="mt-1 break-words font-display text-2xl font-extrabold">
          {tournament.name}
        </h1>
      </div>

      {tournament.status === "finished" ? (
        <div
          className={`${card} ${isWinner ? "items-center border-accent/50 text-center" : ""} flex flex-col`}
        >
          {isWinner ? <TrophyIcon className="h-14 w-14 text-accent" /> : null}
          <p className={`${eyebrow} ${isWinner ? "mt-3" : ""}`}>Game over</p>
          <p className="mt-2 font-display text-lg font-bold">
            {isWinner
              ? winnerNames.length > 1
                ? "Ex aequo: avete vinto insieme!"
                : "Hai vinto tu. Sei l'ultimo rimasto in piedi."
              : winnerNames.length > 0
                ? `Ha vinto ${winnerNames.join(", ")}`
                : "Torneo chiuso. Si ricomincia alla prossima."}
          </p>
          {isWinner && tournament.slot_value > 0 && myPrizeShare !== null ? (
            <div className="mt-4 flex flex-col items-center gap-1.5">
              <p className="font-display text-5xl font-extrabold leading-none text-accent">
                {prizeFormat.format(tournament.slot_value * totalSlots * myPrizeShare)}
              </p>
              <span className={pillAlive}>
                {(myPrizeShare * 100).toLocaleString("it-IT", {
                  maximumFractionDigits: 1,
                })}
                % del montepremi
              </span>
            </div>
          ) : null}

          {/* Chi ha vinto quanto: mostrata solo nel vero ex aequo (più di
              un vincitore) — con un solo vincitore basta già il numero
              grande sopra, ripeterlo qui sarebbe ridondante. Visibile
              anche a chi non ha vinto: è la ripartizione finale del
              montepremi, un'informazione di tutti. `w-full text-left`
              contro il `text-center` della card quando sono io il
              vincitore. */}
          {prizeBreakdown.length > 1 ? (
            <div className="mt-4 flex w-full flex-col gap-1.5 text-left">
              {prizeBreakdown.map(({ playerId, name, share }) => (
                <div
                  key={playerId}
                  className="flex items-center justify-between gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm"
                >
                  <span
                    className={
                      playerId === player.id
                        ? "truncate font-bold text-foreground"
                        : "truncate text-foreground-soft"
                    }
                  >
                    {name}
                    {playerId === player.id ? " (tu)" : ""}
                  </span>
                  <span className="flex flex-none items-center gap-2">
                    <span className="font-mono text-xs text-foreground-faint">
                      {(share * 100).toLocaleString("it-IT", {
                        maximumFractionDigits: 1,
                      })}
                      %
                    </span>
                    {tournament.slot_value > 0 ? (
                      <span className="font-mono text-sm font-bold text-accent">
                        {prizeFormat.format(tournament.slot_value * totalSlots * share)}
                      </span>
                    ) : null}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : tournament.status === "draft" ? (
        <p className="text-sm text-foreground-soft">
          Non si parte ancora: l&apos;organizzatore apre la giornata 1 a
          breve. Scaldati.
        </p>
      ) : null}

      {/* Premio: il dato più importante insieme agli slot ancora da
          schierare, per questo in cima. Nascosto se l'organizzatore non ha
          impostato un valore per slot (torneo "gratuito"). La percentuale è
          la quota di questo giocatore sugli slot ANCORA VIVI in tutto il
          torneo (non sul totale slot venduti, morti compresi): se TUTTI gli
          slot ancora vivi (di ogni giocatore) uscissero insieme sulla stessa
          giornata, lo spareggio ex aequo li farebbe vincere tutti, e questa
          percentuale è la fetta di premio che spetterebbe a lui in quel
          caso. Nascosta anche a torneo concluso: la quota finale, già
          decisa, è mostrata nella card "Game over" sopra — ripeterla qui
          come "quota attuale" sarebbe ridondante e, nello spareggio ex
          aequo, pure fuorviante (gli slot dei vincitori risultano
          "eliminated", quindi aliveSlots sarebbe 0). */}
      {tournament.status !== "finished" && tournament.slot_value > 0 && totalSlots > 0 && aliveSlots > 0 ? (
        <section className={`${card} border-accent/30`}>
          <p className={eyebrow}>Premio</p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <p className="font-display text-5xl font-extrabold leading-none text-foreground">
              {prizeFormatWhole.format(tournament.slot_value * totalSlots)}
            </p>
            <span className="text-right">
              <span className="block font-mono text-xl font-bold text-accent">
                {((myAliveSlots / aliveSlots) * 100).toLocaleString("it-IT", {
                  maximumFractionDigits: 1,
                })}
                %
              </span>
              <span className="block font-mono text-base font-bold text-foreground">
                {prizeFormatWhole.format(
                  (myAliveSlots / aliveSlots) * tournament.slot_value * totalSlots
                )}
              </span>
            </span>
          </div>

          {/* Spiegazione della quota, a comparsa: non ovvio a colpo
              d'occhio perché è calcolata sugli slot ANCORA VIVI (non sul
              totale venduti) — vedi il commento sopra questa sezione. */}
          <details className="mt-1.5">
            <summary className="flex cursor-pointer list-none items-center justify-end gap-1 text-[10px] text-foreground-faint [&::-webkit-details-marker]:hidden">
              tua quota attuale
              <InfoIcon className="h-3 w-3 flex-none" />
            </summary>
            <p className="mt-2 rounded-lg border border-line bg-surface-2 p-2.5 text-[11px] leading-relaxed text-foreground-soft">
              Se in questa giornata restassero vivi zero slot (eliminati
              tutti insieme, spareggio ex aequo) o il campionato finisse
              ora, questa è la quota di montepremi che ti spetterebbe.
            </p>
          </details>

          <div className="mt-1.5 flex items-center justify-between text-[11px] text-foreground-faint">
            <span>
              {myAliveSlots}/{aliveSlots}
            </span>
            <span>prezzo slot = {prizeFormatWhole.format(tournament.slot_value)}</span>
          </div>
        </section>
      ) : null}

      {/* Riepilogo giornata: uno sguardo veloce ai TUOI slot — quale
          squadra hai schierato, quando gioca e com'è andata — prima della
          lista completa di tutte le partite qui sotto. Compare appena le
          scelte si chiudono (da lì in poi non si cambia più idea: serve
          solo sapere chi hai schierato e quando gioca, e il calendario
          completo sotto non lo dice a colpo d'occhio) oppure appena
          arriva il primo risultato, se le scelte sono ancora aperte. */}
      {openMatchday &&
      recapSlots.length > 0 &&
      (!pickingOpen || openFixtures.some((f) => f.result !== null)) ? (
        <MatchdayRecap matchdayNumber={openMatchday.number} slots={recapSlots} />
      ) : null}

      {/* Scelta squadra: un'unica lista di partite per tutta la giornata,
          non una copia per ogni slot — si assegnano più slot alla stessa
          squadra cliccandola più volte (vedi team-picker.tsx). Il
          calendario resta visibile anche a scelte chiuse (readOnly): è
          proprio nel weekend, mentre non si può più cambiare idea, che
          serve sapere quando giocano le squadre scelte. */}
      {openMatchday && myAliveSlotsList.length > 0 ? (
        <TeamPicker
          tournamentId={tournament.id}
          matchdayId={openMatchday.id}
          matchdayNumber={openMatchday.number}
          slots={pickerSlots}
          dayGroups={pickerDayGroups}
          otherTeams={otherTeams}
          excludedTeamNames={Array.from(excludedTeamNames)}
          teams={teamOptions}
          readOnly={!pickingOpen}
          deadline={pickDeadline?.toISOString() ?? null}
          outcomeCounts={outcomeCounts}
        />
      ) : tournament.status === "active" && myAliveSlotsList.length > 0 ? (
        <p className="text-sm text-foreground-faint">
          Nessuna giornata aperta. Per ora riposa.
        </p>
      ) : null}
    </div>
  );
}
