"use client";

import { buttonGhost } from "@/components/ui";
import { undoLastMatchdayAction } from "./actions";

/** Annullare una giornata è (parzialmente) distruttivo: se nel frattempo
 * la giornata successiva era già stata aperta, cancella anche quella —
 * comprese le scelte che i giocatori potrebbero già averci fatto. Il
 * messaggio di conferma cambia in base al rischio reale (calcolato lato
 * server in page.tsx), non è generico come per la cancellazione torneo. */
export function UndoLastMatchdayButton({
  tournamentId,
  matchdayNumber,
  nextMatchdayNumber,
  picksAtRisk,
}: {
  tournamentId: string;
  matchdayNumber: number;
  nextMatchdayNumber: number | null;
  picksAtRisk: number;
}) {
  const risk =
    nextMatchdayNumber && picksAtRisk > 0
      ? ` Attenzione: la giornata ${nextMatchdayNumber}, già aperta, verrà cancellata insieme alle ${picksAtRisk} scelt${picksAtRisk === 1 ? "a" : "e"} che i giocatori ci hanno già fatto.`
      : nextMatchdayNumber
        ? ` La giornata ${nextMatchdayNumber}, già aperta ma ancora senza scelte, verrà cancellata.`
        : "";

  return (
    <form
      action={undoLastMatchdayAction.bind(null, tournamentId)}
      onSubmit={(e) => {
        if (
          !confirm(
            `Annullare la giornata ${matchdayNumber}? Gli slot che aveva eliminato tornano vivi e i risultati salvati vengono cancellati: si può correggerla e chiuderla di nuovo.${risk}`
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <button
        className={`${buttonGhost} border-lose/40 text-lose hover:border-lose hover:text-lose`}
        type="submit"
      >
        Annulla giornata {matchdayNumber}
      </button>
    </form>
  );
}
