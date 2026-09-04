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

/**
 * Approssimazione di quando riapre lo schieramento per la prossima
 * giornata, per il conto alla rovescia mostrato nella home mentre si
 * aspettano i risultati (vedi src/components/matchday-reopen-countdown.tsx):
 * la mezzanotte di lunedì di chiusura della giornata in corso, cioè le
 * 00:00 del martedì successivo alla scadenza di schieramento — la
 * finestra ufficiale delle partite è ven-sab-dom-lun (vedi
 * src/lib/match-window.ts), quindi il lunedì finisce quando inizia il
 * martedì. È solo un'indicazione di calendario: non segue la chiusura
 * reale per mano dell'organizzatore, che può avvenire prima o dopo.
 */
export function computeNextRoundReopenAt(pickDeadline: Date): Date {
  const target = new Date(pickDeadline);
  target.setHours(0, 0, 0, 0);
  const TUESDAY = 2;
  let daysToAdd = (TUESDAY - target.getDay() + 7) % 7;
  if (daysToAdd === 0) daysToAdd = 7;
  target.setDate(target.getDate() + daysToAdd);
  return target;
}
