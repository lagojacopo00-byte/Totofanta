// Calcola la finestra settimanale entro cui i giocatori possono schierare:
// lunedì-giovedì si sceglie, da venerdì le scelte sono chiuse e restano
// chiuse fino alla mezzanotte del lunedì successivo, quando escono i
// risultati e si riapre la scelta per la giornata seguente. È puramente
// basato sul calendario reale (non su un campo del database, che varrebbe
// per singola giornata): usato sia per il conto alla rovescia mostrato ai
// giocatori (vedi src/components/pick-countdown.tsx) sia — qui — come
// regola effettiva applicata server-side in submitPickAction. L'organizzatore
// non è soggetto a questo vincolo: le sue azioni passano da altre Server
// Actions che non chiamano queste funzioni.

export type PickPhase = "picking" | "waiting";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function computePickPhase(now: Date): { phase: PickPhase; target: Date } {
  const day = now.getDay(); // 0 dom .. 6 sab
  if (day >= 1 && day <= 4) {
    // Lunedì-giovedì: si schiera, il traguardo è giovedì 23:59:59 di
    // questa settimana.
    const target = startOfDay(addDays(now, 4 - day));
    target.setHours(23, 59, 59, 999);
    return { phase: "picking", target };
  }
  // Venerdì, sabato, domenica: si aspettano i risultati, il traguardo è
  // la mezzanotte del prossimo lunedì.
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  return { phase: "waiting", target: startOfDay(addDays(now, daysUntilMonday)) };
}

export function isPickingWindowOpen(now: Date = new Date()): boolean {
  return computePickPhase(now).phase === "picking";
}
