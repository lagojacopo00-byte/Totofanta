import ExcelJS from "exceljs";

/** Storia di UNO slot per il foglio "Storico" del backup Excel del
 * torneo: la squadra scelta in OGNI giornata già chiusa (chiave = numero
 * giornata; null = nessuna scelta per quella giornata, mostrata come
 * "—"), e l'eventuale giornata in cui lo slot è stato eliminato (null =
 * ancora vivo). Le giornate successive all'eliminazione non hanno una
 * entry in picksByMatchday: lo slot non gioca più, la cella resta
 * bianca invece di ripetere un "—" rosso ogni volta — vedi
 * buildStoricoSheet più sotto. */
export interface StoricoSlotHistory {
  label: string;
  eliminatedMatchday: number | null;
  picksByMatchday: Map<number, string | null>;
}

export interface StoricoPlayerHistory {
  displayName: string;
  slots: StoricoSlotHistory[];
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

/**
 * Il foglio "Storico" del backup Excel di un torneo: una riga per ogni
 * slot di ogni giocatore (non una per giornata come nel vecchio formato
 * a più fogli — deciso con l'utente il 2026-09-04, che voleva vedere
 * tutto lo storico di uno slot su una riga sola invece di aprire un
 * foglio diverso per ogni giornata), con una colonna per ogni giornata
 * già chiusa: la squadra scelta lì, colorata di verde se lo slot è
 * sopravvissuto a quella giornata o di rosso se è quella in cui è stato
 * eliminato. Le giornate dopo l'eliminazione restano bianche, senza
 * dato: lo slot non gioca più. Sostituisce sempre il foglio "Storico"
 * intero (rigenerato da zero a ogni giornata chiusa) invece di
 * aggiornarlo in-place: più semplice e sempre coerente con lo stato
 * attuale del database, non serve leggere il file precedente.
 */
export function buildStoricoSheet(
  workbook: ExcelJS.Workbook,
  matchdayNumbers: number[],
  players: StoricoPlayerHistory[]
): void {
  const sheetName = "Storico";
  const existing = workbook.getWorksheet(sheetName);
  if (existing) workbook.removeWorksheet(existing.id);

  const sheet = workbook.addWorksheet(sheetName);

  sheet.getColumn(1).width = 28;
  sheet.getColumn(2).width = 8;
  matchdayNumbers.forEach((_, i) => {
    sheet.getColumn(i + 3).width = 18;
  });

  const headerRow = sheet.addRow([
    "giocatore",
    "slot",
    ...matchdayNumbers.map((n) => `giornata ${n}`),
  ]);
  headerRow.font = { bold: true };

  for (const player of players) {
    player.slots.forEach((slot, slotIndex) => {
      const rowValues: (string | number)[] = [
        slotIndex === 0 ? player.displayName : "",
        Number(slot.label),
      ];
      const cellStatus: ("alive" | "eliminated" | null)[] = [];

      for (const matchdayNumber of matchdayNumbers) {
        const alreadyOut =
          slot.eliminatedMatchday !== null && matchdayNumber > slot.eliminatedMatchday;
        if (alreadyOut) {
          rowValues.push("");
          cellStatus.push(null);
          continue;
        }
        const teamName = slot.picksByMatchday.get(matchdayNumber) ?? null;
        rowValues.push(teamName ?? "—");
        cellStatus.push(
          slot.eliminatedMatchday === matchdayNumber ? "eliminated" : "alive"
        );
      }

      const row = sheet.addRow(rowValues);
      if (slotIndex === 0) row.getCell(1).font = { bold: true };
      cellStatus.forEach((status, i) => {
        if (!status) return;
        const cell = row.getCell(i + 3);
        if (status === "alive") {
          cell.fill = ALIVE_FILL;
          cell.font = ALIVE_FONT;
        } else {
          cell.fill = ELIMINATED_FILL;
          cell.font = ELIMINATED_FONT;
        }
      });
    });

    sheet.addRow([]);
  }
}
