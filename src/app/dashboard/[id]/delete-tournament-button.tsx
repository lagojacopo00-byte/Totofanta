"use client";

import { buttonGhost } from "@/components/ui";
import { deleteTournamentAction } from "./actions";

/** Cancellazione irreversibile (giocatori, scelte, risultati inclusi):
 * a differenza delle altre azioni di questa pagina, qui serve una
 * conferma esplicita prima di inviare il form. */
export function DeleteTournamentButton({
  tournamentId,
  tournamentName,
}: {
  tournamentId: string;
  tournamentName: string;
}) {
  return (
    <form
      action={deleteTournamentAction.bind(null, tournamentId)}
      onSubmit={(e) => {
        if (
          !confirm(
            `Cancellare definitivamente "${tournamentName}"? Giocatori, scelte e risultati andranno persi per sempre. Questa azione non si può annullare.`
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
        Cancella torneo
      </button>
    </form>
  );
}
