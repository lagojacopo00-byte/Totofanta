// Logica di gioco di Totofanta, isolata dal database e da Next.js così da
// poter essere testata senza bisogno di Supabase.
//
// Regole implementate (vedi la pagina "Regolamento" del progetto):
// - Uno slot sopravvive alla giornata solo se la squadra scelta VINCE.
//   Pareggio, sconfitta o pick mancato eliminano lo slot.
// - Gli slot sono indipendenti: il risultato di uno slot non influenza
//   gli altri slot dello stesso giocatore, nella stessa giornata o in
//   giornate diverse.
// - Non si può scegliere la stessa squadra due volte sullo stesso slot
//   (vedi `teamsAvailableForSlot`).
// - Se una giornata eliminerebbe TUTTI gli slot ancora vivi del torneo,
//   scatta lo spareggio "ex aequo": il torneo finisce e vincono tutti i
//   giocatori che avevano ancora almeno uno slot vivo prima di quella
//   giornata (vedi `applyMatchdayResults`).

export type Outcome = 'win' | 'draw' | 'loss'

export interface Team {
  id: string
  name: string
}

export interface AliveSlot {
  slotId: string
  playerId: string
}

export interface MatchdayPick {
  slotId: string
  teamId: string
}

export type SlotOutcomeReason = 'won' | 'drew' | 'lost' | 'missed_pick' | 'exempt'

export interface SlotOutcome {
  slotId: string
  playerId: string
  survived: boolean
  reason: SlotOutcomeReason
  teamId?: string
}

export interface ApplyMatchdayInput {
  /** Gli slot ancora vivi PRIMA di processare questa giornata. */
  aliveSlotsBefore: AliveSlot[]
  /** Una entry per ogni slot che ha scelto una squadra questa giornata. Uno
   * slot vivo assente da questa lista viene trattato come pick mancato. */
  picks: MatchdayPick[]
  /** Risultato di ogni squadra coinvolta in questa giornata. */
  outcomesByTeam: Record<string, Outcome>
  /** Slot il cui pick riguarda una partita segnata "esclusa" (vedi
   * `serie_a_fixtures.status` e `docs/02_Regole_gioco.md`): restano vivi a
   * prescindere dall'esito, senza contare né come vittoria né come
   * sconfitta. Chi chiama (vedi `submitMatchdayResults` in
   * `src/lib/queries.ts`) si occupa poi di liberare di nuovo la squadra
   * cancellando il pick, perché "non si considera usata". */
  exemptSlotIds?: string[]
}

export interface ApplyMatchdayResult {
  /** Cosa è successo, slot per slot, in questa giornata. */
  slotOutcomes: SlotOutcome[]
  /** Gli slot ancora vivi DOPO questa giornata (prima di un eventuale
   * spareggio: riflette semplicemente vittorie/sconfitte reali). */
  aliveSlotsAfter: AliveSlot[]
  /** true se questa giornata ha chiuso il torneo (o perché è rimasto un solo
   * giocatore, o per lo spareggio "zero superstiti"). */
  tournamentFinished: boolean
  /** playerId dei vincitori. Più di uno solo in caso di ex aequo. */
  winners: string[]
}

/**
 * Applica i risultati di una giornata a tutti gli slot ancora vivi.
 */
export function applyMatchdayResults(
  input: ApplyMatchdayInput
): ApplyMatchdayResult {
  const pickBySlot = new Map(input.picks.map((p) => [p.slotId, p.teamId]))
  const exempt = new Set(input.exemptSlotIds ?? [])

  const slotOutcomes: SlotOutcome[] = input.aliveSlotsBefore.map((slot) => {
    const teamId = pickBySlot.get(slot.slotId)

    if (exempt.has(slot.slotId)) {
      return {
        slotId: slot.slotId,
        playerId: slot.playerId,
        survived: true,
        reason: 'exempt',
        teamId,
      }
    }

    if (!teamId) {
      return {
        slotId: slot.slotId,
        playerId: slot.playerId,
        survived: false,
        reason: 'missed_pick',
      }
    }

    const outcome = input.outcomesByTeam[teamId]
    if (outcome === 'win') {
      return {
        slotId: slot.slotId,
        playerId: slot.playerId,
        survived: true,
        reason: 'won',
        teamId,
      }
    }

    return {
      slotId: slot.slotId,
      playerId: slot.playerId,
      survived: false,
      reason: outcome === 'draw' ? 'drew' : 'lost',
      teamId,
    }
  })

  const aliveSlotsAfter: AliveSlot[] = slotOutcomes
    .filter((o) => o.survived)
    .map((o) => ({ slotId: o.slotId, playerId: o.playerId }))

  // Spareggio "zero superstiti": se c'era ancora qualcuno in gara prima di
  // questa giornata ma nessuno slot sopravvive, il torneo finisce ex aequo
  // tra chi era ancora vivo, invece di lasciare il torneo senza vincitore.
  if (aliveSlotsAfter.length === 0 && input.aliveSlotsBefore.length > 0) {
    const winners = Array.from(
      new Set(input.aliveSlotsBefore.map((s) => s.playerId))
    )
    return { slotOutcomes, aliveSlotsAfter, tournamentFinished: true, winners }
  }

  // Vittoria "normale": un solo giocatore resta con almeno uno slot vivo.
  const remainingPlayers = new Set(aliveSlotsAfter.map((s) => s.playerId))
  if (remainingPlayers.size === 1 && input.aliveSlotsBefore.length > 0) {
    const remainingBefore = new Set(
      input.aliveSlotsBefore.map((s) => s.playerId)
    )
    // Il torneo finisce solo se PRIMA di questa giornata c'era più di un
    // giocatore in gara (altrimenti stava semplicemente continuando da solo).
    if (remainingBefore.size > 1) {
      return {
        slotOutcomes,
        aliveSlotsAfter,
        tournamentFinished: true,
        winners: Array.from(remainingPlayers),
      }
    }
  }

  return { slotOutcomes, aliveSlotsAfter, tournamentFinished: false, winners: [] }
}

/**
 * Le squadre che uno slot può ancora scegliere: tutte quelle disponibili nel
 * torneo tranne quelle già scelte in passato SU QUESTO slot (lo storico di
 * slot diversi non conta, per regolamento).
 */
export function teamsAvailableForSlot(
  allTeams: Team[],
  usedTeamIds: string[]
): Team[] {
  const used = new Set(usedTeamIds)
  return allTeams.filter((t) => !used.has(t.id))
}
