import Link from "next/link";
import { requirePlayer } from "@/lib/supabase/require-player";
import { getPlayerMemberships } from "@/lib/queries";
import { card, eyebrow, pillAlive, pillOut } from "@/components/ui";
import { PickCountdown } from "@/components/pick-countdown";

const statusLabel: Record<string, string> = {
  draft: "Non ancora iniziato",
  active: "In corso",
  finished: "Concluso",
};

export default async function PlayHomePage() {
  const { supabase, user } = await requirePlayer();
  const memberships = await getPlayerMemberships(supabase, user.id);

  const displayName =
    typeof user.user_metadata?.display_name === "string" &&
    user.user_metadata.display_name.trim().length > 0
      ? user.user_metadata.display_name
      : (user.email ?? "").split("@")[0];

  const hasActiveTournament = memberships.some(
    (m) => m.tournaments.status === "active"
  );

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="min-w-0">
        <p className={eyebrow}>I tuoi tornei</p>
        <h1 className="mt-1 truncate font-display text-3xl font-extrabold">
          Ciao, {displayName}
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
            Non fai ancora parte di nessun torneo. Chiedi all&apos;amico
            che organizza di invitarti con questa email:{" "}
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
                      {alive}/{total} slot vivi
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
    </div>
  );
}
