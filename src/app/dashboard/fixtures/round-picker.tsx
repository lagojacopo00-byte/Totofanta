"use client";

import { useRouter } from "next/navigation";
import { input } from "@/components/ui";

/** Menu a tendina per scegliere quale giornata vedere/modificare, al
 * posto di scorrere tutto il calendario — con 38 giornate x ~10 partite
 * a testa diventava una lista lunghissima solo per arrivare a quella che
 * interessa in quel momento. Naviga cambiando il parametro `round`
 * nell'URL, così la pagina resta linkabile a una giornata precisa. */
export function RoundPicker({ rounds, selected }: { rounds: number[]; selected: number }) {
  const router = useRouter();
  return (
    <select
      className={`${input} w-auto`}
      value={selected}
      onChange={(e) => router.push(`/dashboard/fixtures?round=${e.target.value}`)}
    >
      {rounds.map((r) => (
        <option key={r} value={r}>
          Giornata {r}
        </option>
      ))}
    </select>
  );
}
