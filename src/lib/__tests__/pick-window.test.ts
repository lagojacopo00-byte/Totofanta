import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computePickDeadline, isPickingWindowOpen } from '../pick-window'

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
