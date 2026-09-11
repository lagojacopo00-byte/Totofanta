import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveLivePicks, type LivePickPlayer } from '../live-picks'

const io: LivePickPlayer = {
  playerId: 'me',
  hidePicks: false,
  aliveSlots: 2,
  picks: [{ slotLabel: '1', teamName: 'Napoli' }],
}
const altro: LivePickPlayer = {
  playerId: 'altro',
  hidePicks: false,
  aliveSlots: 1,
  picks: [{ slotLabel: '1', teamName: 'Inter' }],
}

function resolve(
  players: LivePickPlayer[],
  opts: { viewerHidesPicks?: boolean; pickingOpen?: boolean } = {}
) {
  return resolveLivePicks({
    viewerPlayerId: 'me',
    viewerHidesPicks: opts.viewerHidesPicks ?? false,
    pickingOpen: opts.pickingOpen ?? true,
    players,
  })
}

test('a scelte aperte, senza nascondigli si vedono le scelte di tutti', () => {
  const result = resolve([io, altro])
  assert.deepEqual(result.get('altro'), {
    kind: 'visible',
    picks: [{ slotLabel: '1', teamName: 'Inter' }],
  })
})

test('chi nasconde le sue scelte non le mostra agli altri, ma si dice se ha schierato', () => {
  const result = resolve([io, { ...altro, hidePicks: true }])
  assert.deepEqual(result.get('altro'), { kind: 'hidden', by: 'them', hasPicked: true })
})

test('chi nasconde e non ha ancora schierato: nascosto, ma senza fingere che abbia schierato', () => {
  const result = resolve([io, { ...altro, hidePicks: true, picks: [] }])
  assert.deepEqual(result.get('altro'), { kind: 'hidden', by: 'them', hasPicked: false })
})

test('reciprocità: se nascondo le mie, non vedo quelle degli altri', () => {
  const result = resolve([{ ...io, hidePicks: true }, altro], { viewerHidesPicks: true })
  assert.deepEqual(result.get('altro'), { kind: 'hidden', by: 'me', hasPicked: true })
})

test('le proprie scelte si vedono sempre, anche nascoste agli altri', () => {
  const result = resolve([{ ...io, hidePicks: true }, altro], { viewerHidesPicks: true })
  assert.deepEqual(result.get('me'), {
    kind: 'visible',
    picks: [{ slotLabel: '1', teamName: 'Napoli' }],
  })
})

test('a scelte chiuse si scopre tutto, nascondigli compresi', () => {
  const result = resolve(
    [{ ...io, hidePicks: true }, { ...altro, hidePicks: true }],
    { viewerHidesPicks: true, pickingOpen: false }
  )
  assert.deepEqual(result.get('altro'), {
    kind: 'visible',
    picks: [{ slotLabel: '1', teamName: 'Inter' }],
  })
})

test('chi non ha ancora schierato, allo scoperto, risulta senza scelte', () => {
  const result = resolve([io, { ...altro, picks: [] }])
  assert.deepEqual(result.get('altro'), { kind: 'not-picked' })
})

test('chi è già fuori dal torneo non ha scelte da mostrare', () => {
  const result = resolve([io, { ...altro, aliveSlots: 0, picks: [] }])
  assert.deepEqual(result.get('altro'), { kind: 'out' })
})

test('un eliminato resta "fuori" anche se nasconde le scelte', () => {
  const result = resolve([io, { ...altro, aliveSlots: 0, picks: [], hidePicks: true }])
  assert.deepEqual(result.get('altro'), { kind: 'out' })
})
