"use client";

import { useMemo, useState, useTransition } from "react";
import { TeamBadge } from "@/components/team-badge";
import { button, buttonGhost, card, eyebrow } from "@/components/ui";
import { maxAssignableForTeam, solveSlotAssignment, type SlotOption } from "@/lib/slot-assignment";
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

const dayDateFormat = new Intl.DateTimeFormat("it-IT", {
  day: "numeric",
  month: "long",
});

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 flex-none" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 11.5 12 4l8 7.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AwayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 flex-none" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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
  /** Esito reale, caricato dal creator — se noto, il picker (in sola
   * lettura mentre le scelte sono chiuse) mostra chi ha vinto invece del
   * solo orario, come un piccolo "monitor" della giornata in corso. */
  result: "home_win" | "draw" | "away_win" | null;
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
  /** true quando la finestra di scelta (lunedì-giovedì) è chiusa: il
   * calendario resta visibile (serve proprio nel weekend, mentre si
   * gioca), ma i controlli diventano tutti disabilitati e spariscono i
   * bottoni di conferma. */
  readOnly?: boolean;
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
  readOnly = false,
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
  const remainingSlots = totalSlots - assignedCount;

  const eligibleAnywhere = useMemo(() => {
    const set = new Set<string>();
    for (const s of slots) for (const t of s.eligibleTeamIds) set.add(t);
    return set;
  }, [slots]);

  // Per ogni squadra, il massimo che si potrebbe ancora assegnarle a
  // parità delle scelte già fatte sulle altre: mostrato subito nella UI
  // invece di lasciarlo scoprire a tentativi cliccando finché non si
  // blocca (vedi maxAssignableForTeam).
  const maxima = useMemo(() => {
    const base = desiredCountsWith({});
    const result: Record<string, number> = {};
    for (const teamId of orderedTeamIds) {
      result[teamId] = maxAssignableForTeam(slotOptions, base, teamId);
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotOptions, counts, orderedTeamIds]);

  function disabledReason(teamName: string, teamId: string | undefined): string | null {
    if (!teamId) return "non in questo torneo";
    if (excludedSet.has(teamName)) return "non disponibile";
    if (!eligibleAnywhere.has(teamId)) return "già bruciata su tutti i tuoi slot";
    const max = maxima[teamId] ?? 0;
    const count = counts[teamId] ?? 0;
    if (count >= max) {
      return count > 0
        ? `hai raggiunto il massimo per questa squadra (${max})`
        : "nessuno slot libero per questa scelta";
    }
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
      setError("Con queste scelte non si può schierare: togli e rimetti qualche slot e riprova.");
      return;
    }
    const assignments = Object.entries(assignment).map(([slotId, teamId]) => ({ slotId, teamId }));
    startTransition(async () => {
      try {
        await submitPicksAction(tournamentId, matchdayId, assignments);
        setSaved(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Salvataggio fallito. Riprova.");
      }
    });
  }

  function TeamControl({ name, teamId }: { name: string; teamId: string | undefined }) {
    const count = teamId ? (counts[teamId] ?? 0) : 0;
    const reason = disabledReason(name, teamId);
    const disabled = reason !== null || isPending || readOnly;
    const remaining = teamId ? Math.max(0, (maxima[teamId] ?? 0) - count) : 0;
    return (
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
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
            ) : !readOnly && remaining > 0 ? (
              <span className="truncate text-[10px] text-foreground-faint">
                {remaining} assegnabili
              </span>
            ) : null}
          </span>
          {count > 0 ? (
            <span className="ml-auto flex-none rounded-full bg-accent px-2 py-0.5 font-mono text-[11px] font-bold text-accent-ink">
              {count}
            </span>
          ) : null}
        </button>
        {count > 0 && !readOnly ? (
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
    <>
      {/* Sempre il primo numero visibile mentre si gioca: quanti slot
          restano da assegnare, aggiornato a ogni click prima ancora di
          confermare. */}
      <section className={`${card} border-accent/30`}>
        <p className={eyebrow}>Slot ancora disponibili</p>
        <div className="mt-2 flex items-end justify-between gap-4">
          <p className="font-display text-4xl font-extrabold leading-none text-foreground">
            {remainingSlots}
            <span className="ml-1 text-base font-bold text-foreground-faint">
              /{totalSlots}
            </span>
          </p>
          {!saved ? (
            <span className="text-xs text-foreground-faint">Modifiche non salvate</span>
          ) : null}
        </div>
      </section>

      <section className={`${card} flex min-w-0 flex-col gap-4`}>
        <div>
          <p className={eyebrow}>
            Giornata {matchdayNumber} · {readOnly ? "calendario" : "scendi in campo"}
          </p>
          {readOnly ? (
            <p className="mt-1 text-xs text-foreground-faint">
              Mercato chiuso: si schiera solo da lunedì a giovedì. Qui
              sotto trovi comunque il programma di ogni squadra.
            </p>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          {dayGroups.map(({ group, fixtures }) => (
            <div key={group} className="flex min-w-0 flex-col gap-1.5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-foreground-faint">
                {dayGroupLabel[group]}
                {fixtures[0]?.kickoffAt
                  ? ` · ${dayDateFormat.format(new Date(fixtures[0].kickoffAt))}`
                  : ""}
              </p>
              <div className="flex min-w-0 flex-col gap-2">
                {fixtures.map((f) => (
                  <div key={f.id} className="min-w-0 rounded-lg border border-line p-3">
                    {f.result ? (
                      <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                        <span className="h-1.5 w-1.5 flex-none rounded-full bg-accent" />
                        {f.result === "draw"
                          ? "Finita · pareggio"
                          : `Finita · ha vinto ${f.result === "home_win" ? f.homeTeam : f.awayTeam}`}
                      </p>
                    ) : f.kickoffAt ? (
                      <p className="mb-1.5 text-[10px] text-foreground-faint">
                        {kickoffTimeFormat.format(new Date(f.kickoffAt))}
                      </p>
                    ) : null}
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-foreground-faint">
                          <HomeIcon /> Casa
                        </span>
                        <TeamControl name={f.homeTeam} teamId={teamByName.get(f.homeTeam)?.id} />
                      </div>
                      <span className="flex-none font-mono text-[10px] text-foreground-faint">vs</span>
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-foreground-faint">
                          <AwayIcon /> Trasferta
                        </span>
                        <TeamControl name={f.awayTeam} teamId={teamByName.get(f.awayTeam)?.id} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {otherTeams.length > 0 ? (
            <div className="flex min-w-0 flex-col gap-1.5">
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

        {!readOnly ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              className={`${button} flex-1`}
              disabled={isPending || saved || !assignment}
              onClick={handleConfirm}
            >
              {isPending ? "Salvo…" : saved ? "Squadre schierate" : "Schiera e conferma"}
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
        ) : null}
      </section>
    </>
  );
}
