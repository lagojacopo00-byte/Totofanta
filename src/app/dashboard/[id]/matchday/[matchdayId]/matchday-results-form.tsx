"use client";

import { useState } from "react";
import { TeamLabel } from "@/components/team-badge";
import { button, card } from "@/components/ui";
import type { MatchDayGroup } from "@/lib/match-window";
import { submitResultsAction } from "./actions";

const dayGroupLabel: Record<MatchDayGroup, string> = {
  venerdì: "Venerdì",
  sabato: "Sabato",
  domenica: "Domenica",
  lunedì: "Lunedì",
  altro: "Data da confermare",
};

type MatchResult = "home_win" | "draw" | "away_win";
type TeamOutcome = "win" | "draw" | "loss";

export interface ResultFixture {
  id: string;
  homeTeamId: string | null;
  homeTeamName: string;
  awayTeamId: string | null;
  awayTeamName: string;
  homePickers: string[];
  awayPickers: string[];
  defaultResult: MatchResult | null;
  isExcluded: boolean;
}

export interface ResultDayGroup {
  group: MatchDayGroup;
  fixtures: ResultFixture[];
}

export interface OtherResultTeam {
  id: string;
  name: string;
  pickers: string[];
}

interface MatchdayResultsFormProps {
  tournamentId: string;
  matchdayId: string;
  dayGroups: ResultDayGroup[];
  otherTeams: OtherResultTeam[];
}

/** Traduce la scelta 1/X/2 di una partita nell'esito di ciascuna delle due
 * squadre coinvolte — non si può più, come nella vecchia UI squadra per
 * squadra, marcare per sbaglio sia casa che trasferta come "vinta". */
function outcomeFor(result: MatchResult | undefined, side: "home" | "away"): TeamOutcome | "" {
  if (!result) return "";
  if (result === "draw") return "draw";
  if (side === "home") return result === "home_win" ? "win" : "loss";
  return result === "away_win" ? "win" : "loss";
}

/** Inserimento risultati di una giornata, partita per partita (non più
 * squadra per squadra, dove si potevano creare combinazioni incoerenti
 * come entrambe le squadre di una stessa partita "vinta"): stessa
 * struttura visiva del picker dei giocatori — una card per partita, home
 * vs away — con un selettore 1/X/2 al posto dei pulsanti di scelta
 * squadra. Precompilato con l'esito già noto da "Anticipa risultati" (
 * /dashboard/fixtures) o dalla sincronizzazione automatica, se già
 * presente. Le squadre senza una partita in calendario questa giornata
 * (competizioni personalizzate) restano con un selettore vinta/pareggio/
 * persa a parte, non essendoci un "avversario" da abbinare. */
export function MatchdayResultsForm({
  tournamentId,
  matchdayId,
  dayGroups,
  otherTeams,
}: MatchdayResultsFormProps) {
  const [matchChoices, setMatchChoices] = useState<Record<string, MatchResult>>(() => {
    const initial: Record<string, MatchResult> = {};
    for (const { fixtures } of dayGroups) {
      for (const f of fixtures) {
        if (f.defaultResult) initial[f.id] = f.defaultResult;
      }
    }
    return initial;
  });
  const [otherChoices, setOtherChoices] = useState<Record<string, TeamOutcome>>({});

  const requiredFixtures = dayGroups.flatMap((g) => g.fixtures).filter((f) => !f.isExcluded);
  const allFixturesChosen = requiredFixtures.every((f) => matchChoices[f.id]);
  const allOtherChosen = otherTeams.every((t) => otherChoices[t.id]);
  const hasAnything = requiredFixtures.length > 0 || otherTeams.length > 0;
  const canSubmit = hasAnything && allFixturesChosen && allOtherChosen;

  return (
    <form
      action={submitResultsAction.bind(null, tournamentId, matchdayId)}
      className="flex flex-col gap-3"
    >
      {dayGroups.map(({ group, fixtures }) => (
        <div key={group} className="flex flex-col gap-1.5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-foreground-faint">
            {dayGroupLabel[group]}
          </p>
          <div className="flex flex-col gap-2">
            {fixtures.map((f) => {
              const choice = matchChoices[f.id];
              return (
                <div key={f.id} className={`${card} flex flex-col gap-3`}>
                  {f.homeTeamId ? (
                    <input
                      type="hidden"
                      name={`outcome_${f.homeTeamId}`}
                      value={outcomeFor(choice, "home")}
                    />
                  ) : null}
                  {f.awayTeamId ? (
                    <input
                      type="hidden"
                      name={`outcome_${f.awayTeamId}`}
                      value={outcomeFor(choice, "away")}
                    />
                  ) : null}
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        <TeamLabel name={f.homeTeamName} size="sm" />
                      </p>
                      {f.homePickers.length > 0 ? (
                        <p className="mt-0.5 truncate text-[11px] text-foreground-faint">
                          {f.homePickers.join(", ")}
                        </p>
                      ) : null}
                    </div>
                    <span className="flex-none font-mono text-[10px] text-foreground-faint">
                      vs
                    </span>
                    <div className="min-w-0 flex-1 text-right">
                      <p className="truncate text-sm font-semibold">
                        <TeamLabel name={f.awayTeamName} size="sm" />
                      </p>
                      {f.awayPickers.length > 0 ? (
                        <p className="mt-0.5 truncate text-[11px] text-foreground-faint">
                          {f.awayPickers.join(", ")}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  {f.isExcluded ? (
                    <p className="text-xs text-foreground-faint">
                      Partita esclusa: chi l&apos;ha scelta resta in gara,
                      nessun risultato da inserire.
                    </p>
                  ) : (
                    <div className="flex justify-center gap-1 self-center rounded-full border border-line p-1">
                      {(["home_win", "draw", "away_win"] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setMatchChoices((prev) => ({ ...prev, [f.id]: r }))}
                          className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                            choice === r
                              ? "bg-accent text-accent-ink"
                              : "text-foreground-soft hover:text-accent"
                          }`}
                        >
                          {r === "home_win" ? "1" : r === "draw" ? "X" : "2"}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {otherTeams.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-foreground-faint">
            Altre squadre (senza una partita in calendario)
          </p>
          <div className="flex flex-col gap-2">
            {otherTeams.map((t) => {
              const choice = otherChoices[t.id];
              return (
                <div
                  key={t.id}
                  className={`${card} flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between`}
                >
                  <input type="hidden" name={`outcome_${t.id}`} value={choice ?? ""} />
                  <div>
                    <p className="text-sm font-semibold">
                      <TeamLabel name={t.name} size="sm" />
                    </p>
                    {t.pickers.length > 0 ? (
                      <p className="mt-0.5 text-[11px] text-foreground-faint">
                        {t.pickers.join(", ")}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex gap-1 rounded-full border border-line p-1">
                    {(["win", "draw", "loss"] as const).map((o) => (
                      <button
                        key={o}
                        type="button"
                        onClick={() => setOtherChoices((prev) => ({ ...prev, [t.id]: o }))}
                        className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                          choice === o
                            ? "bg-accent text-accent-ink"
                            : "text-foreground-soft hover:text-accent"
                        }`}
                      >
                        {o === "win" ? "Vinta" : o === "draw" ? "Pareggiata" : "Persa"}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <button className={`${button} mt-2`} type="submit" disabled={!canSubmit}>
        Applica i risultati e via alla prossima giornata
      </button>
      {!canSubmit ? (
        <p className="text-center text-xs text-foreground-faint">
          Seleziona l&apos;esito di ogni partita per continuare.
        </p>
      ) : null}
    </form>
  );
}
