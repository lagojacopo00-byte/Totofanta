"use client";

import { buttonGhost } from "@/components/ui";
import { deleteAccountAction } from "./actions";

/** Cancellazione irreversibile del proprio account — conferma esplicita
 * prima di inviare, come per la cancellazione di un torneo. */
export function DeleteAccountButton() {
  return (
    <form
      action={deleteAccountAction}
      onSubmit={(e) => {
        if (
          !confirm(
            "Cancellare per sempre il tuo account? Perdi l'accesso a tutti i tornei a cui partecipi. Non si torna indietro."
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
        Cancella account
      </button>
    </form>
  );
}
