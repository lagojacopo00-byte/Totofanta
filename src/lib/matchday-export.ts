import ExcelJS from "exceljs";

/** Snapshot di UNO slot per il backup Excel di una giornata: la squadra
 * scelta in QUESTA giornata (null se lo slot era già eliminato prima, o
 * non ha scelto — vedi il commento sopra generateMatchdayBackup in
 * queries.ts) e lo stato dopo l'applicazione dei risultati. */
export interface BackupSlotSnapshot {
  label: string;
  teamName: string | null;
  status: "alive" | "eliminated";
}

export interface BackupPlayerSnapshot {
  displayName: string;
  slots: BackupSlotSnapshot[];
}

const ALIVE_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFC6EFCE" },
};
const ALIVE_FONT: Partial<ExcelJS.Font> = { color: { argb: "FF006100" } };
const ELIMINATED_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFFFC7CE" },
};
const ELIMINATED_FONT: Partial<ExcelJS.Font> = { color: { argb: "FF9C0006" } };

/** Costruisce il file Excel di backup di una giornata: colonne = giocatori,
 * righe = tutti gli slot disponibili (numerati 1..N, N = il massimo tra i
 * giocatori — le celle in eccesso per chi ne ha meno restano vuote). Ogni
 * cella mostra la squadra scelta in quella giornata (o "—" se lo slot non
 * ha una scelta per questa giornata: già eliminato prima, o mancata
 * scelta) colorata di verde/rosso secondo lo stato dello slot dopo questa
 * giornata — pensato per poter ricostruire il torneo a mano se il sito
 * perdesse dati (vedi tournaments.auto_backup_matchdays). Pura funzione di
 * libreria, nessuna dipendenza dal database: chi chiama passa già i dati
 * letti (stesso pattern di game-logic.ts/football-api.ts). */
export async function buildMatchdayBackupXlsx(
  matchdayNumber: number,
  players: BackupPlayerSnapshot[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(`Giornata ${matchdayNumber}`);

  const maxSlots = players.reduce((max, p) => Math.max(max, p.slots.length), 0);

  sheet.getColumn(1).width = 10;
  players.forEach((_, i) => {
    sheet.getColumn(i + 2).width = 22;
  });

  const headerRow = sheet.addRow(["Slot", ...players.map((p) => p.displayName)]);
  headerRow.font = { bold: true };

  for (let i = 0; i < maxSlots; i++) {
    const rowValues: (string | number)[] = [i + 1];
    const cellSlots: (BackupSlotSnapshot | null)[] = [];
    for (const player of players) {
      const slot = player.slots[i] ?? null;
      cellSlots.push(slot);
      rowValues.push(slot ? (slot.teamName ?? "—") : "");
    }

    const row = sheet.addRow(rowValues);
    cellSlots.forEach((slot, colIndex) => {
      if (!slot) return;
      const cell = row.getCell(colIndex + 2);
      if (slot.status === "alive") {
        cell.fill = ALIVE_FILL;
        cell.font = ALIVE_FONT;
      } else {
        cell.fill = ELIMINATED_FILL;
        cell.font = ELIMINATED_FONT;
      }
    });
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
