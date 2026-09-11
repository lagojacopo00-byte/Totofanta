import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveLivePicks, type LivePickPlayer } from '../live-picks'

const io: LivePickPlayer = {
  playerId: 'me',
  aliveSlots: 2,
  picks: [{ slotLabel: '1', teamName: 'Napoli' }],
}
const altro: LivePickPlayer = {
  playerId: 'altro',
  aliveSlots: 1,
  picks: [{ slotLabel: '1', teamName: 'Inter' }],
}

test('le scelte di tutti si vedono, anche a giornata aperta', () => {
  const result = resolveLivePicks([io, altro])
  assert.deepEqual(result.get('altro'), {
    kind: 'visible',
    picks: [{ slotLabel: '1', teamName: 'Inter' }],
  })
  assert.deepEqual(result.get('me'), {
    kind: 'visible',
    picks: [{ slotLabel: '1', teamName: 'Napoli' }],
  })
})

test('chi non ha ancora schierato risulta senza scelte', () => {
  const result = resolveLivePicks([io, { ...altro, picks: [] }])
  assert.deepEqual(result.get('altro'), { kind: 'not-picked' })
})

test('chi è già fuori dal torneo non ha scelte da mostrare', () => {
  const result = resolveLivePicks([io, { ...altro, aliveSlots: 0, picks: [] }])
  assert.deepEqual(result.get('altro'), { kind: 'out' })
})
