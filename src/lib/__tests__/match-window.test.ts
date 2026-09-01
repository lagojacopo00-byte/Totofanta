import { test } from 'node:test'
import assert from 'node:assert/strict'
import { groupFixturesByDay, isWithinMatchWindow, matchDayGroupOf } from '../match-window'

test('isWithinMatchWindow accetta solo venerdì-lunedì', () => {
  // 2026-08-28 è un venerdì, 2026-08-31 un lunedì, 2026-09-01 un martedì.
  assert.equal(isWithinMatchWindow(new Date('2026-08-28T18:00:00')), true) // ven
  assert.equal(isWithinMatchWindow(new Date('2026-08-29T15:00:00')), true) // sab
  assert.equal(isWithinMatchWindow(new Date('2026-08-30T20:45:00')), true) // dom
  assert.equal(isWithinMatchWindow(new Date('2026-08-31T20:45:00')), true) // lun
  assert.equal(isWithinMatchWindow(new Date('2026-09-01T20:45:00')), false) // mar
})

test('matchDayGroupOf etichetta il giorno giusto', () => {
  assert.equal(matchDayGroupOf(new Date('2026-08-28T18:00:00')), 'venerdì')
  assert.equal(matchDayGroupOf(new Date('2026-08-29T15:00:00')), 'sabato')
  assert.equal(matchDayGroupOf(new Date('2026-08-30T20:45:00')), 'domenica')
  assert.equal(matchDayGroupOf(new Date('2026-08-31T20:45:00')), 'lunedì')
  assert.equal(matchDayGroupOf(new Date('2026-09-01T20:45:00')), 'altro')
})

test('groupFixturesByDay raggruppa e ordina cronologicamente', () => {
  const groups = groupFixturesByDay([
    { id: 'a', kickoff_at: '2026-08-29T18:00:00Z' }, // sab 18
    { id: 'b', kickoff_at: '2026-08-28T18:00:00Z' }, // ven 18
    { id: 'c', kickoff_at: '2026-08-29T12:30:00Z' }, // sab 12:30 (prima di a)
    { id: 'd', kickoff_at: null }, // senza data -> "altro"
    { id: 'e', kickoff_at: '2026-09-02T20:45:00Z' }, // mercoledì -> "altro"
  ])

  assert.deepEqual(
    groups.map((g) => g.group),
    ['venerdì', 'sabato', 'altro']
  )
  assert.deepEqual(
    groups.find((g) => g.group === 'sabato')?.fixtures.map((f) => f.id),
    ['c', 'a']
  )
  assert.deepEqual(
    groups.find((g) => g.group === 'altro')?.fixtures.map((f) => f.id).sort(),
    ['d', 'e']
  )
})

test('groupFixturesByDay non genera gruppi vuoti', () => {
  const groups = groupFixturesByDay([{ id: 'a', kickoff_at: '2026-08-28T18:00:00Z' }])
  assert.deepEqual(
    groups.map((g) => g.group),
    ['venerdì']
  )
})
