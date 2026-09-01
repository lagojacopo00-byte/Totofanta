import { requireUser } from "@/lib/supabase/require-user";
import * as queries from "@/lib/queries";
import { button, buttonGhost, card, cardTight, eyebrow, input, label } from "@/components/ui";
import { TeamBadge } from "@/components/team-badge";
import { BackLink } from "@/components/back-link";
import type { Fixture, FixtureResult } from "@/lib/types";
import { FixtureResultButtons } from "./result-buttons";
import {
  addFixtureAction,
  deleteFixtureAction,
  setFixtureKickoffAction,
  toggleFixtureStatusAction,
} from "./actions";

const dayLabel = new Intl.DateTimeFormat("it-IT", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const resultLabel: Record<FixtureResult, (f: Fixture) => string> = {
  home_win: (f) => `Vittoria ${f.home_team}`,
  draw: () => "Pareggio",
  away_win: (f) => `Vittoria ${f.away_team}`,
};

/** Formato accettato da <input type="datetime-local">: ora locale senza
 * fuso, senza i secondi. */
function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function FixturesPage() {
  const { supabase, user } = await requireUser();

  const [fixtures, teams, role] = await Promise.all([
    queries.getAllFixtures(supabase),
    queries.getReferenceTeams(supabase, "Serie A"),
    queries.getProfileRole(supabase, user.id),
  ]);
  const isCreator = role === "creator";

  const byRound = new Map<number, typeof fixtures>();
  for (const f of fixtures) {
    byRound.set(f.round, [...(byRound.get(f.round) ?? []), f]);
  }
  const rounds = [...byRound.keys()].sort((a, b) => a - b);

  return (
    <div className="flex flex-col gap-8">
      <BackLink href="/dashboard" label="I tuoi tornei" />
      <div>
        <p className={eyebrow}>Calendario Serie A</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold">
          Accoppiamenti per giornata
        </h1>
        <p className="mt-2 max-w-lg text-sm text-foreground-soft">
          La giornata N di un torneo corrisponde alla giornata N del
          campionato vero: qui tieni aggiornato chi gioca contro chi, così
          i tuoi giocatori lo vedono al momento della scelta. Le giornate
          1–25 sono già precompilate (fonte: ricerca web — ricontrolla
          soprattutto quelle più lontane e correggi se una partita è stata
          spostata dalle tv); le altre le aggiungi tu.
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
        <div className="flex flex-col gap-1.5">
          <label className={label} htmlFor="kickoff_at">
            Data/ora (opzionale)
          </label>
          <input
            className={`${input} sm:w-56`}
            id="kickoff_at"
            name="kickoff_at"
            type="datetime-local"
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
              <ul className="mt-2 flex flex-col gap-2">
                {(byRound.get(round) ?? []).map((f) => {
                  const isExcluded = f.status === "excluded";
                  return (
                    <li
                      key={f.id}
                      className={`flex flex-col gap-2 rounded-lg border border-line px-2.5 py-2 sm:flex-row sm:items-center sm:justify-between ${isExcluded ? "opacity-60" : ""}`}
                    >
                      <div className="flex flex-col gap-1">
                        <span className="flex flex-wrap items-center gap-1.5 text-sm">
                          <TeamBadge name={f.home_team} size="xs" />
                          <span>{f.home_team}</span>
                          <span className="text-foreground-faint">–</span>
                          <TeamBadge name={f.away_team} size="xs" />
                          <span>{f.away_team}</span>
                          {isExcluded ? (
                            <span className="inline-flex items-center rounded-full border border-lose/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-lose">
                              Esclusa
                            </span>
                          ) : null}
                          {f.result ? (
                            <span className="inline-flex items-center rounded-full border border-accent/40 bg-win-bg px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-accent">
                              {resultLabel[f.result](f)}
                            </span>
                          ) : null}
                        </span>
                        {f.kickoff_at ? (
                          <span className="text-xs text-foreground-faint">
                            {dayLabel.format(new Date(f.kickoff_at))}
                          </span>
                        ) : (
                          <span className="text-xs text-foreground-faint">
                            Data/ora non ancora inserita
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {isCreator ? <FixtureResultButtons fixture={f} /> : null}
                        <form
                          action={setFixtureKickoffAction.bind(null, f.id)}
                          className="flex items-center gap-1.5"
                        >
                          <input
                            className={`${input} w-auto py-1 text-xs`}
                            type="datetime-local"
                            name="kickoff_at"
                            defaultValue={toDatetimeLocalValue(f.kickoff_at)}
                          />
                          <button
                            className={`${buttonGhost} px-2 py-1 text-xs`}
                            type="submit"
                          >
                            Salva ora
                          </button>
                        </form>
                        <form
                          action={toggleFixtureStatusAction.bind(null, f.id, f.status)}
                        >
                          <button
                            className={`${buttonGhost} px-2 py-1 text-xs`}
                            type="submit"
                            title="Una partita esclusa non conta ai fini del gioco per questa giornata"
                          >
                            {isExcluded ? "Includi di nuovo" : "Escludi"}
                          </button>
                        </form>
                        <form action={deleteFixtureAction.bind(null, f.id)}>
                          <button
                            className={`${buttonGhost} px-2 py-1 text-xs border-lose/40 text-lose hover:border-lose hover:text-lose`}
                            type="submit"
                          >
                            Elimina
                          </button>
                        </form>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
