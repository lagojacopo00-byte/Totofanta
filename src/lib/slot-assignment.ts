// Trova un'assegnazione slot -> squadra che soddisfi esattamente i
// conteggi desiderati per ogni squadra ("5 slot su Atalanta, 5 su
// Bologna"), rispettando quali squadre ogni slot può ancora scegliere
// (non le ha già usate in un'altra giornata). Usato dalla schermata di
// scelta del giocatore: ogni click su una squadra aumenta di uno il suo
// conteggio desiderato, e questa funzione verifica che il totale sia
// davvero realizzabile.
//
// Non basta un algoritmo "greedy" (assegna il primo slot libero che
// trova): un ordine di click sfortunato potrebbe occupare l'unico slot
// che può ancora giocare una certa squadra, bloccando un'assegnazione che
// in realtà sarebbe possibile scambiando gli slot. Per questo si ricalcola
// sempre da zero un matching bipartito vero (algoritmo di Kuhn, con ogni
// unità di conteggio desiderato trattata come una "richiesta" separata).

export interface SlotOption {
  slotId: string;
  /** Squadre che questo slot può ancora scegliere per la giornata aperta. */
  eligibleTeamIds: string[];
}

/**
 * Torna una mappa slotId -> teamId che soddisfa esattamente
 * `desiredCounts` (le squadre assenti o a zero non compaiono nel
 * risultato), oppure `null` se nessuna combinazione riesce a soddisfarli
 * tutti insieme.
 */
export function solveSlotAssignment(
  slots: SlotOption[],
  desiredCounts: Record<string, number>
): Record<string, string> | null {
  const requests: string[] = [];
  for (const [teamId, count] of Object.entries(desiredCounts)) {
    for (let i = 0; i < count; i++) requests.push(teamId);
  }
  if (requests.length === 0) return {};
  if (requests.length > slots.length) return null;

  const slotsForTeam = new Map<string, string[]>();
  for (const slot of slots) {
    for (const teamId of slot.eligibleTeamIds) {
      if (!slotsForTeam.has(teamId)) slotsForTeam.set(teamId, []);
      slotsForTeam.get(teamId)!.push(slot.slotId);
    }
  }

  // requestOfSlot[slotId] = indice della richiesta a cui è attualmente
  // assegnato quello slot, se assegnato.
  const requestOfSlot = new Map<string, number>();

  function tryAssign(requestIdx: number, visited: Set<string>): boolean {
    const teamId = requests[requestIdx];
    for (const slotId of slotsForTeam.get(teamId) ?? []) {
      if (visited.has(slotId)) continue;
      visited.add(slotId);
      const occupiedBy = requestOfSlot.get(slotId);
      // Slot libero, o occupato da una richiesta che può essere spostata
      // altrove (cammino aumentante): in entrambi i casi possiamo prenderlo.
      if (occupiedBy === undefined || tryAssign(occupiedBy, visited)) {
        requestOfSlot.set(slotId, requestIdx);
        return true;
      }
    }
    return false;
  }

  for (let i = 0; i < requests.length; i++) {
    if (!tryAssign(i, new Set())) return null;
  }

  const result: Record<string, string> = {};
  for (const [slotId, requestIdx] of requestOfSlot) {
    result[slotId] = requests[requestIdx];
  }
  return result;
}

/**
 * Il massimo conteggio assegnabile a `teamId`, tenendo fissi i conteggi
 * desiderati di tutte le altre squadre in `desiredCounts` (il conteggio
 * attuale di `teamId` lì dentro viene ignorato). Serve a mostrare in
 * anticipo "fino a quanti slot posso mettere questa squadra" invece di
 * lasciar scoprire il limite a tentativi cliccando finché non si blocca.
 *
 * La fattibilità è monotona in n (se n slot sono assegnabili, n-1 lo sono
 * sempre: basta liberarne uno), quindi si può cercare il massimo con una
 * ricerca binaria invece di provare un conteggio alla volta.
 */
export function maxAssignableForTeam(
  slots: SlotOption[],
  desiredCounts: Record<string, number>,
  teamId: string
): number {
  const otherCounts: Record<string, number> = {};
  for (const [id, n] of Object.entries(desiredCounts)) {
    if (id !== teamId) otherCounts[id] = n;
  }

  const upperBound = slots.filter((s) => s.eligibleTeamIds.includes(teamId)).length;
  let lo = 0;
  let hi = upperBound;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const feasible = solveSlotAssignment(slots, { ...otherCounts, [teamId]: mid }) !== null;
    if (feasible) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}
