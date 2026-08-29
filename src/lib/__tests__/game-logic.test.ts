import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  applyMatchdayResults,
  teamsAvailableForSlot,
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
