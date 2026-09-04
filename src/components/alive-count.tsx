/** "N/M" slot vivi su slot iniziali: N verde se c'è ancora almeno uno
 * slot vivo, grigio se sono zero (per non dare un falso segnale di vita
 * a un giocatore ormai fuori) — M sempre grigio. Usato ovunque nello
 * storico compaia questo conteggio (il proprio riquadro e l'elenco degli
 * altri giocatori in play/[tournamentId]/page.tsx). */
export function AliveCount({ alive, total }: { alive: number; total: number }) {
  return (
    <span className="font-mono text-sm font-bold">
      <span className={alive > 0 ? "text-accent" : "text-foreground-faint"}>{alive}</span>
      <span className="text-foreground-faint">/{total}</span>
    </span>
  );
}
