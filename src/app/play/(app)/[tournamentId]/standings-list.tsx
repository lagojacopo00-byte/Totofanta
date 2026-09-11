"use client";

import { useState } from "react";
import { TeamBadge } from "@/components/team-badge";
import { cardTight, eyebrow, pillAlive, pillOut } from "@/components/ui";
import type { LivePickVisibility } from "@/lib/live-picks";

export interface StandingsRow {
  playerId: string;
  displayName: string;
  fullName: string | null;
  rank: number;
  alive: number;
  totalSlots: number;
  isMe: boolean;
  isFinished: boolean;
  /** Solo a torneo concluso: la fetta di montepremi già formattata (es.
   * "50% · 125,00 €"), o null per chi non ha vinto. */
  prizeLabel: string | null;
  /** Le scelte di QUESTO giocatore per la giornata aperta — null quando
   * non c'è nessuna giornata aperta: la riga resta una riga di classifica
   * e basta, non si apre. */
  picks: LivePickVisibility | null;
}

/** La classifica del torneo, con le righe apribili per vedere cosa ha
 * schierato ciascuno nella giornata aperta (vedi src/lib/live-picks.ts).
 * Una alla volta, come lo storico degli altri giocatori più sopra nella
 * stessa pagina. */
export function StandingsList({
  rows,
  matchdayNumber,
}: {
  rows: StandingsRow[];
  matchdayNumber: number | null;
}) {
  const [openPlayerId, setOpenPlayerId] = useState<string | null>(null);
  const expandable = rows.some((r) => r.picks !== null);

  return (
    <section className={cardTight}>
      <div className="flex items-baseline justify-between gap-2">
        <p className={eyebrow}>Classifica</p>
        {expandable && matchdayNumber !== null ? (
          <p className="text-[11px] text-foreground-faint">
            tocca per la giornata {matchdayNumber}
          </p>
        ) : null}
      </div>
      <ul className="mt-2 flex flex-col gap-1.5">
        {rows.map((row) => {
          const isOpen = row.playerId === openPlayerId;
          const content = (
            <>
              <span className="flex min-w-0 items-center gap-2">
                <span className="font-mono text-xs text-foreground-faint">
                  {row.rank}°
                </span>
                <span className="min-w-0">
                  <span
                    className={
                      row.isMe
                        ? "block truncate font-display font-bold text-foreground"
                        : "block truncate text-foreground-soft"
                    }
                  >
                    {row.displayName}
                    {row.isMe ? " (tu)" : ""}
                  </span>
                  {/* Nome e cognome, se impostati: utili quando qualcuno
                      sceglie un nome pubblico che non fa capire chi è. */}
                  {row.fullName ? (
                    <span className="block truncate text-[11px] text-foreground-faint">
                      {row.fullName}
                    </span>
                  ) : null}
                </span>
              </span>
              <span className="flex flex-none items-center gap-1.5">
                {row.isFinished ? (
                  row.prizeLabel !== null ? (
                    <span className={pillAlive}>{row.prizeLabel}</span>
                  ) : (
                    <span className={pillOut}>eliminato</span>
                  )
                ) : (
                  <span className={row.alive > 0 ? pillAlive : pillOut}>
                    {row.alive}/{row.totalSlots} vivi
                  </span>
                )}
                {row.picks !== null ? (
                  <span
                    className={`text-foreground-faint transition-transform ${isOpen ? "rotate-180" : ""}`}
                  >
                    ▾
                  </span>
                ) : null}
              </span>
            </>
          );

          return (
            <li key={row.playerId} className="flex flex-col">
              {row.picks !== null ? (
                <button
                  type="button"
                  className="flex items-center justify-between gap-2 text-left text-sm"
                  onClick={() => setOpenPlayerId(isOpen ? null : row.playerId)}
                  aria-expanded={isOpen}
                >
                  {content}
                </button>
              ) : (
                <div className="flex items-center justify-between gap-2 text-sm">
                  {content}
                </div>
              )}
              {isOpen && row.picks ? (
                <PickDetail visibility={row.picks} isMe={row.isMe} />
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function PickDetail({
  visibility,
  isMe,
}: {
  visibility: LivePickVisibility;
  isMe: boolean;
}) {
  if (visibility.kind === "visible") {
    return (
      <div className="mt-2 mb-1 flex flex-wrap gap-1.5 rounded-lg border border-line bg-surface-2 p-2">
        {visibility.picks.map((pick) => (
          <span
            key={pick.slotLabel}
            className="inline-flex items-center gap-1.5 rounded-full border border-line py-1 pl-1 pr-2.5"
          >
            <TeamBadge name={pick.teamName} size="sm" />
            <span className="text-[11px] text-foreground">
              {pick.teamName}
              <span className="text-foreground-faint"> · slot {pick.slotLabel}</span>
            </span>
          </span>
        ))}
      </div>
    );
  }

  const text =
    visibility.kind === "out"
      ? "Fuori dal torneo: non ha più slot da schierare."
      : isMe
        ? "Non hai ancora schierato per questa giornata."
        : "Non ha ancora schierato per questa giornata.";

  return (
    <p className="mt-2 mb-1 rounded-lg border border-line bg-surface-2 p-2 text-[11px] leading-relaxed text-foreground-soft">
      {text}
    </p>
  );
}
