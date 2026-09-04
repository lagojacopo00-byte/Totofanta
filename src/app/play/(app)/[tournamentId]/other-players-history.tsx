"use client";

import { useState } from "react";
import { cardTight } from "@/components/ui";
import { PlayerSlotHistoryTable } from "@/components/player-slot-history-table";
import type { TournamentSlotHistoryPlayer } from "@/lib/queries";

/** Lo storico degli ALTRI giocatori, sotto al proprio: solo i nomi con a
 * fianco quanti slot ha ancora vivi su quanti aveva all'inizio (verde/
 * grigio, non un'icona +/− — richiesto dall'utente il 2026-09-04), un
 * click apre lo storico di quel giocatore, un secondo click lo
 * richiude. Chiuso di default: con molti giocatori una lista di soli
 * nomi si legge a colpo d'occhio, i dettagli si aprono solo per chi
 * interessa davvero. */
export function OtherPlayersHistory({
  matchdayNumbers,
  players,
}: {
  matchdayNumbers: number[];
  players: TournamentSlotHistoryPlayer[];
}) {
  const [openPlayerId, setOpenPlayerId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      {players.map((p) => {
        const isOpen = p.playerId === openPlayerId;
        const alive = p.slots.filter((s) => s.eliminatedMatchday === null).length;
        return (
          <div key={p.playerId} className={cardTight}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2"
              onClick={() => setOpenPlayerId(isOpen ? null : p.playerId)}
              aria-expanded={isOpen}
            >
              <span className="font-display text-sm font-bold text-foreground">
                {p.displayName}
              </span>
              <span className="flex-none font-mono text-sm font-bold">
                <span className="text-accent">{alive}</span>
                <span className="text-foreground-faint">/{p.slots.length}</span>
              </span>
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
