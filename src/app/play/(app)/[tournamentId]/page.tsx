import { notFound } from "next/navigation";
import { requirePlayer } from "@/lib/supabase/require-player";
import * as queries from "@/lib/queries";
import { card, cardTight, eyebrow, pillAlive, pillOut } from "@/components/ui";
import { TeamBadge } from "@/components/team-badge";
import { PickCountdown } from "@/components/pick-countdown";
import { isPickingWindowOpen } from "@/lib/pick-window";
import { groupFixturesByDay } from "@/lib/match-window";
import { TeamPicker, type PickerDayGroup, type PickerSlot } from "./team-picker";
import { BackLink } from "@/components/back-link";

const prizeFormat = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
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

  let winnerNames: string[] = [];
  if (tournament.status === "finished" && tournament.winners.length > 0) {
    const allPlayers = await queries.getPlayersWithSlots(supabase, tournament.id);
    winnerNames = allPlayers
      .filter((p) => tournament.winners.includes(p.id))
      .map((p) => p.display_name);
  }
  const isWinner = tournament.winners.includes(player.id);
  const pickingOpen = isPickingWindowOpen();

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

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <BackLink href="/play" label="I tuoi tornei" />

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
          <p className={eyebrow}>Game over</p>
          <p className="mt-2 font-display text-lg font-bold">
            {isWinner
              ? winnerNames.length > 1
                ? "Ex aequo: avete vinto insieme!"
                : "Hai vinto tu. Sei l'ultimo rimasto in piedi."
              : winnerNames.length > 0
                ? `Ha vinto ${winnerNames.join(", ")}`
                : "Torneo chiuso. Si ricomincia alla prossima."}
          </p>
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
          caso. */}
      {tournament.slot_value > 0 && totalSlots > 0 && aliveSlots > 0 ? (
        <section className={`${card} border-accent/30`}>
          <p className={eyebrow}>Premio</p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <p className="font-display text-3xl font-extrabold leading-none text-foreground">
              {prizeFormat.format(tournament.slot_value * totalSlots)}
            </p>
            <span className="text-right">
              <span className="block font-mono text-lg font-bold text-accent">
                {((myAliveSlots / aliveSlots) * 100).toLocaleString("it-IT", {
                  maximumFractionDigits: 1,
                })}
                %
              </span>
              <span className="block text-[10px] text-foreground-faint">
                tua quota attuale
              </span>
            </span>
          </div>
          <p className="mt-1.5 text-xs text-foreground-faint">
            {myAliveSlots}/{aliveSlots} slot ancora vivi nel torneo sono
            tuoi ({prizeFormat.format(tournament.slot_value)} a slot).
          </p>
        </section>
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
