import Link from "next/link";
import { requireUser } from "@/lib/supabase/require-user";
import { getOrganizerTournaments } from "@/lib/queries";
import { button, card, eyebrow, pillAlive, pillOut } from "@/components/ui";

const statusLabel: Record<string, string> = {
  draft: "Non ancora iniziato",
  active: "In corso",
  finished: "Concluso",
};

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();
  const tournaments = await getOrganizerTournaments(supabase, user.id);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className={eyebrow}>I tuoi tornei</p>
          <h1 className="mt-1 font-display text-2xl font-extrabold">
            Dashboard
          </h1>
        </div>
        <Link href="/dashboard/new" className={button}>
          + Nuovo torneo
        </Link>
      </div>

      {tournaments.length === 0 ? (
        <div className={card}>
          <p className="text-sm text-foreground-soft">
            Nessun torneo ancora. Creane uno e chiama a raccolta gli amici.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {tournaments.map((t) => (
            <li key={t.id}>
              <Link
                href={`/dashboard/${t.id}`}
                className={`${card} flex items-center justify-between gap-4 transition-colors hover:border-accent`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-display text-lg font-bold">{t.name}</p>
                    {t.is_test ? (
                      <span className="inline-flex items-center rounded-full border border-line bg-surface-2 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-foreground-faint">
                        Test
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-foreground-faint">{t.competition}</p>
                </div>
                <span className={t.status === "finished" ? pillOut : pillAlive}>
                  {statusLabel[t.status]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
