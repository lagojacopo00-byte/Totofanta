import Link from "next/link";
import { requirePlayer } from "@/lib/supabase/require-player";
import * as queries from "@/lib/queries";
import { buttonGhost, card, eyebrow, pillAlive, pillOut } from "@/components/ui";
import { PickCountdown } from "@/components/pick-countdown";
import { MatchdayReopenCountdown } from "@/components/matchday-reopen-countdown";
import { computeNextRoundReopenAt, computePickDeadline } from "@/lib/pick-window";

const statusLabel: Record<string, string> = {
  draft: "Non ancora iniziato",
  active: "In corso",
  finished: "Concluso",
};

const prizeFormat = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

export default async function PlayHomePage() {
  const { supabase, user } = await requirePlayer();
  const [memberships, profileDisplayName] = await Promise.all([
    queries.getPlayerMemberships(supabase, user.id),
    queries.getProfileDisplayName(supabase, user.id),
  ]);

  // Il nome scelto in Profilo vince su tutto; senza, ripiega su quello
  // dato in fase di registrazione, poi sulla parte locale dell'email.
  const displayName =
    profileDisplayName ??
    (typeof user.user_metadata?.display_name === "string" &&
    user.user_metadata.display_name.trim().length > 0
      ? user.user_metadata.display_name
      : (user.email ?? "").split("@")[0]);

  // Premio, quota attuale e stato dello schieramento hanno senso solo per
  // i tornei attivi (montepremi ancora in gioco, giornate da schierare):
  // per quelli in bozza o conclusi la card resta come prima (solo il
  // pallino alive/totale). Un giro di query extra per torneo va bene qui:
  // uso personale tra amici, poche righe (vedi CLAUDE.md).
  const activeMemberships = memberships.filter((m) => m.tournaments.status === "active");
  const extrasEntries = await Promise.all(
    activeMemberships.map(async (m) => {
      const tournament = m.tournaments;
      const [matchdays, slotCounts] = await Promise.all([
        queries.getMatchdays(supabase, tournament.id),
        queries.getTournamentSlotCounts(supabase, tournament.id),
      ]);
      const openMatchday = matchdays.find((md) => md.status === "open");

      let deadlineIso: string | null = null;
      let pickedCount = 0;
      let reopenAtIso: string | null = null;

      if (openMatchday) {
        const myAliveSlotIds = m.slots
          .filter((s) => s.status === "alive")
          .map((s) => s.id);
        const [fixtures, excludedTeamNames, myPicks] = await Promise.all([
          queries.getFixturesForRound(supabase, openMatchday.number),
          queries.getExcludedTeamNames(supabase, openMatchday.number),
          queries.getAllPicksForTournamentSlots(supabase, myAliveSlotIds),
        ]);
        const deadline = computePickDeadline(fixtures, excludedTeamNames);
        deadlineIso = deadline?.toISOString() ?? null;
        reopenAtIso = deadline ? computeNextRoundReopenAt(deadline).toISOString() : null;
        pickedCount = myPicks.filter((p) => p.matchday_id === openMatchday.id).length;
      }

      return [
        tournament.id,
        {
          totalSlots: slotCounts.totalSlots,
          aliveSlots: slotCounts.aliveSlots,
          hasOpenMatchday: Boolean(openMatchday),
          deadlineIso,
          reopenAtIso,
          pickedCount,
        },
      ] as const;
    })
  );
  const extrasByTournamentId = new Map(extrasEntries);

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="min-w-0">
        <p className={eyebrow}>I tuoi tornei</p>
        <h1 className="mt-1 truncate font-display text-3xl font-extrabold">
          Ehi, {displayName}
        </h1>
      </div>

      {memberships.length === 0 ? (
        <div className={card}>
          <p className="text-sm text-foreground-soft">
            Ancora nessun torneo all&apos;attivo. Fatti invitare da chi
            organizza, con questa email:{" "}
            <strong className="text-foreground">{user.email}</strong>
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {memberships.map((m) => {
            const myAlive = m.slots.filter((s) => s.status === "alive").length;
            const myTotal = m.slots.length;
            const tournament = m.tournaments;
            const extras = extrasByTournamentId.get(tournament.id);

            const showPrize =
              Boolean(extras) &&
              tournament.slot_value > 0 &&
              extras!.totalSlots > 0 &&
              extras!.aliveSlots > 0;
            const totalPrize = showPrize
              ? tournament.slot_value * extras!.totalSlots
              : 0;

            // Ho già schierato tutti i miei slot vivi per la giornata
            // aperta? Non dipende dalla scadenza (che riguarda la finestra
            // per TUTTI): se ho finito il mio, non ha senso mostrarmi
            // ancora un conto alla rovescia per schierare — vedo invece la
            // conferma e il conto alla rovescia verso la prossima giornata.
            const doneScheduling =
              Boolean(extras?.hasOpenMatchday) &&
              myAlive > 0 &&
              (extras?.pickedCount ?? 0) >= myAlive;

            return (
              <li key={m.id}>
                <Link
                  href={`/play/${m.tournament_id}`}
                  className={`${card} flex min-w-0 flex-col gap-3 transition-colors hover:border-accent`}
                >
                  <div className="flex min-w-0 items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-display text-lg font-bold">
                        {tournament.name}
                      </p>
                      <p className="truncate text-xs text-foreground-faint">
                        {tournament.competition}
                      </p>
                    </div>
                    <span
                      className={`flex-none ${tournament.status === "finished" ? pillOut : pillAlive}`}
                    >
                      {myAlive}/{myTotal}
                    </span>
                  </div>

                  {showPrize ? (
                    <div className="rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-center">
                      <p className="text-[11px] text-foreground-faint">Premio totale</p>
                      <p className="mt-0.5 font-display text-3xl font-extrabold leading-none text-accent">
                        {prizeFormat.format(totalPrize)}
                      </p>
                    </div>
                  ) : null}

                  {extras?.hasOpenMatchday && myAlive > 0 ? (
                    doneScheduling ? (
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-accent">
                          <span aria-hidden>✓</span>
                          {extras.pickedCount} slot schierati
                        </span>
                        <MatchdayReopenCountdown targetIso={extras.reopenAtIso} />
                      </div>
                    ) : (
                      <PickCountdown deadline={extras.deadlineIso} />
                    )
                  ) : null}

                  <p className="self-end text-[11px] text-foreground-faint">
                    {statusLabel[tournament.status]}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {/* Chi gioca può anche organizzare: stesso account, nessun login a
          parte. Va alla dashboard organizzatore, dove si diventa "admin di
          lega" per quel torneo creandolo. */}
      <Link href="/dashboard/new" className={`${buttonGhost} self-start`}>
        + Nuovo torneo
      </Link>
    </div>
  );
}
