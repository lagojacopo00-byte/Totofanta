import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  applyMatchdayResults,
  computeFinalPrizeShares,
  computeRoundOutcomes,
  computeTeamOutcomes,
  teamsAvailableForSlot,
  type FinalStandingPlayer,
  type RoundFixture,
  type Team,
} from '../game-logic'

test('uno slot che vince sopravvive', () => {
  const result = applyMatchdayResults({
    aliveSlotsBefore: [{ slotId: 's1', playerId: 'p1' }],
    picks: [{ slotId: 's1', teamId: 'napoli' }],
    outcomesByTeam: { napoli: 'win' },
  })

  assert.equal(result.slotOutcomes[0].survived, true)
  assert.equal(result.slotOutcomes[0].reason, 'won')
  assert.deepEqual(result.aliveSlotsAfter, [{ slotId: 's1', playerId: 'p1' }])
  assert.equal(result.tournamentFinished, false)
})

test('pareggio e sconfitta eliminano lo slot', () => {
  const draw = applyMatchdayResults({
    aliveSlotsBefore: [{ slotId: 's1', playerId: 'p1' }],
    picks: [{ slotId: 's1', teamId: 'lazio' }],
    outcomesByTeam: { lazio: 'draw' },
  })
  assert.equal(draw.slotOutcomes[0].survived, false)
  assert.equal(draw.slotOutcomes[0].reason, 'drew')

  const loss = applyMatchdayResults({
    aliveSlotsBefore: [{ slotId: 's1', playerId: 'p1' }],
    picks: [{ slotId: 's1', teamId: 'lazio' }],
    outcomesByTeam: { lazio: 'loss' },
  })
  assert.equal(loss.slotOutcomes[0].survived, false)
  assert.equal(loss.slotOutcomes[0].reason, 'lost')
})

test('pick mancato elimina lo slot', () => {
  const result = applyMatchdayResults({
    aliveSlotsBefore: [{ slotId: 's1', playerId: 'p1' }],
    picks: [],
    outcomesByTeam: {},
  })
  assert.equal(result.slotOutcomes[0].survived, false)
  assert.equal(result.slotOutcomes[0].reason, 'missed_pick')
})

test('uno slot esente resta vivo a prescindere dall\'esito (partita esclusa)', () => {
  // Slot esentato perché la squadra scelta gioca una partita segnata
  // "esclusa" (rinvio fuori finestra, tavolino non ancora deciso, ecc.):
  // deve sopravvivere anche se c'è (o non c'è) un esito per quella squadra.
  const withOutcome = applyMatchdayResults({
    aliveSlotsBefore: [{ slotId: 's1', playerId: 'p1' }],
    picks: [{ slotId: 's1', teamId: 'lazio' }],
    outcomesByTeam: { lazio: 'loss' },
    exemptSlotIds: ['s1'],
  })
  assert.equal(withOutcome.slotOutcomes[0].survived, true)
  assert.equal(withOutcome.slotOutcomes[0].reason, 'exempt')
  assert.deepEqual(withOutcome.aliveSlotsAfter, [{ slotId: 's1', playerId: 'p1' }])

  const withoutOutcome = applyMatchdayResults({
    aliveSlotsBefore: [{ slotId: 's1', playerId: 'p1' }],
    picks: [{ slotId: 's1', teamId: 'lazio' }],
    outcomesByTeam: {},
    exemptSlotIds: ['s1'],
  })
  assert.equal(withoutOutcome.slotOutcomes[0].survived, true)
  assert.equal(withoutOutcome.slotOutcomes[0].reason, 'exempt')
})

test('gli slot dello stesso giocatore sono indipendenti', () => {
  // Napoli con tutti e 3 gli slot (esempio dal regolamento): vince, tutti
  // e 3 gli slot restano vivi.
  const g1 = applyMatchdayResults({
    aliveSlotsBefore: [
      { slotId: 'A', playerId: 'p1' },
      { slotId: 'B', playerId: 'p1' },
      { slotId: 'C', playerId: 'p1' },
    ],
    picks: [
      { slotId: 'A', teamId: 'napoli' },
      { slotId: 'B', teamId: 'napoli' },
      { slotId: 'C', teamId: 'napoli' },
    ],
    outcomesByTeam: { napoli: 'win' },
  })
  assert.equal(g1.aliveSlotsAfter.length, 3)

  // Giornata 2: Milan su A e B, Lazio su C. Milan vince, Lazio no.
  const g2 = applyMatchdayResults({
    aliveSlotsBefore: g1.aliveSlotsAfter,
    picks: [
      { slotId: 'A', teamId: 'milan' },
      { slotId: 'B', teamId: 'milan' },
      { slotId: 'C', teamId: 'lazio' },
    ],
    outcomesByTeam: { milan: 'win', lazio: 'loss' },
  })
  assert.equal(g2.aliveSlotsAfter.length, 2)
  assert.deepEqual(
    g2.aliveSlotsAfter.map((s) => s.slotId).sort(),
    ['A', 'B']
  )
})

test('zero superstiti nella stessa giornata: vincono tutti ex aequo', () => {
  const result = applyMatchdayResults({
    aliveSlotsBefore: [
      { slotId: 's1', playerId: 'p1' },
      { slotId: 's2', playerId: 'p2' },
      { slotId: 's3', playerId: 'p2' }, // p2 ha 2 slot ancora vivi
    ],
    picks: [
      { slotId: 's1', teamId: 'lazio' },
      { slotId: 's2', teamId: 'torino' },
      { slotId: 's3', teamId: 'genoa' },
    ],
    outcomesByTeam: { lazio: 'loss', torino: 'draw', genoa: 'loss' },
  })

  assert.equal(result.tournamentFinished, true)
  assert.deepEqual(result.winners.sort(), ['p1', 'p2'])
  assert.equal(result.aliveSlotsAfter.length, 0)
})

test('resta un solo giocatore con slot vivi: il torneo finisce, lui vince', () => {
  const result = applyMatchdayResults({
    aliveSlotsBefore: [
      { slotId: 's1', playerId: 'p1' },
      { slotId: 's2', playerId: 'p2' },
    ],
    picks: [
      { slotId: 's1', teamId: 'napoli' },
      { slotId: 's2', teamId: 'torino' },
    ],
    outcomesByTeam: { napoli: 'win', torino: 'loss' },
  })

  assert.equal(result.tournamentFinished, true)
  assert.deepEqual(result.winners, ['p1'])
})

test('teamsAvailableForSlot esclude solo le squadre già usate su quello slot', () => {
  const teams: Team[] = [
    { id: 'napoli', name: 'Napoli' },
    { id: 'milan', name: 'Milan' },
    { id: 'lazio', name: 'Lazio' },
  ]
  const available = teamsAvailableForSlot(teams, ['napoli'])
  assert.deepEqual(
    available.map((t) => t.id),
    ['milan', 'lazio']
  )
})

test('computeRoundOutcomes: giornata senza nessuna partita non è mai pronta', () => {
  const result = computeRoundOutcomes([])
  assert.equal(result.ready, false)
  assert.equal(result.outcomeByTeamName.size, 0)
})

test('computeRoundOutcomes: manca anche un solo esito -> non pronta', () => {
  const fixtures: RoundFixture[] = [
    { home_team: 'Napoli', away_team: 'Milan', status: 'scheduled', result: 'home_win' },
    { home_team: 'Roma', away_team: 'Lazio', status: 'scheduled', result: null },
  ]
  assert.equal(computeRoundOutcomes(fixtures).ready, false)
})

test('computeRoundOutcomes: le partite escluse non contano, né per la prontezza né per gli esiti', () => {
  const fixtures: RoundFixture[] = [
    { home_team: 'Napoli', away_team: 'Milan', status: 'scheduled', result: 'home_win' },
    { home_team: 'Roma', away_team: 'Lazio', status: 'excluded', result: null },
  ]
  const outcomes = computeRoundOutcomes(fixtures)
  assert.equal(outcomes.ready, true)
  assert.equal(outcomes.outcomeByTeamName.has('Roma'), false)
  assert.equal(outcomes.outcomeByTeamName.has('Lazio'), false)
})

test('computeRoundOutcomes: tutte partite escluse -> non pronta (niente su cui basarsi)', () => {
  const fixtures: RoundFixture[] = [
    { home_team: 'Napoli', away_team: 'Milan', status: 'excluded', result: null },
  ]
  assert.equal(computeRoundOutcomes(fixtures).ready, false)
})

test('computeRoundOutcomes: home_win, away_win e draw danno gli esiti giusti a entrambe le squadre', () => {
  const fixtures: RoundFixture[] = [
    { home_team: 'Napoli', away_team: 'Milan', status: 'scheduled', result: 'home_win' },
    { home_team: 'Roma', away_team: 'Lazio', status: 'scheduled', result: 'away_win' },
    { home_team: 'Inter', away_team: 'Juventus', status: 'scheduled', result: 'draw' },
  ]
  const { ready, outcomeByTeamName } = computeRoundOutcomes(fixtures)
  assert.equal(ready, true)
  assert.equal(outcomeByTeamName.get('Napoli'), 'win')
  assert.equal(outcomeByTeamName.get('Milan'), 'loss')
  assert.equal(outcomeByTeamName.get('Roma'), 'loss')
  assert.equal(outcomeByTeamName.get('Lazio'), 'win')
  assert.equal(outcomeByTeamName.get('Inter'), 'draw')
  assert.equal(outcomeByTeamName.get('Juventus'), 'draw')
})

test('computeTeamOutcomes: a differenza di computeRoundOutcomes, ritorna gli esiti già noti anche a giornata non completa', () => {
  const fixtures: RoundFixture[] = [
    { home_team: 'Napoli', away_team: 'Milan', status: 'scheduled', result: 'home_win' },
    { home_team: 'Roma', away_team: 'Lazio', status: 'scheduled', result: null },
  ]
  const outcomes = computeTeamOutcomes(fixtures)
  assert.equal(outcomes.get('Napoli'), 'win')
  assert.equal(outcomes.get('Milan'), 'loss')
  assert.equal(outcomes.has('Roma'), false)
  assert.equal(outcomes.has('Lazio'), false)
})

test('computeTeamOutcomes: ignora le partite escluse anche se hanno un risultato', () => {
  const fixtures: RoundFixture[] = [
    { home_team: 'Napoli', away_team: 'Milan', status: 'excluded', result: 'home_win' },
  ]
  const outcomes = computeTeamOutcomes(fixtures)
  assert.equal(outcomes.size, 0)
})

test('computeFinalPrizeShares: vittoria normale, il vincitore prende tutto (100%)', () => {
  const standings: FinalStandingPlayer[] = [
    {
      id: 'p1',
      slots: [
        { status: 'alive', eliminatedMatchday: null },
        { status: 'alive', eliminatedMatchday: null },
      ],
    },
    {
      id: 'p2',
      // Eliminato in una giornata precedente: non conta più, anche se
      // "eliminated" come gli slot dell'eventuale spareggio.
      slots: [{ status: 'eliminated', eliminatedMatchday: 3 }],
    },
  ]
  const shares = computeFinalPrizeShares(standings, ['p1'], 5)
  assert.deepEqual(shares, [{ playerId: 'p1', share: 1 }])
})

test('computeFinalPrizeShares: spareggio ex aequo, la quota di ognuno è proporzionale agli slot in corsa', () => {
  // Esempio concreto dell'utente: torneo da 10 slot totali, due giocatori
  // ancora in corsa escono insieme sulla stessa giornata (spareggio "zero
  // superstiti") con 6 e 4 slot rispettivamente -> 60%/40%, non 50/50.
  const standings: FinalStandingPlayer[] = [
    {
      id: 'p1',
      slots: Array.from({ length: 6 }, () => ({
        status: 'eliminated' as const,
        eliminatedMatchday: 7,
      })),
    },
    {
      id: 'p2',
      slots: Array.from({ length: 4 }, () => ({
        status: 'eliminated' as const,
        eliminatedMatchday: 7,
      })),
    },
  ]
  const shares = computeFinalPrizeShares(standings, ['p1', 'p2'], 7)
  assert.deepEqual(
    shares.find((s) => s.playerId === 'p1'),
    { playerId: 'p1', share: 0.6 }
  )
  assert.deepEqual(
    shares.find((s) => s.playerId === 'p2'),
    { playerId: 'p2', share: 0.4 }
  )
})

test('computeFinalPrizeShares: slot eliminati in una giornata precedente a quella decisiva non contano', () => {
  const standings: FinalStandingPlayer[] = [
    {
      id: 'p1',
      slots: [
        { status: 'eliminated', eliminatedMatchday: 7 }, // nello spareggio
        { status: 'eliminated', eliminatedMatchday: 7 }, // nello spareggio
        { status: 'eliminated', eliminatedMatchday: 4 }, // morto prima, non conta
      ],
    },
    {
      id: 'p2',
      slots: [{ status: 'eliminated', eliminatedMatchday: 7 }],
    },
  ]
  const shares = computeFinalPrizeShares(standings, ['p1', 'p2'], 7)
  assert.equal(shares.find((s) => s.playerId === 'p1')?.share, 2 / 3)
})

test('computeFinalPrizeShares: nessuno slot dei vincitori trovato -> array vuoto', () => {
  const shares = computeFinalPrizeShares([], ['p1'], 5)
  assert.deepEqual(shares, [])
})
