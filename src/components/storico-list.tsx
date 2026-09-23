"use client";

import { useState } from "react";
import { cardTight } from "@/components/ui";
import { AliveCount } from "@/components/alive-count";
import { PlayerSlotHistoryTable } from "@/components/player-slot-history-table";
import type { TournamentSlotHistoryPlayer } from "@/lib/queries";

export interface RankedHistoryPlayer extends TournamentSlotHistoryPlayer {
  rank: number;
  isMe: boolean;
}

/** Storico di un torneo come classifica: una riga per giocatore, in
 * ordine di slot vivi decrescente (pari merito = stesso numero, vedi
 * assignRanks in game-logic.ts), il proprio evidenziato — sostituisce
 * la vecchia coppia "il mio storico sempre aperto in cima" +
 * "gli altri sotto in un elenco a parte" (richiesto dall'utente il
 * 2026-09-24: doveva "essere già una classifica"). Un click apre lo
 * storico di quel giocatore, un secondo click lo richiude — aperto di
 * default solo il proprio. */
export function StoricoList({
  matchdayNumbers,
  players,
}: {
  matchdayNumbers: number[];
  players: RankedHistoryPlayer[];
}) {
  const [openPlayerId, setOpenPlayerId] = useState<string | null>(
    players.find((p) => p.isMe)?.playerId ?? null
  );

  return (
    <div className="flex flex-col gap-2">
      {players.map((p) => {
        const isOpen = p.playerId === openPlayerId;
        const alive = p.slots.filter((s) => s.eliminatedMatchday === null).length;
        return (
          <div
            key={p.playerId}
            className={`${cardTight} ${p.isMe ? "border-accent/50" : ""}`}
          >
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3"
              onClick={() => setOpenPlayerId(isOpen ? null : p.playerId)}
              aria-expanded={isOpen}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="font-mono text-xs text-foreground-faint">
                  {p.rank}
                </span>
                <span className="truncate font-display text-sm font-bold text-foreground">
                  {p.displayName}
                  {p.isMe ? " (tu)" : ""}
                </span>
              </span>
              <AliveCount alive={alive} total={p.slots.length} />
            </button>
            {isOpen ? (
              <div className="mt-3">
                <PlayerSlotHistoryTable
                  matchdayNumbers={matchdayNumbers}
                  slots={p.slots}
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
