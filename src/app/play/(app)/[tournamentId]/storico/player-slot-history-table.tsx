import { TeamBadge } from "@/components/team-badge";
import type { TournamentSlotHistoryPlayer } from "@/lib/queries";

/**
 * Storico di un giocatore: una riga per slot, una colonna per ogni
 * giornata già chiusa — stessa logica del foglio Excel "Storico" (vedi
 * buildStoricoSheet in src/lib/matchday-export.ts), qui in app. Solo il
 * badge della squadra (niente nome per esteso): a colpo d'occhio basta.
 * Una riga il cui slot è stato eliminato è tutta in grigio e sbarrata,
 * comprese le giornate prima dell'eliminazione — non serve più
 * distinguere vittoria da sconfitta cella per cella: sopravvivere vuol
 * dire aver sempre vinto, quindi l'unica cosa da segnalare è che quello
 * slot è uscito. Le giornate dopo l'eliminazione restano vuote: lo slot
 * non gioca più. La colonna "Slot" resta fissa (sticky) mentre si scorre
 * in orizzontale, per i tornei con molte giornate già giocate.
 */
export function PlayerSlotHistoryTable({
  matchdayNumbers,
  slots,
}: {
  matchdayNumbers: number[];
  slots: TournamentSlotHistoryPlayer["slots"];
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 border-b border-r border-line bg-surface px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-foreground-faint">
              Slot
            </th>
            {matchdayNumbers.map((n) => (
              <th
                key={n}
                className="border-b border-line bg-surface px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-foreground-faint"
              >
                G{n}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {slots.map((slot, i) => {
            const eliminated = slot.eliminatedMatchday !== null;
            const isLast = i === slots.length - 1;
            return (
              <tr
                key={slot.label}
                className={eliminated ? "opacity-50 grayscale line-through" : ""}
              >
                <td
                  className={`sticky left-0 z-10 border-r border-line bg-surface px-3 py-2 font-mono text-xs text-foreground-faint ${
                    isLast ? "" : "border-b"
                  }`}
                >
                  {slot.label}
                </td>
                {matchdayNumbers.map((n) => {
                  const alreadyOut =
                    eliminated && n > (slot.eliminatedMatchday as number);
                  const teamName = alreadyOut ? null : (slot.picksByMatchday.get(n) ?? null);
                  return (
                    <td
                      key={n}
                      className={`px-3 py-2 text-center ${isLast ? "" : "border-b border-line"}`}
                    >
                      {teamName ? (
                        <TeamBadge name={teamName} size="sm" />
                      ) : alreadyOut ? null : (
                        <span className="text-xs text-foreground-faint">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
