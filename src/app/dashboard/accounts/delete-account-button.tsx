"use client";

import { buttonGhost } from "@/components/ui";
import { adminDeleteUserAction } from "./actions";

/** Cancellazione irreversibile di un account altrui da parte del
 * creator — conferma esplicita prima di inviare, come per la
 * cancellazione di un torneo o del proprio account. Se l'utente
 * possiede ancora dei tornei li elenca nel messaggio: cancellare
 * l'account li cancella a cascata, con i dati di TUTTI gli altri
 * giocatori che ci giocano. */
export function DeleteAccountButton({
  userId,
  label,
  ownedTournamentNames,
}: {
  userId: string;
  label: string;
  ownedTournamentNames: string[];
}) {
  return (
    <form
      action={adminDeleteUserAction.bind(null, userId)}
      onSubmit={(e) => {
        const tournamentsWarning =
          ownedTournamentNames.length > 0
            ? `\n\nPossiede ancora ${ownedTournamentNames.length} torneo/i (${ownedTournamentNames.join(", ")}): verranno cancellati anche quelli, con i dati di tutti gli altri giocatori.`
            : "";
        if (
          !confirm(
            `Cancellare per sempre l'account di ${label}?${tournamentsWarning}\n\nNon si torna indietro.`
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <button
        className={`${buttonGhost} px-2 py-1 text-xs border-lose/40 text-lose hover:border-lose hover:text-lose`}
        type="submit"
      >
        Elimina account
      </button>
    </form>
  );
}
