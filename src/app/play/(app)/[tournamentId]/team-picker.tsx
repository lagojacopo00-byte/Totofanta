"use client";

import { useMemo, useState, useTransition } from "react";
import { TeamBadge } from "@/components/team-badge";
import { button, buttonGhost, card, eyebrow } from "@/components/ui";
import { solveSlotAssignment, type SlotOption } from "@/lib/slot-assignment";
import type { MatchDayGroup } from "@/lib/match-window";
import { submitPicksAction } from "./actions";

const dayGroupLabel: Record<MatchDayGroup, string> = {
  venerdì: "Venerdì",
  sabato: "Sabato",
  domenica: "Domenica",
  lunedì: "Lunedì",
  altro: "Data da confermare",
};

const kickoffTimeFormat = new Intl.DateTimeFormat("it-IT", {
  hour: "2-digit",
  minute: "2-digit",
});

export interface TeamOption {
  id: string;
  name: string;
}

export interface PickerSlot {
  id: string;
  label: string;
  /** Squadre che QUESTO slot può ancora scegliere (già escluse quelle
   * usate in altre giornate e quelle escluse/non disponibili questa
   * giornata). */
  eligibleTeamIds: string[];
  /** Squadra già scelta per la giornata aperta, se c'è. */
  currentTeamId: string | null;
}

export interface PickerFixture {
  id: string;
  homeTeam: string;
  awayTeam: string;
  kickoffAt: string | null;
}

export interface PickerDayGroup {
  group: MatchDayGroup;
  fixtures: PickerFixture[];
}

interface TeamPickerProps {
  tournamentId: string;
  matchdayId: string;
  matchdayNumber: number;
  slots: PickerSlot[];
  dayGroups: PickerDayGroup[];
  /** Squadre disponibili nel torneo senza una partita in calendario questa
   * giornata (competizioni personalizzate). */
  otherTeams: TeamOption[];
  /** Nomi delle squadre non disponibili questa giornata (rinvio, tavolino,
   * ecc.) — solo per il messaggio mostrato, l'esclusione vera è già dentro
   * `eligibleTeamIds`. */
  excludedTeamNames: string[];
  /** Tutte le squadre disponibili nel torneo, per risalire dal nome (delle
   * partite) alla squadra (id) — le partite riportano il nome, non l'id. */
  teams: TeamOption[];
}

function initialCounts(slots: PickerSlot[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const slot of slots) {
    if (!slot.currentTeamId) continue;
    counts[slot.currentTeamId] = (counts[slot.currentTeamId] ?? 0) + 1;
  }
  return counts;
}

export function TeamPicker({
  tournamentId,
  matchdayId,
  matchdayNumber,
  slots,
  dayGroups,
  otherTeams,
  excludedTeamNames,
  teams,
}: TeamPickerProps) {
  const [counts, setCounts] = useState<Record<string, number>>(() => initialCounts(slots));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(true);
  const [isPending, startTransition] = useTransition();

  const teamByName = useMemo(() => new Map(teams.map((t) => [t.name, t])), [teams]);
  const excludedSet = useMemo(() => new Set(excludedTeamNames), [excludedTeamNames]);

  const slotOptions: SlotOption[] = useMemo(
    () => slots.map((s) => ({ slotId: s.id, eligibleTeamIds: s.eligibleTeamIds })),
    [slots]
  );

  // Ordine stabile (per nome) invece dell'ordine di click: rende
  // l'assegnazione fisica slot->squadra deterministica a parità di
  // conteggi, invece di ballare a ogni ricalcolo.
  const orderedTeamIds = useMemo(
    () => [...teams].sort((a, b) => a.name.localeCompare(b.name)).map((t) => t.id),
    [teams]
  );

  function desiredCountsWith(overrides: Record<string, number>): Record<string, number> {
    const merged: Record<string, number> = { ...counts, ...overrides };
    const ordered: Record<string, number> = {};
    for (const teamId of orderedTeamIds) {
      if (merged[teamId]) ordered[teamId] = merged[teamId];
    }
    return ordered;
  }

  const assignment = useMemo(
    () => solveSlotAssignment(slotOptions, desiredCountsWith({})),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slotOptions, counts, orderedTeamIds]
  );

  const totalSlots = slots.length;
  const assignedCount = Object.values(counts).reduce((sum, n) => sum + n, 0);

  const eligibleAnywhere = useMemo(() => {
    const set = new Set<string>();
    for (const s of slots) for (const t of s.eligibleTeamIds) set.add(t);
    return set;
  }, [slots]);

  function canIncrement(teamId: string): boolean {
    return solveSlotAssignment(slotOptions, desiredCountsWith({ [teamId]: (counts[teamId] ?? 0) + 1 })) !== null;
  }

  function disabledReason(teamName: string, teamId: string | undefined): string | null {
    if (!teamId) return "non in questo torneo";
    if (excludedSet.has(teamName)) return "non disponibile questa giornata";
    if (!eligibleAnywhere.has(teamId)) return "già usata su tutti i tuoi slot";
    if (!canIncrement(teamId)) return "nessuno slot libero per questa scelta";
    return null;
  }

  function increment(teamId: string) {
    setError(null);
    setSaved(false);
    setCounts((prev) => ({ ...prev, [teamId]: (prev[teamId] ?? 0) + 1 }));
  }

  function decrement(teamId: string) {
    setError(null);
    setSaved(false);
    setCounts((prev) => {
      const current = prev[teamId] ?? 0;
      if (current <= 0) return prev;
      const next = { ...prev, [teamId]: current - 1 };
      if (next[teamId] === 0) delete next[teamId];
      return next;
    });
  }

  function handleConfirm() {
    if (!assignment) {
      setError("Le scelte attuali non sono realizzabili: prova a togliere e rimettere qualche slot.");
      return;
    }
    const assignments = Object.entries(assignment).map(([slotId, teamId]) => ({ slotId, teamId }));
    startTransition(async () => {
      try {
        await submitPicksAction(tournamentId, matchdayId, assignments);
        setSaved(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Errore nel salvare le scelte.");
      }
    });
  }

  function TeamControl({ name, teamId }: { name: string; teamId: string | undefined }) {
    const count = teamId ? (counts[teamId] ?? 0) : 0;
    const reason = disabledReason(name, teamId);
    const disabled = reason !== null || isPending;
    return (
      <div className="flex min-w-0 items-center gap-1.5">
        <button
          type="button"
          disabled={disabled}
          onClick={() => teamId && increment(teamId)}
          className={`flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs transition-colors ${
            disabled
              ? "cursor-not-allowed border-line bg-surface-2/50 opacity-50"
              : "cursor-pointer border-line bg-surface-2 hover:border-accent"
          }`}
        >
          <TeamBadge name={name} size="sm" />
          <span className="flex min-w-0 flex-col items-start">
            <span className="truncate font-semibold text-foreground">{name}</span>
            {reason ? (
              <span className="truncate text-[10px] text-foreground-faint">{reason}</span>
            ) : null}
          </span>
          {count > 0 ? (
            <span className="ml-auto flex-none rounded-full bg-accent px-2 py-0.5 font-mono text-[11px] font-bold text-accent-ink">
              {count}
            </span>
          ) : null}
        </button>
        {count > 0 ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() => teamId && decrement(teamId)}
            aria-label={`Togli uno slot da ${name}`}
            className="flex h-7 w-7 flex-none items-center justify-center rounded-full border border-lose/40 bg-lose-bg font-display text-sm font-bold text-lose transition-colors hover:bg-lose/20"
          >
            −
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <section className={`${card} flex flex-col gap-4`}>
      <div className="flex items-center justify-between gap-2">
        <p className={eyebrow}>Giornata {matchdayNumber} · scegli le squadre</p>
        <span className="flex-none font-mono text-xs text-foreground-faint">
          {assignedCount}/{totalSlots} slot assegnati
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {dayGroups.map(({ group, fixtures }) => (
          <div key={group} className="flex flex-col gap-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-foreground-faint">
              {dayGroupLabel[group]}
            </p>
            <div className="flex flex-col gap-2">
              {fixtures.map((f) => (
                <div key={f.id} className="rounded-lg border border-line p-2">
                  {f.kickoffAt ? (
                    <p className="mb-1.5 text-[10px] text-foreground-faint">
                      {kickoffTimeFormat.format(new Date(f.kickoffAt))}
                    </p>
                  ) : null}
                  <div className="flex items-center gap-2">
                    <TeamControl name={f.homeTeam} teamId={teamByName.get(f.homeTeam)?.id} />
                    <span className="flex-none font-mono text-[10px] text-foreground-faint">vs</span>
                    <TeamControl name={f.awayTeam} teamId={teamByName.get(f.awayTeam)?.id} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {otherTeams.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-foreground-faint">
              Altre squadre disponibili
            </p>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {otherTeams.map((t) => (
                <TeamControl key={t.id} name={t.name} teamId={t.id} />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {error ? <p className="text-sm text-lose">{error}</p> : null}

      <div className="flex items-center gap-3">
        <button
          type="button"
          className={`${button} flex-1`}
          disabled={isPending || saved || !assignment}
          onClick={handleConfirm}
        >
          {isPending ? "Salvo…" : saved ? "Scelte salvate" : "Conferma le scelte"}
        </button>
        {!saved && !isPending ? (
          <button
            type="button"
            className={buttonGhost}
            onClick={() => {
              setCounts(initialCounts(slots));
              setError(null);
              setSaved(true);
            }}
          >
            Annulla
          </button>
        ) : null}
      </div>
    </section>
  );
}
