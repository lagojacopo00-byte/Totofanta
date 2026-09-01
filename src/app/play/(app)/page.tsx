import Link from "next/link";
import { requirePlayer } from "@/lib/supabase/require-player";
import { getPlayerMemberships, getProfileDisplayName } from "@/lib/queries";
import { buttonGhost, card, eyebrow, pillAlive, pillOut } from "@/components/ui";
import { PickCountdown } from "@/components/pick-countdown";

const statusLabel: Record<string, string> = {
  draft: "Non ancora iniziato",
  active: "In corso",
  finished: "Concluso",
};

export default async function PlayHomePage() {
  const { supabase, user } = await requirePlayer();
  const [memberships, profileDisplayName] = await Promise.all([
    getPlayerMemberships(supabase, user.id),
    getProfileDisplayName(supabase, user.id),
  ]);

  // Il nome scelto in Profilo vince su tutto; senza, ripiega su quello
  // dato in fase di registrazione, poi sulla parte locale dell'email.
  const displayName =
    profileDisplayName ??
    (typeof user.user_metadata?.display_name === "string" &&
    user.user_metadata.display_name.trim().length > 0
      ? user.user_metadata.display_name
      : (user.email ?? "").split("@")[0]);

  const hasActiveTournament = memberships.some(
    (m) => m.tournaments.status === "active"
  );

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="min-w-0">
        <p className={eyebrow}>I tuoi tornei</p>
        <h1 className="mt-1 truncate font-display text-3xl font-extrabold">
          Ehi, {displayName}
        </h1>
        {hasActiveTournament ? (
          <div className="mt-1.5">
            <PickCountdown />
          </div>
        ) : null}
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
            const alive = m.slots.filter((s) => s.status === "alive").length;
            const total = m.slots.length;
            return (
              <li key={m.id}>
                <Link
                  href={`/play/${m.tournament_id}`}
                  className={`${card} flex min-w-0 items-center justify-between gap-4 transition-colors hover:border-accent`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg font-bold">
                      {m.tournaments.name}
                    </p>
                    <p className="truncate text-xs text-foreground-faint">
                      {m.tournaments.competition}
                    </p>
                  </div>
                  <div className="flex flex-none flex-col items-end gap-1.5">
                    <span
                      className={
                        m.tournaments.status === "finished" ? pillOut : pillAlive
                      }
                    >
                      {alive}/{total}
                    </span>
                    <span className="text-[11px] text-foreground-faint">
                      {statusLabel[m.tournaments.status]}
                    </span>
                  </div>
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
