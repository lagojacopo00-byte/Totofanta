import { test } from 'node:test'
import assert from 'node:assert/strict'
import { matchTeamName, normalizeTeamName } from '../football-api'

const knownTeams = [
  'Atalanta', 'Bologna', 'Cagliari', 'Como', 'Fiorentina', 'Frosinone',
  'Genoa', 'Inter', 'Juventus', 'Lazio', 'Lecce', 'Milan', 'Monza',
  'Napoli', 'Parma', 'Roma', 'Sassuolo', 'Torino', 'Udinese', 'Venezia',
]

test('normalizeTeamName toglie prefissi societari, accenti e maiuscole', () => {
  assert.equal(normalizeTeamName('AC Milan'), 'milan')
  assert.equal(normalizeTeamName('AS Roma'), 'roma')
  assert.equal(normalizeTeamName('SSC Napoli'), 'napoli')
  assert.equal(normalizeTeamName('Hellas Verona'), 'verona')
  assert.equal(normalizeTeamName('Atalanta'), 'atalanta')
})

test('matchTeamName trova un nome esatto dopo normalizzazione', () => {
  assert.equal(matchTeamName('AC Milan', knownTeams), 'Milan')
  assert.equal(matchTeamName('Inter', knownTeams), 'Inter')
  assert.equal(matchTeamName('AS Roma', knownTeams), 'Roma')
})

test('matchTeamName usa il confronto "contiene" come ripiego', () => {
  // "internazionale milano" contiene "inter" come sottostringa: il
  // ripiego risolve un nome esteso che il confronto esatto non trova.
  assert.equal(matchTeamName('FC Internazionale Milano', knownTeams), 'Inter')
})

test('matchTeamName ritorna null se nessuna squadra nota combacia', () => {
  // "Verona" non è nell'elenco delle squadre note (non in Serie A nel
  // seed di schema.sql): né il confronto esatto né il ripiego trovano
  // nulla, a differenza del caso sopra dove "Inter" è nell'elenco.
  assert.equal(matchTeamName('Hellas Verona', knownTeams), null)
})

test('matchTeamName combacia con i nomi reali di football-data.org (verificati il 2026-09-02)', () => {
  assert.equal(matchTeamName('FC Internazionale Milano', knownTeams), 'Inter')
  assert.equal(matchTeamName('AC Monza', knownTeams), 'Monza')
  assert.equal(matchTeamName('AS Roma', knownTeams), 'Roma')
  assert.equal(matchTeamName('ACF Fiorentina', knownTeams), 'Fiorentina')
  assert.equal(matchTeamName('SS Lazio', knownTeams), 'Lazio')
  assert.equal(matchTeamName('SSC Napoli', knownTeams), 'Napoli')
  assert.equal(matchTeamName('US Sassuolo Calcio', knownTeams), 'Sassuolo')
  assert.equal(matchTeamName('US Lecce', knownTeams), 'Lecce')
  assert.equal(matchTeamName('AC Milan', knownTeams), 'Milan')
  assert.equal(matchTeamName('Parma Calcio 1913', knownTeams), 'Parma')
  assert.equal(matchTeamName('Cagliari Calcio', knownTeams), 'Cagliari')
  assert.equal(matchTeamName('Udinese Calcio', knownTeams), 'Udinese')
  assert.equal(matchTeamName('Como 1907', knownTeams), 'Como')
  assert.equal(matchTeamName('Genoa CFC', knownTeams), 'Genoa')
  assert.equal(matchTeamName('Torino FC', knownTeams), 'Torino')
  assert.equal(matchTeamName('Bologna FC 1909', knownTeams), 'Bologna')
  assert.equal(matchTeamName('Atalanta BC', knownTeams), 'Atalanta')
  assert.equal(matchTeamName('Frosinone Calcio', knownTeams), 'Frosinone')
  assert.equal(matchTeamName('Juventus FC', knownTeams), 'Juventus')
  assert.equal(matchTeamName('Venezia FC', knownTeams), 'Venezia')
})
