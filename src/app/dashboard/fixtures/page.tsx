import { requireUser } from "@/lib/supabase/require-user";
import * as queries from "@/lib/queries";
import { button, buttonGhost, card, cardTight, eyebrow, input, label } from "@/components/ui";
import { TeamBadge } from "@/components/team-badge";
import { addFixtureAction, deleteFixtureAction } from "./actions";

export default async function FixturesPage() {
  const { supabase } = await requireUser();

  const [fixtures, teams] = await Promise.all([
    queries.getAllFixtures(supabase),
    queries.getReferenceTeams(supabase, "Serie A"),
  ]);

  const byRound = new Map<number, typeof fixtures>();
  for (const f of fixtures) {
    byRound.set(f.round, [...(byRound.get(f.round) ?? []), f]);
  }
  const rounds = [...byRound.keys()].sort((a, b) => a - b);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className={eyebrow}>Calendario Serie A</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold">
          Accoppiamenti per giornata
        </h1>
        <p className="mt-2 max-w-lg text-sm text-foreground-soft">
          La giornata N di un torneo corrisponde alla giornata N del vero
          campionato: qui puoi tenere aggiornato chi gioca contro chi, così
          i tuoi giocatori lo vedono quando scelgono la squadra. Le
          giornate 1–25 sono già precompilate (fonte: ricerca web, quindi
          ricontrolla soprattutto le giornate più lontane e correggi se una
          partita è stata spostata dalle tv); le altre le aggiungi tu.
        </p>
      </div>

      <form
        action={addFixtureAction}
        className={`${card} flex flex-col gap-3 sm:flex-row sm:items-end`}
      >
        <div className="flex flex-col gap-1.5">
          <label className={label} htmlFor="round">
            Giornata
          </label>
          <input
            className={`${input} sm:w-24`}
            id="round"
            name="round"
            type="number"
            min={1}
            max={38}
            required
          />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <label className={label} htmlFor="home_team">
            Squadra in casa
          </label>
          <input
            className={input}
            id="home_team"
            name="home_team"
            list="serie-a-teams"
            required
            placeholder="Es. Napoli"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <label className={label} htmlFor="away_team">
            Squadra in trasferta
          </label>
          <input
            className={input}
            id="away_team"
            name="away_team"
            list="serie-a-teams"
            required
            placeholder="Es. Milan"
          />
        </div>
        <datalist id="serie-a-teams">
          {teams.map((t) => (
            <option key={t.id} value={t.name} />
          ))}
        </datalist>
        <button className={button} type="submit">
          Salva
        </button>
      </form>

      {rounds.length === 0 ? (
        <div className={card}>
          <p className="text-sm text-foreground-soft">
            Nessun accoppiamento salvato ancora.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {rounds.map((round) => (
            <section key={round} className={cardTight}>
              <p className="font-display font-bold">Giornata {round}</p>
              <ul className="mt-2 flex flex-col gap-1.5">
                {(byRound.get(round) ?? []).map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="flex flex-wrap items-center gap-1.5">
                      <TeamBadge name={f.home_team} size="xs" />
                      <span>{f.home_team}</span>
                      <span className="text-foreground-faint">–</span>
                      <TeamBadge name={f.away_team} size="xs" />
                      <span>{f.away_team}</span>
                    </span>
                    <form action={deleteFixtureAction.bind(null, f.id)}>
                      <button
                        className={`${buttonGhost} px-2 py-1 text-xs border-lose/40 text-lose hover:border-lose hover:text-lose`}
                        type="submit"
                      >
                        Elimina
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
