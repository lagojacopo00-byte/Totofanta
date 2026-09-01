import { test } from 'node:test'
import assert from 'node:assert/strict'
import { solveSlotAssignment, maxAssignableForTeam } from '../slot-assignment'

test('assegna più slot alla stessa squadra se tutti la possono giocare', () => {
  const slots = [
    { slotId: 's1', eligibleTeamIds: ['atalanta', 'bologna'] },
    { slotId: 's2', eligibleTeamIds: ['atalanta', 'bologna'] },
  ]
  const result = solveSlotAssignment(slots, { atalanta: 2 })
  assert.deepEqual(result, { s1: 'atalanta', s2: 'atalanta' })
})

test('nessuna richiesta -> assegnazione vuota', () => {
  const slots = [{ slotId: 's1', eligibleTeamIds: ['atalanta'] }]
  assert.deepEqual(solveSlotAssignment(slots, {}), {})
  assert.deepEqual(solveSlotAssignment(slots, { atalanta: 0 }), {})
})

test('più richieste totali degli slot disponibili -> null', () => {
  const slots = [{ slotId: 's1', eligibleTeamIds: ['atalanta'] }]
  assert.equal(solveSlotAssignment(slots, { atalanta: 2 }), null)
})

test('squadra senza nessuno slot idoneo -> null', () => {
  const slots = [{ slotId: 's1', eligibleTeamIds: ['bologna'] }]
  assert.equal(solveSlotAssignment(slots, { atalanta: 1 }), null)
})

test('richiede uno scambio tra slot per riuscire (non basta un greedy)', () => {
  // s1 può giocare sia Atalanta che Bologna, s2 SOLO Atalanta.
  // Un greedy che assegna Atalanta a s1 per primo bloccherebbe Bologna
  // (a s2 non è consentita): serve spostare Atalanta su s2 e liberare s1
  // per Bologna.
  const slots = [
    { slotId: 's1', eligibleTeamIds: ['atalanta', 'bologna'] },
    { slotId: 's2', eligibleTeamIds: ['atalanta'] },
  ]
  const result = solveSlotAssignment(slots, { atalanta: 1, bologna: 1 })
  assert.notEqual(result, null)
  assert.equal(result!.s2, 'atalanta')
  assert.equal(result!.s1, 'bologna')
})

test('rispetta i conteggi esatti su più squadre insieme', () => {
  const slots = [
    { slotId: 's1', eligibleTeamIds: ['atalanta', 'bologna', 'cagliari'] },
    { slotId: 's2', eligibleTeamIds: ['atalanta', 'bologna', 'cagliari'] },
    { slotId: 's3', eligibleTeamIds: ['atalanta', 'bologna', 'cagliari'] },
    { slotId: 's4', eligibleTeamIds: ['atalanta', 'bologna', 'cagliari'] },
    { slotId: 's5', eligibleTeamIds: ['atalanta', 'bologna', 'cagliari'] },
  ]
  const result = solveSlotAssignment(slots, { atalanta: 2, cagliari: 3 })
  assert.notEqual(result, null)
  const counts = Object.values(result!).reduce<Record<string, number>>((acc, t) => {
    acc[t] = (acc[t] ?? 0) + 1
    return acc
  }, {})
  assert.deepEqual(counts, { atalanta: 2, cagliari: 3 })
  assert.equal(Object.keys(result!).length, 5)
})

test('non assegna mai uno slot a una squadra fuori dal suo elenco idoneo', () => {
  const slots = [
    { slotId: 's1', eligibleTeamIds: ['atalanta'] },
    { slotId: 's2', eligibleTeamIds: ['bologna'] },
  ]
  const result = solveSlotAssignment(slots, { atalanta: 1, bologna: 1 })
  assert.deepEqual(result, { s1: 'atalanta', s2: 'bologna' })
})

test('maxAssignableForTeam: senza altre richieste, il massimo è quanti slot la possono giocare', () => {
  const slots = [
    { slotId: 's1', eligibleTeamIds: ['atalanta'] },
    { slotId: 's2', eligibleTeamIds: ['atalanta'] },
    { slotId: 's3', eligibleTeamIds: ['atalanta'] },
  ]
  assert.equal(maxAssignableForTeam(slots, {}, 'atalanta'), 3)
})

test('maxAssignableForTeam: squadra senza nessuno slot idoneo -> 0', () => {
  const slots = [{ slotId: 's1', eligibleTeamIds: ['bologna'] }]
  assert.equal(maxAssignableForTeam(slots, {}, 'atalanta'), 0)
})

test('maxAssignableForTeam: tiene conto delle richieste già impegnate su altre squadre', () => {
  // atalanta può giocare su tutti e 3, bologna SOLO su s3: se bologna
  // vuole 1 slot, quello slot le va riservato, e ad atalanta ne restano 2.
  const slots = [
    { slotId: 's1', eligibleTeamIds: ['atalanta'] },
    { slotId: 's2', eligibleTeamIds: ['atalanta'] },
    { slotId: 's3', eligibleTeamIds: ['atalanta', 'bologna'] },
  ]
  assert.equal(maxAssignableForTeam(slots, { bologna: 1 }, 'atalanta'), 2)
})

test('maxAssignableForTeam: ignora il conteggio attuale della squadra stessa in desiredCounts', () => {
  const slots = [
    { slotId: 's1', eligibleTeamIds: ['atalanta'] },
    { slotId: 's2', eligibleTeamIds: ['atalanta'] },
  ]
  // Il "5" per atalanta qui dentro deve essere ignorato, non sommato.
  assert.equal(maxAssignableForTeam(slots, { atalanta: 5 }, 'atalanta'), 2)
})
