import { notFound } from "next/navigation";
import { requirePlayer } from "@/lib/supabase/require-player";
import * as queries from "@/lib/queries";
import { card, cardTight, eyebrow, pillAlive, pillOut } from "@/components/ui";
import { TeamBadge } from "@/components/team-badge";
import { TrophyIcon } from "@/components/rule-icons";
import { PlayerSlotHistoryTable } from "@/components/player-slot-history-table";
import { computePickDeadline, isPickingWindowOpen } from "@/lib/pick-window";
import { groupFixturesByDay } from "@/lib/match-window";
import { computeFinalPrizeShares, computeTeamOutcomes } from "@/lib/game-logic";
import { TeamPicker, type PickerDayGroup, type PickerSlot } from "./team-picker";
import { MatchdayRecap, type RecapSlot } from "./matchday-recap";
import { OtherPlayersHistory } from "./other-players-history";
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

  const [matchdays, allPicks, availableTeams, standings, matchdayBackupUrl, slotHistory] =
    await Promise.all([
      queries.getMatchdays(supabase, tournament.id),
      queries.getAllPicksForTournamentSlots(supabase, slots.map((s) => s.id)),
      queries.getAvailableTeams(supabase, tournament.id, tournament.competition),
      queries.getTournamentStandings(supabase, tournament.id),
      tournament.auto_backup_matchdays
        ? queries.getMatchdayBackupUrl(supabase, tournament.id)
        : Promise.resolve(null),
      queries.getTournamentSlotHistory(supabase, tournament.id),
    ]);

  const openMatchday = matchdays.find((m) => m.status === "open");
  const myHistory = slotHistory.players.find((p) => p.playerId === player.id);
  const otherHistories = slotHistory.players.filter((p) => p.playerId !== player.id);

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
  const prizeShareByPlayer = new Map(prizeBreakdown.map((s) => [s.playerId, s.share]));

  // Classifica ordinata per slot vivi (decrescente) mentre il torneo è
  // ancora attivo; a torneo concluso ordinata invece per quota di
  // montepremi (decrescente) — coi soli slot vivi, in uno spareggio ex
  // aequo "zero superstiti" anche i vincitori risultano a 0 (i loro slot
  // sono `eliminated`, vedi computeFinalPrizeShares), che appiattirebbe
  // tutti alla stessa posizione proprio quando la classifica finale conta
  // di più. Pari merito quando la chiave di ordinamento coincide.
  const rankedStandings = standings
    .map((s) => ({
      ...s,
      alive: s.slots.filter((sl) => sl.status === "alive").length,
      prizeShare: prizeShareByPlayer.get(s.id) ?? 0,
    }))
    .sort((a, b) =>
      tournament.status === "finished" ? b.prizeShare - a.prizeShare : b.alive - a.alive
    );
  const withRank = rankedStandings.reduce<
    ((typeof rankedStandings)[number] & { rank: number })[]
  >((acc, s, idx) => {
    const previous = acc[idx - 1];
    const tieKey = tournament.status === "finished" ? s.prizeShare : s.alive;
    const previousTieKey = previous
      ? tournament.status === "finished"
        ? previous.prizeShare
        : previous.alive
      : undefined;
    const rank = previous && previousTieKey === tieKey ? previous.rank : idx + 1;
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
  // slot), per il piccolo "album" delle squadre bruciate finora — con,
  // per ciascuna, su quanti dei suoi slot ANCORA VIVI non è più
  // disponibile: è l'informazione che serve davvero mentre si sceglie,
  // non solo "l'hai già giocata da qualche parte".
  const playedTeams = Array.from(new Set(allPicks.map((p) => p.team_id)))
    .map((id) => ({ id, name: teamById.get(id) }))
    .filter((t): t is { id: string; name: string } => Boolean(t.name))
    .sort((a, b) => a.name.localeCompare(b.name));

  const myAliveSlotsList = slots.filter((s) => s.status === "alive");

  const teamAliveBurnCount = new Map<string, number>();
  for (const slot of myAliveSlotsList) {
    const usedTeamIds = new Set(
      allPicks
        .filter(
          (p) =>
            p.slot_id === slot.id &&
            (!openMatchday || p.matchday_id !== openMatchday.id)
        )
        .map((p) => p.team_id)
    );
    for (const teamId of usedTeamIds) {
      teamAliveBurnCount.set(teamId, (teamAliveBurnCount.get(teamId) ?? 0) + 1);
    }
  }

  // Solo le squadre che bloccano ancora almeno uno slot vivo: quelle
  // giocate solo su slot ormai eliminati non contano più per le scelte
  // future, mostrarle sarebbe solo rumore.
  const burnedTeams = playedTeams.filter(
    (t) => (teamAliveBurnCount.get(t.id) ?? 0) > 0
  );

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
            result: fixture.result,
            status,
          };
        })
        .filter((s): s is RecapSlot => s !== null)
    : [];

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

      {/* Riepilogo giornata: uno sguardo veloce a come sono andati i TUOI
          slot, prima della lista completa di tutte le partite qui sotto —
          compare solo quando c'è almeno un risultato disponibile (non ha
          senso mostrare una lista di soli slot "In corso"). */}
      {openMatchday &&
      recapSlots.length > 0 &&
      openFixtures.some((f) => f.result !== null) ? (
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
        />
      ) : tournament.status === "active" && myAliveSlotsList.length > 0 ? (
        <p className="text-sm text-foreground-faint">
          Nessuna giornata aperta. Per ora riposa.
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

      {/* Storico: direttamente in pagina, niente click per aprirlo (richiesto
          dall'utente il 2026-09-04 — prima era una pagina a parte). Il
          proprio storico è sempre visibile; quello degli altri giocatori è
          un elenco apribile/chiudibile, uno alla volta, sotto. Solo se
          almeno una giornata è già chiusa: prima non c'è niente da vedere. */}
      {slotHistory.matchdayNumbers.length > 0 && myHistory && myHistory.slots.length > 0 ? (
        <section className="flex flex-col gap-3">
          <p className={eyebrow}>Storico</p>
          <div>
            <p className="mb-2 font-display text-sm font-bold text-foreground">
              {player.display_name} (tu)
            </p>
            <PlayerSlotHistoryTable
              matchdayNumbers={slotHistory.matchdayNumbers}
              slots={myHistory.slots}
            />
          </div>
          {otherHistories.length > 0 ? (
            <OtherPlayersHistory
              matchdayNumbers={slotHistory.matchdayNumbers}
              players={otherHistories}
            />
          ) : null}
        </section>
      ) : null}

      {burnedTeams.length > 0 ? (
        <section className={cardTight}>
          <details>
            <summary className="flex cursor-pointer list-none items-center gap-1.5 [&::-webkit-details-marker]:hidden">
              <p className={eyebrow}>Le squadre già bruciate</p>
              <InfoIcon className="h-3.5 w-3.5 flex-none text-foreground-faint" />
            </summary>
            <p className="mt-2 rounded-lg border border-line bg-surface-2 p-2.5 text-[11px] leading-relaxed text-foreground-soft">
              Il numero sotto ogni squadra dice su quanti dei tuoi slot
              ancora vivi non puoi più schierarla: l&apos;hai già usata lì in
              una giornata precedente.
            </p>
          </details>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {burnedTeams.map((t) => {
              const burned = teamAliveBurnCount.get(t.id) ?? 0;
              return (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 py-1 pl-1 pr-2.5"
                >
                  <TeamBadge name={t.name} size="sm" />
                  <span className="text-[11px] text-foreground-faint">
                    {t.name}
                    {" · "}
                    <span className="font-mono text-foreground">
                      {burned}/{myAliveSlotsList.length}
                    </span>{" "}
                    slot vivi
                  </span>
                </span>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* La tua posizione: spostata più in basso di proposito — mentre si
          gioca conta di più quanti slot restano da assegnare (vedi il
          picker sopra), la posizione in classifica è un'informazione di
          contorno. */}
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
                ? "Comandi tu la classifica."
                : "Continua a spingere: la vetta è lì."}
          </p>
        ) : null}
      </section>

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
                    <span className="min-w-0">
                      <span
                        className={
                          isMe
                            ? "block truncate font-display font-bold text-foreground"
                            : "block truncate text-foreground-soft"
                        }
                      >
                        {s.display_name}
                        {isMe ? " (tu)" : ""}
                      </span>
                      {/* Nome e cognome, se impostati: utili quando
                          qualcuno sceglie un nome pubblico che non fa
                          capire subito chi è. */}
                      {s.full_name ? (
                        <span className="block truncate text-[11px] text-foreground-faint">
                          {s.full_name}
                        </span>
                      ) : null}
                    </span>
                  </span>
                  {tournament.status === "finished" ? (
                    tournament.winners.includes(s.id) ? (
                      <span className={pillAlive}>
                        {(s.prizeShare * 100).toLocaleString("it-IT", {
                          maximumFractionDigits: 1,
                        })}
                        %
                        {tournament.slot_value > 0
                          ? ` · ${prizeFormat.format(tournament.slot_value * totalSlots * s.prizeShare)}`
                          : ""}
                      </span>
                    ) : (
                      <span className={pillOut}>eliminato</span>
                    )
                  ) : (
                    <span className={s.alive > 0 ? pillAlive : pillOut}>
                      {s.alive}/{s.slots.length} vivi
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {matchdayBackupUrl ? (
        <p className="text-center text-xs text-foreground-faint">
          <a href={matchdayBackupUrl} className="underline hover:text-accent" download>
            Scarica Excel del torneo
          </a>
        </p>
      ) : null}
    </div>
  );
}
