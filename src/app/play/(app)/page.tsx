import Link from "next/link";
import { requirePlayer } from "@/lib/supabase/require-player";
import * as queries from "@/lib/queries";
import { buttonGhost, card, eyebrow, pillAlive, pillOut } from "@/components/ui";
import { PickCountdown } from "@/components/pick-countdown";
import { MatchdayReopenCountdown } from "@/components/matchday-reopen-countdown";
import {
  computeNextRoundReopenAt,
  computePickDeadline,
  isPickingWindowOpen,
} from "@/lib/pick-window";

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
      let pickingOpen = true;
      let pickedCount = 0;
      let reopenAtIso: string | null = null;

      if (openMatchday) {
        const [fixtures, excludedTeamNames] = await Promise.all([
          queries.getFixturesForRound(supabase, openMatchday.number),
          queries.getExcludedTeamNames(supabase, openMatchday.number),
        ]);
        const deadline = computePickDeadline(fixtures, excludedTeamNames);
        pickingOpen = isPickingWindowOpen(deadline);
        deadlineIso = deadline?.toISOString() ?? null;

        if (!pickingOpen && deadline) {
          reopenAtIso = computeNextRoundReopenAt(deadline).toISOString();
          const myAliveSlotIds = m.slots
            .filter((s) => s.status === "alive")
            .map((s) => s.id);
          const myPicks = await queries.getAllPicksForTournamentSlots(
            supabase,
            myAliveSlotIds
          );
          pickedCount = myPicks.filter((p) => p.matchday_id === openMatchday.id).length;
        }
      }

      return [
        tournament.id,
        {
          totalSlots: slotCounts.totalSlots,
          aliveSlots: slotCounts.aliveSlots,
          hasOpenMatchday: Boolean(openMatchday),
          pickingOpen,
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

            // Premio e quota attuale: quota = fetta di montepremi che
            // spetterebbe a questo giocatore se TUTTI gli slot vivi del
            // torneo uscissero insieme sulla stessa giornata (stesso
            // criterio usato nella pagina del torneo) — non sul totale
            // slot venduti, morti compresi.
            const showPrize =
              Boolean(extras) &&
              tournament.slot_value > 0 &&
              extras!.totalSlots > 0 &&
              extras!.aliveSlots > 0;
            const prizeShare = showPrize ? (myAlive / extras!.aliveSlots) * 100 : 0;
            const totalPrize = showPrize
              ? tournament.slot_value * extras!.totalSlots
              : 0;

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
                    <div className="flex flex-none flex-col items-end gap-1">
                      {showPrize ? (
                        <>
                          <span className="font-mono text-lg font-bold text-accent">
                            {prizeShare.toLocaleString("it-IT", {
                              maximumFractionDigits: 1,
                            })}
                            %
                          </span>
                          <span className="text-[11px] text-foreground-faint">
                            {myAlive}/{myTotal} slot vivi
                          </span>
                        </>
                      ) : (
                        <span
                          className={
                            tournament.status === "finished" ? pillOut : pillAlive
                          }
                        >
                          {myAlive}/{myTotal}
                        </span>
                      )}
                    </div>
                  </div>

                  {showPrize ? (
                    <div className="flex items-center justify-between rounded-lg border border-line bg-surface-2 px-3 py-2">
                      <span className="text-[11px] text-foreground-faint">
                        Premio totale
                      </span>
                      <span className="font-mono text-sm font-bold text-foreground">
                        {prizeFormat.format(totalPrize)}
                      </span>
                    </div>
                  ) : null}

                  {extras?.hasOpenMatchday ? (
                    extras.pickingOpen ? (
                      <PickCountdown deadline={extras.deadlineIso} />
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-accent">
                          <span aria-hidden>✓</span>
                          {extras.pickedCount} slot schierati
                        </span>
                        <MatchdayReopenCountdown targetIso={extras.reopenAtIso} />
                      </div>
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
