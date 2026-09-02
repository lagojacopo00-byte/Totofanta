// Scadenza per schierare gli slot di una giornata: NON più un orario fisso
// di calendario (era giovedì 23:59) — deciso con l'utente il 2026-09-02
// (spec funzionale via messaggi vocali, punto 2) — ma l'orario reale del
// primo calcio d'inizio di quella giornata specifica, letto dal
// calendario Serie A sincronizzato (serie_a_fixtures.kickoff_at). Ogni
// giornata ha quindi una scadenza diversa, calcolata sul momento invece
// che assunta dal giorno della settimana. Usato sia per il conto alla
// rovescia mostrato ai giocatori (vedi src/components/pick-countdown.tsx)
// sia — qui — come regola effettiva applicata server-side in
// submitPicksAction.

export interface FixtureForDeadline {
  kickoff_at: string | null;
  home_team: string;
  away_team: string;
}

/**
 * La scadenza per schierare: l'orario del PRIMO calcio d'inizio tra le
 * partite non escluse di questa giornata (una partita esclusa a mano, o
 * rinviata fuori dalla finestra ufficiale, non conta per la scadenza:
 * non è comunque giocabile). Ritorna null se nessuna partita non esclusa
 * ha ancora un orario noto — in quel caso le scelte restano aperte,
 * perché non c'è nessun orario reale a cui ancorare la chiusura.
 */
export function computePickDeadline(
  fixtures: FixtureForDeadline[],
  excludedTeamNames: Set<string>
): Date | null {
  const kickoffs = fixtures
    .filter(
      (f) =>
        !excludedTeamNames.has(f.home_team) && !excludedTeamNames.has(f.away_team)
    )
    .map((f) => (f.kickoff_at ? new Date(f.kickoff_at) : null))
    .filter((d): d is Date => d !== null && !Number.isNaN(d.getTime()));

  if (kickoffs.length === 0) return null;
  return new Date(Math.min(...kickoffs.map((d) => d.getTime())));
}

export function isPickingWindowOpen(
  deadline: Date | null,
  now: Date = new Date()
): boolean {
  if (!deadline) return true;
  return now.getTime() < deadline.getTime();
}
