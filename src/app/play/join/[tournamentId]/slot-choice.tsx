"use client";

import { useState } from "react";
import { input, label } from "@/components/ui";

const priceFormat = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

/**
 * Numero di slot (campo del form di iscrizione, name="num_slots") con
 * prezzo singolo e totale calcolati al volo mentre si cambia il numero —
 * per questo è client, il resto della pagina di invito è server. Il
 * prezzo totale/singolo compare solo se l'organizzatore ha impostato un
 * valore per slot (torneo "gratuito" altrimenti, stessa condizione usata
 * altrove per la sezione "Premio").
 */
export function SlotChoice({
  defaultNumSlots,
  slotValue,
}: {
  defaultNumSlots: number;
  slotValue: number;
}) {
  const [numSlots, setNumSlots] = useState(defaultNumSlots);

  return (
    <>
      <label className={label} htmlFor="num_slots">
        Quanti slot vuoi
      </label>
      <input
        className={input}
        id="num_slots"
        name="num_slots"
        type="number"
        min={1}
        max={100}
        required
        value={numSlots}
        onChange={(e) => setNumSlots(Number(e.target.value))}
      />
      {slotValue > 0 ? (
        <p className="text-xs text-foreground-faint">
          Prezzo slot{" "}
          <span className="font-mono text-foreground">
            {priceFormat.format(slotValue)}
          </span>
          {" · "}Totale{" "}
          <span className="font-mono text-foreground">
            {priceFormat.format(slotValue * (Number.isFinite(numSlots) ? numSlots : 0))}
          </span>
        </p>
      ) : null}
      <p className="text-xs text-foreground-faint">
        Sono le tue vite in questo torneo: uno slot eliminato non rientra
        più in gara. L&apos;organizzatore potrà comunque cambiare il
        numero più avanti.
      </p>
    </>
  );
}
