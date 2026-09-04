import { test } from 'node:test'
import assert from 'node:assert/strict'
import ExcelJS from 'exceljs'
import { buildStoricoSheet, type StoricoPlayerHistory } from '../matchday-export'

// exceljs porta con sé i tipi di una versione di @types/node più vecchia
// di quella del progetto, il cui Buffer generico non combacia più
// strutturalmente: cast isolato qui invece che a ogni chiamata di load().
async function buildAndLoad(
  matchdayNumbers: number[],
  players: StoricoPlayerHistory[]
): Promise<ExcelJS.Worksheet> {
  const workbook = new ExcelJS.Workbook()
  buildStoricoSheet(workbook, matchdayNumbers, players)
  const buffer = Buffer.from(await workbook.xlsx.writeBuffer())
  const reloaded = new ExcelJS.Workbook()
  await reloaded.xlsx.load(buffer as unknown as Parameters<typeof reloaded.xlsx.load>[0])
  return reloaded.getWorksheet('Storico')!
}

test('buildStoricoSheet: intestazione con giocatore, slot e una colonna per giornata', async () => {
  const sheet = await buildAndLoad([1, 2], [
    { displayName: 'Anna', slots: [{ label: '1', eliminatedMatchday: null, picksByMatchday: new Map([[1, 'Napoli'], [2, 'Inter']]) }] },
  ])
  const row = sheet.getRow(1)
  assert.equal(row.getCell(1).value, 'giocatore')
  assert.equal(row.getCell(2).value, 'slot')
  assert.equal(row.getCell(3).value, 'giornata 1')
  assert.equal(row.getCell(4).value, 'giornata 2')
})

test('buildStoricoSheet: una riga per slot, nome giocatore solo sulla prima', async () => {
  const sheet = await buildAndLoad([1], [
    {
      displayName: 'Anna',
      slots: [
        { label: '1', eliminatedMatchday: null, picksByMatchday: new Map([[1, 'Napoli']]) },
        { label: '2', eliminatedMatchday: 1, picksByMatchday: new Map([[1, 'Inter']]) },
      ],
    },
  ])
  assert.equal(sheet.getRow(2).getCell(1).value, 'Anna')
  assert.equal(sheet.getRow(2).getCell(2).value, 1)
  assert.equal(sheet.getRow(2).getCell(3).value, 'Napoli')
  assert.equal(sheet.getRow(3).getCell(1).value, '')
  assert.equal(sheet.getRow(3).getCell(2).value, 2)
  assert.equal(sheet.getRow(3).getCell(3).value, 'Inter')
})

test('buildStoricoSheet: colora verde uno slot vivo e rosso la giornata in cui viene eliminato', async () => {
  const sheet = await buildAndLoad([1], [
    {
      displayName: 'Anna',
      slots: [
        { label: '1', eliminatedMatchday: null, picksByMatchday: new Map([[1, 'Napoli']]) },
        { label: '2', eliminatedMatchday: 1, picksByMatchday: new Map([[1, 'Inter']]) },
      ],
    },
  ])
  const aliveCell = sheet.getRow(2).getCell(3)
  const eliminatedCell = sheet.getRow(3).getCell(3)
  assert.equal((aliveCell.fill as ExcelJS.FillPattern).fgColor?.argb, 'FFC6EFCE')
  assert.equal((eliminatedCell.fill as ExcelJS.FillPattern).fgColor?.argb, 'FFFFC7CE')
})

test('buildStoricoSheet: le giornate dopo l\'eliminazione restano bianche, senza dato', async () => {
  const sheet = await buildAndLoad([1, 2, 3], [
    {
      displayName: 'Anna',
      slots: [{ label: '1', eliminatedMatchday: 1, picksByMatchday: new Map([[1, 'Inter']]) }],
    },
  ])
  const row = sheet.getRow(2)
  assert.equal(row.getCell(3).value, 'Inter') // giornata 1: eliminato qui
  assert.equal(row.getCell(4).value, '') // giornata 2: già fuori, niente
  assert.equal(row.getCell(5).value, '') // giornata 3: già fuori, niente
  assert.equal(row.getCell(4).fill, undefined)
})

test('buildStoricoSheet: giornata senza scelta mostra "—" colorato secondo lo stato', async () => {
  const sheet = await buildAndLoad([1], [
    { displayName: 'Anna', slots: [{ label: '1', eliminatedMatchday: 1, picksByMatchday: new Map([[1, null]]) }] },
  ])
  const cell = sheet.getRow(2).getCell(3)
  assert.equal(cell.value, '—')
  assert.equal((cell.fill as ExcelJS.FillPattern).fgColor?.argb, 'FFFFC7CE')
})

test('buildStoricoSheet: una riga vuota separa i giocatori', async () => {
  const sheet = await buildAndLoad([1], [
    { displayName: 'Anna', slots: [{ label: '1', eliminatedMatchday: null, picksByMatchday: new Map([[1, 'Napoli']]) }] },
    { displayName: 'Beppe', slots: [{ label: '1', eliminatedMatchday: null, picksByMatchday: new Map([[1, 'Roma']]) }] },
  ])
  assert.equal(sheet.getRow(2).getCell(1).value, 'Anna')
  assert.equal(sheet.getRow(3).getCell(1).value, null)
  assert.equal(sheet.getRow(3).getCell(2).value, null)
  assert.equal(sheet.getRow(4).getCell(1).value, 'Beppe')
})

test('buildStoricoSheet: rigenerare sostituisce il foglio Storico, non lo duplica', () => {
  const workbook = new ExcelJS.Workbook()
  buildStoricoSheet(workbook, [1], [
    { displayName: 'Anna', slots: [{ label: '1', eliminatedMatchday: null, picksByMatchday: new Map([[1, 'Napoli']]) }] },
  ])
  buildStoricoSheet(workbook, [1, 2], [
    { displayName: 'Anna', slots: [{ label: '1', eliminatedMatchday: null, picksByMatchday: new Map([[1, 'Napoli'], [2, 'Milan']]) }] },
  ])
  assert.deepEqual(workbook.worksheets.map((s) => s.name), ['Storico'])
  assert.equal(workbook.getWorksheet('Storico')!.getRow(2).getCell(4).value, 'Milan')
})
