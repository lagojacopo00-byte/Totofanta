"use client";

import type { Fixture, FixtureResult } from "@/lib/types";
import { setFixtureResultAction } from "./actions";

const resultLongLabel: Record<FixtureResult, (f: Fixture) => string> = {
  home_win: (f) => `${f.home_team} vince`,
  draw: () => "Pareggio",
  away_win: (f) => `${f.away_team} vince`,
};

const resultShort: Record<FixtureResult, string> = {
  home_win: "1",
  draw: "X",
  away_win: "2",
};

/** I tre pulsanti 1/X/2 (+ una x per cancellare) per l'esito reale di una
 * partita — solo il creator li vede (controllato anche lato server in
 * setFixtureResultAction). Chiede conferma prima di salvare: può
 * chiudere la giornata, ed eliminare slot, su più tornei insieme non
 * appena questa è l'ultima partita mancante della giornata. */
export function FixtureResultButtons({ fixture }: { fixture: Fixture }) {
  return (
    <div
      className="flex items-center gap-1"
      title="Esito reale: chiude subito la giornata su ogni torneo Serie A che ce l'ha aperta, appena tutte le partite di questa giornata hanno un esito"
    >
      {(["home_win", "draw", "away_win"] as const).map((r) => (
        <form
          key={r}
          action={setFixtureResultAction.bind(null, fixture.id, fixture.round)}
          onSubmit={(e) => {
            if (
              fixture.result !== r &&
              !confirm(
                `Salvare "${resultLongLabel[r](fixture)}"? Se questa è l'ultima partita mancante della giornata, chiude subito la giornata su ogni torneo Serie A che ce l'ha aperta, eliminando chi ha scelto la squadra sbagliata. Non c'è un modo automatico per tornare indietro.`
              )
            ) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="result" value={r} />
          <button
            className={`flex h-7 w-7 items-center justify-center rounded-full border font-mono text-xs font-bold transition-colors ${
              fixture.result === r
                ? "border-accent bg-accent text-accent-ink"
                : "border-line text-foreground-soft hover:border-accent hover:text-accent"
            }`}
            type="submit"
          >
            {resultShort[r]}
          </button>
        </form>
      ))}
      {fixture.result ? (
        <form action={setFixtureResultAction.bind(null, fixture.id, fixture.round)}>
          <button
            className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-xs text-foreground-faint hover:border-lose hover:text-lose"
            type="submit"
            title="Cancella l'esito"
          >
            ×
          </button>
        </form>
      ) : null}
    </div>
  );
}
