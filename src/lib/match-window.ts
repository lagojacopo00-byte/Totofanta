// La finestra ufficiale in cui si giocano le partite di una giornata:
// venerdì, sabato, domenica, lunedì (vedi docs/02_Regole_gioco.md,
// "Finestra ufficiale delle partite") — concetto distinto dalla scadenza
// di SCELTA di src/lib/pick-window.ts (che segue il calcio d'inizio
// della prima partita, non un giorno fisso). Usata per due cose:
// - da getExcludedTeamNames in src/lib/queries.ts, per capire se una
//   partita rientra o no nella finestra (una rinviata fuori, es. spostata
//   a un martedì di due settimane dopo, non conta ai fini del gioco);
// - nella schermata di scelta, per raggruppare/etichettare le partite per
//   giorno (vedi groupFixturesByDay più sotto).
//
// Basata sull'ora del kickoff così com'è salvata (kickoff_at), senza
// conversioni di fuso orario particolari: stessa approssimazione già
// accettata in pick-window.ts.

const MATCH_WINDOW_DAYS = new Set([5, 6, 0, 1]); // ven, sab, dom, lun (0 = dom in JS)

export function isWithinMatchWindow(kickoffAt: Date): boolean {
  return MATCH_WINDOW_DAYS.has(kickoffAt.getDay());
}

export type MatchDayGroup = "venerdì" | "sabato" | "domenica" | "lunedì" | "altro";

const DAY_GROUP_BY_WEEKDAY: Record<number, MatchDayGroup> = {
  5: "venerdì",
  6: "sabato",
  0: "domenica",
  1: "lunedì",
};

export function matchDayGroupOf(kickoffAt: Date): MatchDayGroup {
  return DAY_GROUP_BY_WEEKDAY[kickoffAt.getDay()] ?? "altro";
}

export interface FixtureLike {
  id: string;
  kickoff_at: string | null;
}

/**
 * Raggruppa le partite di una giornata per giorno (venerdì/sabato/
 * domenica/lunedì, più "altro" per chi non rientra nella finestra o non
 * ha ancora una data), ordinate cronologicamente dentro ogni gruppo. Le
 * partite senza data vanno in coda al gruppo "altro", nell'ordine in cui
 * arrivano. Puro e testabile: usato dalla schermata di scelta.
 */
export function groupFixturesByDay<T extends FixtureLike>(
  fixtures: T[]
): { group: MatchDayGroup; fixtures: T[] }[] {
  const order: MatchDayGroup[] = ["venerdì", "sabato", "domenica", "lunedì", "altro"];
  const byGroup = new Map<MatchDayGroup, T[]>();

  for (const f of fixtures) {
    const date = f.kickoff_at ? new Date(f.kickoff_at) : null;
    const group: MatchDayGroup =
      date && !Number.isNaN(date.getTime()) ? matchDayGroupOf(date) : "altro";
    byGroup.set(group, [...(byGroup.get(group) ?? []), f]);
  }

  for (const group of byGroup.keys()) {
    byGroup.get(group)!.sort((a, b) => {
      if (!a.kickoff_at && !b.kickoff_at) return 0;
      if (!a.kickoff_at) return 1;
      if (!b.kickoff_at) return -1;
      return new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime();
    });
  }

  return order
    .filter((group) => byGroup.has(group))
    .map((group) => ({ group, fixtures: byGroup.get(group)! }));
}
