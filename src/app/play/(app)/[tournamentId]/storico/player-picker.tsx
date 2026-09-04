"use client";

import { useRouter } from "next/navigation";
import { input } from "@/components/ui";

/** Menu a tendina per scegliere di quale giocatore vedere lo storico —
 * stesso pattern del vecchio GiornataPicker, ma su un elenco di
 * giocatori invece che di giornate. Naviga cambiando il parametro
 * `giocatore` nell'URL, così la pagina resta linkabile a un giocatore
 * preciso. */
export function PlayerPicker({
  tournamentId,
  players,
  selectedPlayerId,
}: {
  tournamentId: string;
  players: { id: string; label: string }[];
  selectedPlayerId: string;
}) {
  const router = useRouter();
  return (
    <select
      className={`${input} w-auto`}
      value={selectedPlayerId}
      onChange={(e) =>
        router.push(`/play/${tournamentId}/storico?giocatore=${e.target.value}`)
      }
    >
      {players.map((p) => (
        <option key={p.id} value={p.id}>
          {p.label}
        </option>
      ))}
    </select>
  );
}
