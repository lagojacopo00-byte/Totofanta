// Formattazione di un intervallo di tempo residuo in giorni/ore/minuti,
// condivisa dai conti alla rovescia della UI (schieramento in
// pick-countdown.tsx, riapertura prossima giornata in
// matchday-reopen-countdown.tsx). Mostra sempre ore e minuti insieme
// (non solo giorni+ore): deciso con l'utente il 2026-09-02.
export function formatRemaining(ms: number): string {
  if (ms <= 0) return "a momenti";
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}g ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
