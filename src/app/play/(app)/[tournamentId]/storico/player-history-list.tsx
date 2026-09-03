"use client";

import { useState } from "react";
import { card, cardTight, pillAlive, pillOut } from "@/components/ui";
import { TeamBadge } from "@/components/team-badge";
import type { HistorySlotEntry } from "@/lib/queries";

export interface PlayerHistoryGroup {
  playerId: string;
  playerName: string;
  slots: HistorySlotEntry[];
}

const pillPending =
  "inline-flex items-center rounded-full border border-line bg-surface-2 px-2.5 py-1 font-mono text-xs text-foreground-faint";

const outcomeLabel: Record<HistorySlotEntry["outcome"], string> = {
  win: "Vinta",
  draw: "Pareggio",
  loss: "Persa",
  missed_pick: "Nessuna scelta",
  exempt: "Esente",
};

function outcomePillClass(outcome: HistorySlotEntry["outcome"]): string {
  if (outcome === "win" || outcome === "exempt") return pillAlive;
  if (outcome === "loss" || outcome === "missed_pick") return pillOut;
  return pillPending;
}

/** Elenco dei giocatori di una giornata dello storico: solo i nomi, un
 * click apre lo storico di quel giocatore (le sue squadre schierate),
 * un secondo click lo richiude — richiesto dall'utente il 2026-09-03,
 * al posto di mostrare sempre tutti aperti insieme. Chiuso di default:
 * con molti giocatori una lista di soli nomi si legge a colpo d'occhio,
 * i dettagli si aprono solo per chi interessa davvero. */
export function PlayerHistoryList({ groups }: { groups: PlayerHistoryGroup[] }) {
  const [openPlayerId, setOpenPlayerId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      {groups.map((g) => {
        const isOpen = g.playerId === openPlayerId;
        return (
          <section key={g.playerId} className={card}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2"
              onClick={() => setOpenPlayerId(isOpen ? null : g.playerId)}
              aria-expanded={isOpen}
            >
              <span className="font-display text-base font-bold text-foreground">
                {g.playerName}
              </span>
              <span className="flex-none font-display text-lg font-bold text-foreground-faint">
                {isOpen ? "−" : "+"}
              </span>
            </button>
            {isOpen ? (
              <ul className="mt-3 flex flex-col gap-2">
                {g.slots.map((slot, i) => (
                  <li
                    key={`${g.playerId}-${slot.slotLabel}-${i}`}
                    className={`${cardTight} flex items-center justify-between gap-3`}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <span className="flex-none rounded-full border border-line bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-foreground-faint">
                        {slot.slotLabel}
                      </span>
                      {slot.teamName ? (
                        <TeamBadge name={slot.teamName} size="sm" />
                      ) : null}
                      <span className="min-w-0 truncate text-xs text-foreground-soft">
                        {slot.teamName ?? "—"}
                      </span>
                    </div>
                    <span className={`flex-none ${outcomePillClass(slot.outcome)}`}>
                      {outcomeLabel[slot.outcome]}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
