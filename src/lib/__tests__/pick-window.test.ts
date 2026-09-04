import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeNextRoundReopenAt, computePickDeadline, isPickingWindowOpen } from '../pick-window'

test('computePickDeadline: la scadenza è il primo calcio d\'inizio tra le partite', () => {
  const deadline = computePickDeadline(
    [
      { kickoff_at: '2026-08-29T18:45:00Z', home_team: 'Sassuolo', away_team: 'Torino' },
      { kickoff_at: '2026-08-28T18:45:00Z', home_team: 'Atalanta', away_team: 'Bologna' },
      { kickoff_at: '2026-08-30T20:45:00Z', home_team: 'Lazio', away_team: 'Genoa' },
    ],
    new Set()
  )
  assert.equal(deadline?.toISOString(), '2026-08-28T18:45:00.000Z')
})

test('computePickDeadline: ignora le partite escluse', () => {
  const deadline = computePickDeadline(
    [
      { kickoff_at: '2026-08-28T18:45:00Z', home_team: 'Atalanta', away_team: 'Bologna' },
      { kickoff_at: '2026-08-29T18:45:00Z', home_team: 'Sassuolo', away_team: 'Torino' },
    ],
    new Set(['Atalanta', 'Bologna'])
  )
  assert.equal(deadline?.toISOString(), '2026-08-29T18:45:00.000Z')
})

test('computePickDeadline: null se nessuna partita non esclusa ha un orario noto', () => {
  assert.equal(
    computePickDeadline(
      [{ kickoff_at: null, home_team: 'Atalanta', away_team: 'Bologna' }],
      new Set()
    ),
    null
  )
  assert.equal(
    computePickDeadline(
      [{ kickoff_at: '2026-08-28T18:45:00Z', home_team: 'Atalanta', away_team: 'Bologna' }],
      new Set(['Atalanta', 'Bologna'])
    ),
    null
  )
  assert.equal(computePickDeadline([], new Set()), null)
})

test('isPickingWindowOpen: aperta prima della scadenza, chiusa dopo', () => {
  const deadline = new Date('2026-08-28T18:45:00Z')
  assert.equal(isPickingWindowOpen(deadline, new Date('2026-08-28T18:44:59Z')), true)
  assert.equal(isPickingWindowOpen(deadline, new Date('2026-08-28T18:45:00Z')), false)
  assert.equal(isPickingWindowOpen(deadline, new Date('2026-08-28T18:45:01Z')), false)
})

test('isPickingWindowOpen: sempre aperta senza una scadenza nota', () => {
  assert.equal(isPickingWindowOpen(null, new Date('2026-12-25T00:00:00Z')), true)
})

test('computeNextRoundReopenAt: punta alle 00:00 del martedì dopo il weekend, qualunque sia il giorno della scadenza', () => {
  // 2026-08-28 = venerdì, 29 = sabato, 30 = domenica, 31 = lunedì, 01/09 = martedì
  const cases = [
    new Date(2026, 7, 28, 18, 45), // scadenza di venerdì
    new Date(2026, 7, 29, 15, 0), // scadenza di sabato
    new Date(2026, 7, 30, 20, 45), // scadenza di domenica
    new Date(2026, 7, 31, 20, 45), // scadenza di lunedì
  ]
  for (const deadline of cases) {
    const reopenAt = computeNextRoundReopenAt(deadline)
    assert.equal(reopenAt.getFullYear(), 2026)
    assert.equal(reopenAt.getMonth(), 8) // settembre (0-indexed)
    assert.equal(reopenAt.getDate(), 1)
    assert.equal(reopenAt.getHours(), 0)
    assert.equal(reopenAt.getMinutes(), 0)
  }
})

test('computeNextRoundReopenAt: se la scadenza cade già di martedì, punta al martedì successivo', () => {
  const deadline = new Date(2026, 8, 1, 12, 0) // martedì 2026-09-01
  const reopenAt = computeNextRoundReopenAt(deadline)
  assert.equal(reopenAt.getFullYear(), 2026)
  assert.equal(reopenAt.getMonth(), 8)
  assert.equal(reopenAt.getDate(), 8)
  assert.equal(reopenAt.getHours(), 0)
})
