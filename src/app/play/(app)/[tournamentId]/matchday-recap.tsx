import { TeamBadge } from "@/components/team-badge";
import { card, cardTight, eyebrow, pillAlive, pillOut } from "@/components/ui";

export type RecapSlotStatus = "alive" | "eliminated" | "pending" | "exempt";

export interface RecapSlot {
  id: string;
  label: string;
  homeTeam: string;
  awayTeam: string;
  pickedTeam: string;
  result: "home_win" | "draw" | "away_win" | null;
  status: RecapSlotStatus;
}

const statusLabel: Record<RecapSlotStatus, string> = {
  alive: "Vivo",
  eliminated: "Eliminato",
  pending: "In corso",
  exempt: "Esente",
};

const pillPending =
  "inline-flex items-center rounded-full border border-line bg-surface-2 px-2.5 py-1 font-mono text-xs text-foreground-faint";

function statusPillClass(status: RecapSlotStatus): string {
  if (status === "alive" || status === "exempt") return pillAlive;
  if (status === "eliminated") return pillOut;
  return pillPending;
}

function resultLabel(slot: RecapSlot): string {
  if (!slot.result) return "In corso";
  if (slot.result === "draw") return "Pareggio";
  const winner = slot.result === "home_win" ? slot.homeTeam : slot.awayTeam;
  return `Vince ${winner}`;
}

/**
 * Riepilogo della giornata aperta, uno slot dello schierato dal
 * giocatore: badge delle due squadre della sua partita, esito e stato
 * dello slot — anche se due slot hanno scelto la stessa squadra, ognuno
 * compare separatamente con il proprio stato (deciso con l'utente:
 * "se avevo due slot sull'Inter e l'Inter perde, entrambi eliminati").
 * Progressivo: uno slot la cui partita non è ancora finita resta "In
 * corso" finché non arriva il risultato, senza aspettare che TUTTA la
 * giornata sia completa (a differenza dell'eliminazione vera e propria,
 * che invece aspetta sempre la giornata intera — vedi
 * tryFinalizeRoundEverywhere in src/lib/queries.ts). Solo gli slot con
 * una scelta per questa giornata compaiono: niente slot già eliminati in
 * precedenza, che qui non hanno nulla da mostrare.
 */
export function MatchdayRecap({
  matchdayNumber,
  slots,
}: {
  matchdayNumber: number;
  slots: RecapSlot[];
}) {
  if (slots.length === 0) return null;

  return (
    <section className={`${card} flex flex-col gap-3`}>
      <p className={eyebrow}>Giornata {matchdayNumber} · riepilogo</p>
      <ul className="flex flex-col gap-2">
        {slots.map((slot) => (
          <li
            key={slot.id}
            className={`${cardTight} flex items-center justify-between gap-3`}
          >
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="flex-none rounded-full border border-line bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-foreground-faint">
                {slot.label}
              </span>
              <TeamBadge name={slot.homeTeam} size="sm" />
              <span className="flex-none font-mono text-[10px] text-foreground-faint">
                vs
              </span>
              <TeamBadge name={slot.awayTeam} size="sm" />
              <span className="min-w-0 truncate text-xs text-foreground-soft">
                {resultLabel(slot)}
              </span>
            </div>
            <span className={`flex-none ${statusPillClass(slot.status)}`}>
              {statusLabel[slot.status]}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
