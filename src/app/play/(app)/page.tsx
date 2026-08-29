import Link from "next/link";
import { requirePlayer } from "@/lib/supabase/require-player";
import { getPlayerMemberships } from "@/lib/queries";
import { card, eyebrow, pillAlive, pillOut } from "@/components/ui";

const statusLabel: Record<string, string> = {
  draft: "Non ancora iniziato",
  active: "In corso",
  finished: "Concluso",
};

export default async function PlayHomePage() {
  const { supabase, user } = await requirePlayer();
  const memberships = await getPlayerMemberships(supabase, user.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className={eyebrow}>I tuoi tornei</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold">
          Ciao!
        </h1>
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
          {memberships.map((m) => (
            <li key={m.id}>
              <Link
                href={`/play/${m.tournament_id}`}
                className={`${card} flex items-center justify-between gap-4 transition-colors hover:border-accent`}
              >
                <div>
                  <p className="font-display text-lg font-bold">
                    {m.tournaments.name}
                  </p>
                  <p className="text-xs text-foreground-faint">
                    {m.tournaments.competition} &middot; {m.num_slots} slot
                  </p>
                </div>
                <span
                  className={
                    m.tournaments.status === "finished" ? pillOut : pillAlive
                  }
                >
                  {statusLabel[m.tournaments.status]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
