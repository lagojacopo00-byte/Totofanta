"use client";

import { useRouter } from "next/navigation";
import { input } from "@/components/ui";

/** Menu a tendina per scegliere quale giornata già chiusa vedere nello
 * storico — stesso pattern di RoundPicker in dashboard/fixtures. Naviga
 * cambiando il parametro `giornata` nell'URL, così la pagina resta
 * linkabile a una giornata precisa. */
export function GiornataPicker({
  tournamentId,
  numbers,
  selected,
}: {
  tournamentId: string;
  numbers: number[];
  selected: number;
}) {
  const router = useRouter();
  return (
    <select
      className={`${input} w-auto`}
      value={selected}
      onChange={(e) =>
        router.push(`/play/${tournamentId}/storico?giornata=${e.target.value}`)
      }
    >
      {numbers.map((n) => (
        <option key={n} value={n}>
          Giornata {n}
        </option>
      ))}
    </select>
  );
}
