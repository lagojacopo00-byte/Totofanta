import { test } from 'node:test'
import assert from 'node:assert/strict'
import ExcelJS from 'exceljs'
import { buildMatchdayBackupXlsx } from '../matchday-export'

// exceljs porta con sé i tipi di una versione di @types/node più vecchia
// di quella del progetto, il cui Buffer generico non combacia più
// strutturalmente: cast isolato qui invece che a ogni chiamata di load().
async function loadWorkbook(buffer: Buffer): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0])
  return workbook
}

test('buildMatchdayBackupXlsx: intestazione con "Slot" + nomi giocatori', async () => {
  const buffer = await buildMatchdayBackupXlsx(3, [
    { displayName: 'Anna', slots: [{ label: '1', teamName: 'Napoli', status: 'alive' }] },
    { displayName: 'Beppe', slots: [{ label: '1', teamName: 'Inter', status: 'eliminated' }] },
  ])
  const workbook = await loadWorkbook(buffer)
  const sheet = workbook.getWorksheet('Giornata 3')!
  const row = sheet.getRow(1)
  assert.equal(row.getCell(1).value, 'Slot')
  assert.equal(row.getCell(2).value, 'Anna')
  assert.equal(row.getCell(3).value, 'Beppe')
})

test('buildMatchdayBackupXlsx: una riga per ogni slot, celle con la squadra scelta', async () => {
  const buffer = await buildMatchdayBackupXlsx(1, [
    {
      displayName: 'Anna',
      slots: [
        { label: '1', teamName: 'Napoli', status: 'alive' },
        { label: '2', teamName: 'Inter', status: 'eliminated' },
      ],
    },
  ])
  const workbook = await loadWorkbook(buffer)
  const sheet = workbook.getWorksheet('Giornata 1')!
  assert.equal(sheet.getRow(2).getCell(1).value, 1)
  assert.equal(sheet.getRow(2).getCell(2).value, 'Napoli')
  assert.equal(sheet.getRow(3).getCell(1).value, 2)
  assert.equal(sheet.getRow(3).getCell(2).value, 'Inter')
})

test('buildMatchdayBackupXlsx: colora verde uno slot vivo e rosso uno eliminato', async () => {
  const buffer = await buildMatchdayBackupXlsx(1, [
    {
      displayName: 'Anna',
      slots: [
        { label: '1', teamName: 'Napoli', status: 'alive' },
        { label: '2', teamName: 'Inter', status: 'eliminated' },
      ],
    },
  ])
  const workbook = await loadWorkbook(buffer)
  const sheet = workbook.getWorksheet('Giornata 1')!
  const aliveCell = sheet.getRow(2).getCell(2)
  const eliminatedCell = sheet.getRow(3).getCell(2)
  assert.equal((aliveCell.fill as ExcelJS.FillPattern).fgColor?.argb, 'FFC6EFCE')
  assert.equal((eliminatedCell.fill as ExcelJS.FillPattern).fgColor?.argb, 'FFFFC7CE')
})

test('buildMatchdayBackupXlsx: celle vuote (—) e senza colore per slot senza scelta', async () => {
  const buffer = await buildMatchdayBackupXlsx(1, [
    { displayName: 'Anna', slots: [{ label: '1', teamName: null, status: 'eliminated' }] },
  ])
  const workbook = await loadWorkbook(buffer)
  const sheet = workbook.getWorksheet('Giornata 1')!
  assert.equal(sheet.getRow(2).getCell(2).value, '—')
})

test('buildMatchdayBackupXlsx: righe fino al numero massimo di slot tra i giocatori, celle vuote per chi ne ha meno', async () => {
  const buffer = await buildMatchdayBackupXlsx(1, [
    {
      displayName: 'Anna',
      slots: [
        { label: '1', teamName: 'Napoli', status: 'alive' },
        { label: '2', teamName: 'Roma', status: 'alive' },
      ],
    },
    { displayName: 'Beppe', slots: [{ label: '1', teamName: 'Inter', status: 'alive' }] },
  ])
  const workbook = await loadWorkbook(buffer)
  const sheet = workbook.getWorksheet('Giornata 1')!
  assert.equal(sheet.rowCount, 3) // intestazione + 2 righe slot
  assert.equal(sheet.getRow(3).getCell(3).value, '') // Beppe non ha lo slot 2
})
